
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { TTSVoice } from '../types';

interface TextInputPanelProps {
  id: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  readOnly?: boolean;
  showMic?: boolean;
  isRecording?: boolean;
  isTranscribing?: boolean;
  onMicClick?: () => void;
  showSpeaker?: boolean;
  isLoading?: boolean;
  onSpeakClick?: () => void;
  showPractice?: boolean;
  onPracticeClick?: () => void;
  onCancelPracticeClick?: () => void;
  isPracticing?: boolean;
  isRecordingPractice?: boolean;
  onRecordPracticeClick?: () => void;
  feedback?: string | null;
  isFetchingFeedback?: boolean;
  playbackSpeed?: number;
  onPlaybackSpeedChange?: (speed: number) => void;
  playbackSpeeds?: number[];
  voices?: TTSVoice[];
  selectedVoice?: string;
  onVoiceChange?: (voiceName: string) => void;
}

const MicIcon = ({ isRecording }: { isRecording: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 6v8a4 4 0 0 1-8 0V6a4 4 0 0 1 8 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 21h4" />
    </svg>
);

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400 hover:text-white transition-colors">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
    </svg>
);

const PracticeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400 hover:text-white transition-colors">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.627 48.627 0 0 1 12 20.904a48.627 48.627 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400 hover:text-white transition-colors">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

export const TextInputPanel: React.FC<TextInputPanelProps> = ({
  id,
  value,
  onChange,
  placeholder,
  readOnly = false,
  showMic = false,
  isRecording = false,
  isTranscribing = false,
  onMicClick,
  showSpeaker = false,
  isLoading = false,
  onSpeakClick,
  showPractice = false,
  onPracticeClick,
  onCancelPracticeClick,
  isPracticing = false,
  isRecordingPractice = false,
  onRecordPracticeClick,
  feedback = null,
  isFetchingFeedback = false,
  playbackSpeed = 1,
  onPlaybackSpeedChange,
  playbackSpeeds = [0.75, 1, 1.25],
  voices = [],
  selectedVoice,
  onVoiceChange
}) => {
  return (
    <div className="relative w-full h-64 bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full flex-grow p-4 bg-transparent text-white placeholder-gray-500 rounded-lg focus:outline-none resize-none"
      />

       {(isPracticing || feedback || isFetchingFeedback) && (
        <div className="flex-shrink-0 p-3 border-t border-gray-700 bg-gray-800/50">
            {isFetchingFeedback ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <LoadingSpinner size="sm"/>
                    <span>Analyzing pronunciation...</span>
                </div>
            ) : feedback ? (
                <p className="text-sm text-cyan-300 italic">{feedback}</p>
            ) : (
                <p className="text-sm text-gray-400">Click the microphone to record your pronunciation.</p>
            )}
        </div>
      )}

      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {showMic && onMicClick && (
          <button 
            onClick={onMicClick} 
            disabled={isTranscribing} 
            className="p-2 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isTranscribing ? <LoadingSpinner size="sm" /> : <MicIcon isRecording={isRecording} />}
          </button>
        )}
        
        {isPracticing ? (
            <>
                <button onClick={onRecordPracticeClick} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label={isRecordingPractice ? 'Stop recording' : 'Record pronunciation'}>
                    <MicIcon isRecording={isRecordingPractice} />
                </button>
                 <button onClick={onCancelPracticeClick} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="Cancel practice">
                    <CloseIcon />
                </button>
            </>
        ) : (
            <>
                {showSpeaker && (
                  <div className="flex items-center gap-2 bg-gray-700/50 rounded-full p-1">
                    {voices.length > 0 && onVoiceChange && (
                      <select
                        value={selectedVoice}
                        onChange={(e) => onVoiceChange(e.target.value)}
                        className="text-xs bg-gray-700 text-white rounded-full focus:ring-2 focus:ring-purple-500 focus:outline-none py-1 pl-2 pr-6"
                        aria-label="Select voice"
                      >
                        {voices.map(voice => (
                          <option key={voice.name} value={voice.name}>{voice.name}</option>
                        ))}
                      </select>
                    )}

                    <div className="flex items-center gap-1 bg-gray-700 rounded-full">
                        {playbackSpeeds.map((speed) => (
                            <button
                                key={speed}
                                onClick={() => onPlaybackSpeedChange && onPlaybackSpeedChange(speed)}
                                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                                    playbackSpeed === speed ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-600'
                                }`}
                                aria-pressed={playbackSpeed === speed}
                            >
                                {speed}x
                            </button>
                        ))}
                    </div>
                    <button onClick={onSpeakClick} disabled={isLoading || !value} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Speak translation">
                      {isLoading ? <LoadingSpinner size="sm"/> : <SpeakerIcon />}
                    </button>
                  </div>
                )}
                {showPractice && onPracticeClick && (
                   <button onClick={onPracticeClick} disabled={isLoading || !value} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Practice pronunciation">
                        <PracticeIcon />
                    </button>
                )}
            </>
        )}
      </div>
    </div>
  );
};
