
import { GoogleGenAI, Modality } from '@google/genai';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> => {
  try {
    const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Do not add any extra explanations, comments, or annotations. Just provide the raw translated text.\n\nText: "${text}"`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    if (response.text) {
        return response.text.trim();
    }
    
    throw new Error('No text in Gemini response');
  } catch (error) {
    console.error('Gemini translation error:', error);
    throw new Error('Failed to translate text with Gemini API.');
  }
};

export const textToSpeech = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            return base64Audio;
        }
        
        throw new Error('No audio data in Gemini response');
    } catch (error) {
        console.error('Gemini TTS error:', error);
        throw new Error('Failed to generate speech with Gemini API.');
    }
};
