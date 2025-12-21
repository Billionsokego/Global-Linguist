
import { GoogleGenAI, Modality } from '@google/genai';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const detectLanguage = async (text: string): Promise<string> => {
  try {
    const prompt = `Identify the language of the following text. Respond with only the name of the language in English (e.g., "English", "Spanish", "French"). Do not add any other words, explanations, or punctuation.\n\nText: "${text}"`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    if (response.text) {
      // Gemini might add a period at the end.
      return response.text.trim().replace('.', '');
    }
    
    throw new Error('Could not detect language from Gemini response.');
  } catch (error) {
    console.error('Gemini language detection error:', error);
    throw new Error('Failed to detect language with Gemini API.');
  }
};

export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<{ translatedText: string, detectedSourceLanguage: string | null }> => {
  let actualSourceLang = sourceLang;
  let detectedSourceLanguage: string | null = null;

  if (sourceLang === 'Auto-detect') {
    if (!text.trim()) {
      return { translatedText: '', detectedSourceLanguage: null };
    }
    try {
      detectedSourceLanguage = await detectLanguage(text);
      actualSourceLang = detectedSourceLanguage;
    } catch (error) {
       console.error('Auto-detection failed:', error);
       throw new Error('Could not auto-detect the language. Please select it manually.');
    }
  }

  try {
    const prompt = `Translate the following text from ${actualSourceLang} to ${targetLang}. Do not add any extra explanations, comments, or annotations. Just provide the raw translated text.\n\nText: "${text}"`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    if (response.text) {
        return { translatedText: response.text.trim(), detectedSourceLanguage };
    }
    
    throw new Error('No text in Gemini response');
  } catch (error) {
    console.error('Gemini translation error:', error);
    throw new Error('Failed to translate text with Gemini API.');
  }
};

export const textToSpeech = async (text: string, voiceName: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
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

export const getPronunciationFeedback = async (
  phrase: string,
  language: string,
  audioBase64: string,
): Promise<string> => {
    try {
        const audioPart = {
            inlineData: {
                mimeType: 'audio/webm',
                data: audioBase64,
            },
        };

        const textPart = {
            text: `You are an expert ${language} pronunciation coach. The user is practicing the phrase: "${phrase}".
Analyze their pronunciation from the provided audio recording and give specific, constructive feedback.

Your feedback must:
1. Start with a positive and encouraging remark.
2. Pinpoint specific words or phonemes (sounds) that were mispronounced.
3. Describe the error simply (e.g., "the 'a' sound was a bit too open" or "the stress on 'palabra' was on the wrong syllable").
4. Provide a clear, actionable suggestion for how to correct it (e.g., "Try making your mouth wider for the 'a' sound, like in the word 'cat'" or "The stress should be on the second syllable: pa-LA-bra").
5. Keep the total feedback concise, around 2-4 sentences.

Example Feedback (for Spanish 'perro'): "Great attempt! The 'rr' sound was a little soft. Try tapping the tip of your tongue against the roof of your mouth multiple times to get that classic Spanish trill. You've got the rest of it down perfectly!"

Do not just say "good job" or "it was unclear". Be specific and helpful.`
        };

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [textPart, audioPart] },
        });

        if (response.text) {
            return response.text.trim();
        }

        throw new Error('No text in Gemini feedback response');
    } catch (error) {
        console.error('Gemini feedback error:', error);
        throw new Error('Failed to get pronunciation feedback from Gemini API.');
    }
};