
// A global AudioContext to avoid creating multiple instances
let audioContext: AudioContext | null = null;
const getAudioContext = (): AudioContext => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 24000,
        });
    }
    return audioContext;
};

// Decodes a base64 string into a Uint8Array
const decode = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

// Decodes raw PCM audio data into an AudioBuffer
const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number
): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
};

// Plays the given base64 encoded audio string
const playAudio = async (base64Audio: string): Promise<void> => {
    const ctx = getAudioContext();
    const decodedBytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
};

export const audioUtils = {
    playAudio,
};
