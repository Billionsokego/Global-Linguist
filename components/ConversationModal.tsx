
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Language, ConversationTurn } from '../types';
import { useLiveTranscription } from '../hooks/useLiveTranscription';
import { translateText, textToSpeech } from '../services/geminiService';
import { audioUtils } from '../utils/audioUtils';
import { LoadingSpinner } from './LoadingSpinner';
import { languages } from '../constants';

interface ConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceLang: Language;
  targetLang: Language;
  selectedVoice: string;
  playbackSpeed: number;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const MicIcon = ({ isRecording, isConnecting, isBotSpeaking }: { isRecording: boolean, isConnecting: boolean, isBotSpeaking: boolean }) => (
    <div className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-colors duration-300 ${isRecording ? 'bg-red-500' : 'bg-purple-600'}`}>
        {(isConnecting || isBotSpeaking) && <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"><LoadingSpinner/></div>}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-6-6v0a6 6 0 0 0-6 6v1.5m6 7.5v3.75m-3.75 0h7.5" />
        </svg>
    </div>
);


export const ConversationModal: React.FC<ConversationModalProps> = ({ isOpen, onClose, sourceLang, targetLang, selectedVoice, playbackSpeed }) => {
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [currentSourceLang, setCurrentSourceLang] = useState<Language>(sourceLang);
  const [isBotSpeaking, setIsBotSpeaking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const liveTranscriber = useLiveTranscription();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const processUserTurn = useCallback(async (text: string) => {
      if (!text.trim()) return;
      
      setError(null);
      // Add user turn immediately with current language name (or "Auto-detect")
      setConversation(prev => [...prev, { speaker: 'user', text, lang: currentSourceLang.name }]);
      setIsBotSpeaking(true);
      
      try {
        const { translatedText, detectedSourceLanguage } = await translateText(text, currentSourceLang.name, targetLang.name);
        
        let finalSourceLang = currentSourceLang;
        // If language was detected, update the state for subsequent turns
        if (detectedSourceLanguage) {
            const detectedLangObj = languages.find(lang => lang.name.toLowerCase() === detectedSourceLanguage.toLowerCase());
            if (detectedLangObj) {
                setCurrentSourceLang(detectedLangObj);
                finalSourceLang = detectedLangObj;

                // Update the last user turn with the detected language name
                setConversation(prev => {
                    const newConv = [...prev];
                    const lastTurn = newConv[newConv.length - 1];
                    if (lastTurn && lastTurn.speaker === 'user') {
                        lastTurn.lang = finalSourceLang.name;
                    }
                    return newConv;
                });
            }
        }

        setConversation(prev => [...prev, { speaker: 'bot', text: translatedText, lang: targetLang.name }]);
        const audioData = await textToSpeech(translatedText, selectedVoice);
        await audioUtils.playAudio(audioData, playbackSpeed);
      } catch (e: any) {
          console.error(e);
          const errorMessage = e.message || 'Sorry, an error occurred. Please try again.';
          setError(errorMessage);
          setConversation(prev => [...prev, { speaker: 'bot', text: `Error: ${errorMessage}`, lang: targetLang.name }]);
      } finally {
          setIsBotSpeaking(false);
      }

  }, [currentSourceLang, targetLang, selectedVoice, playbackSpeed]);
  
  // This effect triggers when a recording session ends
  useEffect(() => {
    const finalTranscript = liveTranscriber.transcript;
    if (!liveTranscriber.isRecording && finalTranscript) {
        processUserTurn(finalTranscript);
        liveTranscriber.resetTranscript(); // Clear it for the next turn
    }
  }, [liveTranscriber.isRecording, liveTranscriber.transcript, liveTranscriber, processUserTurn]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, liveTranscriber.transcript]);

  const handleMicClick = () => {
      if (isBotSpeaking || liveTranscriber.isConnecting) return;

      if (liveTranscriber.isRecording) {
          liveTranscriber.stopRecording();
      } else {
          liveTranscriber.resetTranscript();
          liveTranscriber.startRecording();
      }
  };
  
  const handleClose = () => {
      if (liveTranscriber.isRecording) {
          liveTranscriber.stopRecording();
      }
      onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex flex-col z-50">
      <header className="flex-shrink-0 flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
        <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          {currentSourceLang.name} → {targetLang.name}
        </h2>
        <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <CloseIcon />
        </button>
      </header>
      
      <main className="flex-grow p-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
            {conversation.map((turn, index) => (
                <div key={index} className={`flex flex-col ${turn.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${turn.speaker === 'user' ? 'bg-purple-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                        <p className="text-white">{turn.text}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-1">{turn.lang}</p>
                </div>
            ))}
            {liveTranscriber.isRecording && (
                 <div className="flex flex-col items-end">
                    <div className="max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl bg-purple-600/50 rounded-br-none">
                        <p className="text-white/70 italic">{liveTranscriber.transcript || "Listening..."}</p>
                    </div>
                </div>
            )}
             <div ref={transcriptEndRef} />
        </div>
      </main>

      <footer className="flex-shrink-0 flex flex-col items-center justify-center p-6 bg-gray-900 border-t border-gray-700">
        <button 
            onClick={handleMicClick}
            disabled={isBotSpeaking || liveTranscriber.isConnecting}
            className="disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-200 transform hover:scale-105"
            aria-label={liveTranscriber.isRecording ? "Stop listening" : "Start listening"}
        >
            <MicIcon isRecording={liveTranscriber.isRecording} isConnecting={liveTranscriber.isConnecting} isBotSpeaking={isBotSpeaking}/>
        </button>
        <p className="text-gray-400 text-sm mt-3 min-h-[1.25rem]">
            {liveTranscriber.isRecording ? 'Listening...' : (isBotSpeaking ? 'Speaking...' : 'Tap the mic to speak')}
        </p>
         {(error || liveTranscriber.error) && (
            <p className="text-red-400 text-sm mt-2">{error || liveTranscriber.error}</p>
        )}
      </footer>
    </div>
  );
};