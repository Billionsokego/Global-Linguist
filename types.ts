
export interface Language {
  code: string;
  name: string;
}

export interface TTSVoice {
  name: string;
}

export interface ConversationTurn {
  speaker: 'user' | 'bot';
  text: string;
  lang: string;
}

export interface SavedPhrase {
  id: number;
  sourceText: string;
  translatedText: string;
  sourceLang: Language;
  targetLang: Language;
}

export interface SavedSnippet {
  id: number;
  title: string;
  content: string;
  category: string;
}
