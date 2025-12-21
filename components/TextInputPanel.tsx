
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface TextInputPanelProps {
  id: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  readOnly?: boolean;
  showMic?: boolean;
  isListening?: boolean;
  onMicClick?: () => void;
  showSpeaker?: boolean;
  isLoading?: boolean;
  onSpeakClick?: () => void;
}

const MicIcon = ({ isListening }: { isListening: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 0v-1.5a6 6 0 0 0-12 0v1.5m12 0v-1.5a6 6 0 0 0-12 0v1.5m0-6.75A.75.75 0 0 1 6 6h12a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75V6.75Z" />
    </svg>
);

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400 hover:text-white transition-colors">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
    </svg>
);

export const TextInputPanel: React.FC<TextInputPanelProps> = ({
  id,
  value,
  onChange,
  placeholder,
  readOnly = false,
  showMic = false,
  isListening = false,
  onMicClick,
  showSpeaker = false,
  isLoading = false,
  onSpeakClick
}) => {
  return (
    <div className="relative w-full h-64 bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full h-full p-4 bg-transparent text-white placeholder-gray-500 rounded-lg focus:outline-none resize-none"
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {showMic && onMicClick && (
          <button onClick={onMicClick} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label={isListening ? 'Stop recording' : 'Start recording'}>
            <MicIcon isListening={isListening} />
          </button>
        )}
        {showSpeaker && (
          <button onClick={onSpeakClick} disabled={isLoading || !value} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Speak translation">
            {isLoading ? <LoadingSpinner size="sm"/> : <SpeakerIcon />}
          </button>
        )}
      </div>
    </div>
  );
};
