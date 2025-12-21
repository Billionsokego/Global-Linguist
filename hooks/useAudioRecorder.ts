
import { useState, useRef, useCallback } from 'react';

type AudioRecorderState = {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => Promise<string | null>; // Returns base64 string
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      // remove the prefix e.g. 'data:audio/webm;base64,'
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const useAudioRecorder = (): AudioRecorderState => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        audioChunksRef.current = [];
        setIsRecording(true);
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  }, [isRecording]);

  const stopRecording = useCallback((): Promise<string | null> => {
    return new Promise(async (resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        // Stop all media tracks to release the microphone
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

        if (audioChunksRef.current.length === 0) {
            setIsRecording(false);
            resolve(null);
            return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64String = await blobToBase64(audioBlob);
        audioChunksRef.current = [];
        setIsRecording(false);
        resolve(base64String);
      };

      mediaRecorderRef.current.stop();
    });
  }, [isRecording]);

  return { isRecording, startRecording, stopRecording };
};
