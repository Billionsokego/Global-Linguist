
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
