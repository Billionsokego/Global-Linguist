
import { useState, useEffect, useRef } from 'react';

// FIX: Add type definitions for the Speech Recognition API to resolve TypeScript errors.
// These interfaces describe the shape of the API, which is not included in default TypeScript DOM typings.
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

// FIX: Extend the global Window interface to include SpeechRecognition and webkitSpeechRecognition.
// This informs TypeScript that these properties exist on the window object.
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

interface SpeechRecognitionOptions {
  lang?: string;
}

const getSpeechRecognition = () => {
  if (typeof window !== 'undefined') {
    return window.SpeechRecognition || window.webkitSpeechRecognition;
  }
  return undefined;
};

// FIX: Renamed constant to avoid conflict with the 'SpeechRecognition' interface name.
const SpeechRecognitionAPI = getSpeechRecognition();

export const useSpeechRecognition = (options: SpeechRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  // FIX: Use the 'SpeechRecognition' interface for the ref type, which is now available.
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // FIX: Use the renamed constant 'SpeechRecognitionAPI'.
    if (!SpeechRecognitionAPI) {
      console.warn('Speech Recognition API not supported by this browser.');
      return;
    }

    // FIX: Instantiate using the renamed constant.
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = options.lang || 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(prev => prev + finalTranscript);
    };
    
    recognition.onstart = () => {
        setIsListening(true);
    };

    recognition.onend = () => {
        setIsListening(false);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [options.lang]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const resetTranscript = () => {
    setTranscript('');
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    // FIX: Use the renamed constant.
    hasRecognitionSupport: !!SpeechRecognitionAPI,
  };
};
