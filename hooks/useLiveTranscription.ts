
import { useState, useRef, useCallback, useEffect } from 'react';
// FIX: LiveSession is not an exported member of '@google/genai'. It has been removed from the import.
// Modality has been added to correctly configure responseModalities.
import { GoogleGenAI, Blob as GenaiBlob, Modality } from '@google/genai';

// Helper to encode Uint8Array to base64
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Helper to create the Blob object for the API from raw audio data
function createPcmBlob(data: Float32Array): GenaiBlob {
    const l = data.length;
    const int16 = new Int16Array(l);
    // Convert Float32 to Int16 (PCM format)
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

// FIX: Infer the LiveSession type from the GoogleGenAI class instance method, as it is not an exported type.
type LiveSession = Awaited<ReturnType<InstanceType<typeof GoogleGenAI>['live']['connect']>>;

export const useLiveTranscription = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const aiRef = useRef<GoogleGenAI | null>(null);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    // Use a ref to accumulate the full transcript to avoid issues with state closures
    const fullTranscriptRef = useRef('');

    const stopRecording = useCallback(async () => {
        if (!isRecording && !isConnecting) return;
        
        setIsRecording(false);
        setIsConnecting(false);

        // Disconnect the audio processing nodes
        try {
             if (scriptProcessorRef.current) {
                scriptProcessorRef.current.disconnect();
                scriptProcessorRef.current = null;
            }
            if (sourceNodeRef.current) {
                sourceNodeRef.current.disconnect();
                sourceNodeRef.current = null;
            }
        } catch(e) {
            console.warn("Error disconnecting audio nodes:", e);
        }

        // Stop the microphone tracks
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        // Close the audio context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
           await audioContextRef.current.close();
           audioContextRef.current = null;
        }

        // Close the Gemini session
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.warn("Error closing live session:", e);
            }
            sessionPromiseRef.current = null;
        }

    }, [isRecording, isConnecting]);

    const startRecording = useCallback(async () => {
        if (isRecording || isConnecting) return;
        
        fullTranscriptRef.current = '';
        setTranscript('');
        setIsConnecting(true);
        setError(null);

        try {
            if (!aiRef.current) {
                const API_KEY = process.env.API_KEY;
                if (!API_KEY) throw new Error("API_KEY environment variable not set");
                aiRef.current = new GoogleGenAI({ apiKey: API_KEY });
            }
            const ai = aiRef.current;
            
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const audioContext = audioContextRef.current;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        setIsRecording(true);
                        
                        sourceNodeRef.current = audioContext.createMediaStreamSource(streamRef.current!);
                        scriptProcessorRef.current = audioContext.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createPcmBlob(inputData);
                            
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };

                        sourceNodeRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContext.destination);
                    },
                    onmessage: (message) => {
                        const newText = message.serverContent?.inputTranscription?.text;
                        if (newText) {
                            fullTranscriptRef.current += newText;
                            setTranscript(fullTranscriptRef.current);
                        }
                    },
                    onerror: (e) => {
                        console.error('Live session error:', e);
                        setError('A connection error occurred during transcription.');
                        stopRecording();
                    },
                    onclose: (e) => {
                        if (isRecording) {
                             stopRecording();
                        }
                    },
                },
                config: {
                    inputAudioTranscription: {},
                    // FIX: Per Gemini API guidelines, responseModalities MUST contain exactly one element, Modality.AUDIO.
                    responseModalities: [Modality.AUDIO],
                }
            });

            // Handle potential rejection of the promise
            sessionPromiseRef.current.catch(err => {
                 console.error('Failed to connect live session:', err);
                 setError('Could not connect to the transcription service.');
                 stopRecording();
            });

        } catch (err) {
            console.error('Failed to start recording:', err);
            setError('Could not access the microphone.');
            setIsConnecting(false);
            setIsRecording(false);
        }
    }, [isRecording, isConnecting, stopRecording]);
    
    // Cleanup effect to stop recording if the component unmounts
    useEffect(() => {
        return () => {
            if (isRecording || isConnecting) {
                stopRecording();
            }
        };
    }, [isRecording, isConnecting, stopRecording]);

    return { isRecording, isConnecting, transcript, error, startRecording, stopRecording };
};
