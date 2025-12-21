
import { Language, TTSVoice } from './types';

export const languages: Language[] = [
  { code: 'auto', name: 'Auto-detect' },
  { code: 'en-US', name: 'English' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'pt-BR', name: 'Portuguese' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)' },
  { code: 'ar-SA', name: 'Arabic' },
];

export const playbackSpeeds: number[] = [0.5, 0.75, 1, 1.25, 1.5];

export const ttsVoices: TTSVoice[] = [
  { name: 'Kore' },
  { name: 'Puck' },
  { name: 'Charon' },
  { name: 'Fenrir' },
  { name: 'Zephyr' },
];

export const MAX_INPUT_LENGTH = 5000;