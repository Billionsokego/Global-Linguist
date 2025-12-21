
import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { TTSVoice } from '../types';
import { MicIcon, SpeakerIcon, PracticeIcon, CloseIcon, VoiceOverIcon, BookmarkIcon, BookmarkSquareIcon, ClipboardIcon, CheckIcon } from './icons';

interface TextInputPanelProps {
  id: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  readOnly?: boolean;
  isMirrored?: boolean;
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
  showVoiceOver?: boolean;
  onVoiceOverClick?: () => void;
  isVoiceOverActive?: boolean;
  isVoiceOverConnecting?: boolean;
  maxLength?: number;
  showSaveButton?: boolean;
  onSavePhrase?: () => void;
  showSaveSnippetButton?: boolean;
  onSaveSnippet?: (content: string) => void;
  showCopyButton?: boolean;
}

export const TextInputPanel: React.FC<TextInputPanelProps> = ({
  id,
  value,
  onChange,
  placeholder,
  readOnly = false,
  isMirrored = false,
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
  onVoiceChange,
  showVoiceOver = false,
  onVoiceOverClick,
  isVoiceOverActive = false,
  isVoiceOverConnecting = false,
  maxLength,
  showSaveButton = false,
  onSavePhrase,
  showSaveSnippetButton = false,
  onSaveSnippet,
  showCopyButton = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const hasControls = showMic || showSpeaker || showPractice || showVoiceOver || isPracticing || showSaveButton || showSaveSnippetButton || showCopyButton;
  const showControlBar = hasControls || (maxLength && !readOnly);
  const currentLength = value.length;
  const isNearingLimit = maxLength && currentLength > maxLength * 0.9;
  const isOverLimit = maxLength && currentLength > maxLength;

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
  };


  return (
    <div className="w-full min-h-64 bg-gray-800 rounded-lg border border-gray-700 flex flex-col overflow-hidden">
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        maxLength={maxLength}
        className={`w-full flex-grow p-4 bg-transparent placeholder-gray-500 focus:outline-none resize-none ${readOnly && isMirrored ? 'text-white/70 italic' : 'text-white'}`}
      />

      {/* Container for feedback and controls */}
      {showControlBar && (
        <div className="flex-shrink-0 p-2 border-t border-gray-700 bg-gray-800/60 flex flex-col gap-2">
            {(isPracticing || feedback || isFetchingFeedback) && (
              <div className="px-2 text-sm">
                  {isFetchingFeedback ? (
                      <div className="flex items-center gap-2 text-gray-400">
                          <LoadingSpinner size="sm"/>
                          <span>Analyzing pronunciation...</span>
                      </div>
                  ) : feedback ? (
                      <p className="text-cyan-300 italic">{feedback}</p>
                  ) : isPracticing ? (
                      <p className="text-gray-400">Click the microphone to record your pronunciation.</p>
                  ) : null}
              </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Left Side: Counter */}
              <div className="flex-shrink-0">
                  {maxLength && !readOnly && (
                      <span className={`text-xs font-mono transition-colors ${isOverLimit ? 'text-red-500 font-bold' : isNearingLimit ? 'text-yellow-400' : 'text-gray-400'}`}>
                          {currentLength}/{maxLength}
                      </span>
                  )}
              </div>
              
              {/* Right Side: Buttons */}
              <div className="flex items-center justify-end gap-2 flex-wrap">
                {showMic && onMicClick && (
                  <button 
                    onClick={onMicClick} 
                    disabled={isTranscribing || isRecording} 
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
                          <div className="flex items-center gap-2 bg-gray-700/50 rounded-full p-1 flex-wrap">
                            {voices && voices.length > 0 && onVoiceChange && (
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

                            {playbackSpeeds && (
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
                            )}
                            <button onClick={onSpeakClick} disabled={isLoading || !value} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Speak translation">
                              {isLoading ? <LoadingSpinner size="sm"/> : <SpeakerIcon />}
                            </button>
                          </div>
                        )}
                        
                        {showVoiceOver && onVoiceOverClick && (
                          <button onClick={onVoiceOverClick} disabled={isLoading || isRecording} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Instant Interpreter">
                                {isVoiceOverConnecting ? <LoadingSpinner size="sm"/> : <VoiceOverIcon isActive={isVoiceOverActive}/>}
                            </button>
                        )}
                        
                        {showCopyButton && (
                           <button onClick={handleCopy} disabled={!value} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Copy text">
                               {isCopied ? <CheckIcon /> : <ClipboardIcon />}
                           </button>
                        )}

                        {showSaveButton && onSavePhrase && (
                           <button onClick={onSavePhrase} disabled={!value} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Save to phrasebook">
                               <BookmarkIcon />
                           </button>
                        )}
                        
                        {showSaveSnippetButton && onSaveSnippet && (
                           <button onClick={() => onSaveSnippet(value)} disabled={!value} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Save as snippet">
                               <BookmarkSquareIcon />
                           </button>
                        )}

                        {showPractice && onPracticeClick && (
                          <button onClick={onPracticeClick} disabled={isLoading || !value || isRecording} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Practice pronunciation">
                                <PracticeIcon />
                            </button>
                        )}
                    </>
                )}
              </div>
            </div>
        </div>
      )}
    </div>
  );
};
