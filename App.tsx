
import React, { useState, useEffect, useCallback } from 'react';
import { LanguageSelector } from './components/LanguageSelector';
import { TextInputPanel } from './components/TextInputPanel';
import { LoadingSpinner } from './components/LoadingSpinner';
import { languages, playbackSpeeds, ttsVoices, MAX_INPUT_LENGTH } from './constants';
import { Language } from './types';
import { translateText, textToSpeech, getPronunciationFeedback } from './services/geminiService';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useLiveTranscription } from './hooks/useLiveTranscription';
import { audioUtils } from './utils/audioUtils';
import { ConversationModal } from './components/ConversationModal';
import { ArrowIcon, SwapIcon, ConversationIcon } from './components/icons';

export default function App() {
  const [sourceLang, setSourceLang] = useState<Language>(languages[0]); // Default: English
  const [targetLang, setTargetLang] = useState<Language>(languages[5]); // Default: Spanish
  const [inputText, setInputText] = useState<string>(() => localStorage.getItem('linguist-app-input') || '');
  const [outputText, setOutputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConversationMode, setIsConversationMode] = useState<boolean>(false);

  // Pronunciation Practice State
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState<boolean>(false);

  // Recorders and Transcriber
  const practiceRecorder = useAudioRecorder();
  const liveTranscriber = useLiveTranscription();
  
  // Playback & Voice State
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedVoice, setSelectedVoice] = useState<string>(ttsVoices[0].name);

  // New state for Instant Interpreter mode
  const [isVoiceOverActive, setIsVoiceOverActive] = useState(false);

  // Effect to update input text from any live transcription
  useEffect(() => {
    if (liveTranscriber.isRecording || liveTranscriber.isConnecting) {
      setInputText(liveTranscriber.transcript);
    }
  }, [liveTranscriber.transcript, liveTranscriber.isRecording, liveTranscriber.isConnecting]);

  // Effect to save final input text to local storage
  useEffect(() => {
    if (!liveTranscriber.isRecording && !liveTranscriber.isConnecting) {
      localStorage.setItem('linguist-app-input', inputText);
    }
  }, [inputText, liveTranscriber.isRecording, liveTranscriber.isConnecting]);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setError(null);
    setOutputText('');
    setIsPracticing(false);
    setPracticeFeedback(null);
    try {
      const translated = await translateText(inputText, sourceLang.name, targetLang.name);
      setOutputText(translated);
    } catch (e) {
      console.error(e);
      setError('Failed to translate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputText, sourceLang, targetLang]);
  
  const handleSpeak = useCallback(async (textToSpeak: string) => {
      if (!textToSpeak.trim()) return;
      setIsLoading(true);
      setError(null);
      try {
        const audioData = await textToSpeech(textToSpeak, selectedVoice);
        await audioUtils.playAudio(audioData, playbackSpeed);
      } catch (e) {
          console.error(e);
          setError("Failed to generate audio. Please try again.");
      } finally {
          setIsLoading(false);
      }
  }, [playbackSpeed, selectedVoice]);

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(outputText);
    setOutputText(inputText);
    setIsPracticing(false); 
    setPracticeFeedback(null);
  };

  const handleMicClick = () => {
    setIsVoiceOverActive(false); // Ensure voice-over mode is off
    if (liveTranscriber.isRecording || liveTranscriber.isConnecting) {
      liveTranscriber.stopRecording();
    } else {
      setInputText('');
      liveTranscriber.startRecording();
    }
  };
  
  const handleVoiceOverClick = () => {
    if (liveTranscriber.isRecording) {
      liveTranscriber.stopRecording();
    } else {
      setInputText('');
      setOutputText('');
      setIsVoiceOverActive(true);
      liveTranscriber.startRecording();
    }
  };
  
  const processVoiceOverTurn = useCallback(async () => {
      const finalTranscript = liveTranscriber.transcript;
      setIsVoiceOverActive(false);

      if (!finalTranscript.trim()) {
        liveTranscriber.resetTranscript();
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const translatedText = await translateText(finalTranscript, sourceLang.name, targetLang.name);
        setOutputText(translatedText);
        await handleSpeak(translatedText);
      } catch (e) {
        console.error(e);
        setError("Voice-over failed. Please try again.");
      } finally {
        setIsLoading(false);
        liveTranscriber.resetTranscript();
      }
  }, [sourceLang, targetLang, handleSpeak, liveTranscriber]);

  useEffect(() => {
    if (!liveTranscriber.isRecording && isVoiceOverActive) {
        processVoiceOverTurn();
    }
  }, [liveTranscriber.isRecording, isVoiceOverActive, processVoiceOverTurn]);


  const handlePracticeClick = () => {
    setIsPracticing(true);
    setPracticeFeedback(null);
  };

  const handleCancelPractice = () => {
      if(practiceRecorder.isRecording) {
          practiceRecorder.stopRecording();
      }
      setIsPracticing(false);
      setPracticeFeedback(null);
  }

  const handleRecordPracticeClick = async () => {
    if (practiceRecorder.isRecording) {
      setIsFetchingFeedback(true);
      const audioBase64 = await practiceRecorder.stopRecording();
      if (audioBase64 && outputText) {
          try {
            const feedback = await getPronunciationFeedback(outputText, targetLang.name, audioBase64);
            setPracticeFeedback(feedback);
          } catch (e) {
            console.error(e);
            setPracticeFeedback('Sorry, I couldn\'t analyze your pronunciation. Please try again.');
          } finally {
            setIsFetchingFeedback(false);
          }
      } else {
        setIsFetchingFeedback(false);
      }
    } else {
      setPracticeFeedback(null);
      practiceRecorder.startRecording();
    }
  };

  return (
    <>
    <div className="min-h-dvh bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans">
      <header className="w-full max-w-5xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
          Global Linguist
        </h1>
        <p className="text-gray-400 mt-2 text-lg">Your AI Language Teacher & Interpreter</p>
      </header>

      <main className="w-full max-w-5xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <LanguageSelector selectedLang={sourceLang} onSelect={setSourceLang} />
          <button 
            onClick={handleSwapLanguages} 
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
            aria-label="Swap languages"
          >
            <SwapIcon/>
          </button>
          <LanguageSelector selectedLang={targetLang} onSelect={setTargetLang} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextInputPanel
            id="source-text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text or start speaking..."
            onMicClick={handleMicClick}
            isRecording={liveTranscriber.isRecording && !isVoiceOverActive}
            isTranscribing={liveTranscriber.isConnecting && !isVoiceOverActive}
            showMic
            maxLength={MAX_INPUT_LENGTH}
          />
          <TextInputPanel
            id="target-text"
            value={outputText}
            placeholder="Translation will appear here..."
            onSpeakClick={() => handleSpeak(outputText)}
            readOnly
            showSpeaker
            isLoading={isLoading}
            showPractice={!isPracticing}
            onPracticeClick={handlePracticeClick}
            onCancelPracticeClick={handleCancelPractice}
            isPracticing={isPracticing}
            isRecordingPractice={practiceRecorder.isRecording}
            onRecordPracticeClick={handleRecordPracticeClick}
            feedback={practiceFeedback}
            isFetchingFeedback={isFetchingFeedback}
            playbackSpeed={playbackSpeed}
            onPlaybackSpeedChange={setPlaybackSpeed}
            playbackSpeeds={playbackSpeeds}
            voices={ttsVoices}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            showVoiceOver={!isPracticing}
            onVoiceOverClick={handleVoiceOverClick}
            isVoiceOverActive={liveTranscriber.isRecording && isVoiceOverActive}
            isVoiceOverConnecting={liveTranscriber.isConnecting && isVoiceOverActive}
          />
        </div>

        <div className="flex justify-center mt-4 flex-wrap gap-4">
          <button
            onClick={handleTranslate}
            disabled={isLoading || !inputText.trim()}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            {isLoading ? <LoadingSpinner /> : 'Translate'}
            <ArrowIcon />
          </button>
           <button
            onClick={() => setIsConversationMode(true)}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-cyan-600 rounded-lg font-semibold hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Start Conversation
            <ConversationIcon />
          </button>
        </div>

        {(error || liveTranscriber.error) && (
            <div className="mt-4 text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                <p>{error || liveTranscriber.error}</p>
            </div>
        )}
      </main>
      <footer className="w-full max-w-5xl text-center mt-auto pt-8">
        <p className="text-gray-500 text-sm">Powered by Gemini API</p>
      </footer>
    </div>
    {isConversationMode && (
      <ConversationModal
        isOpen={isConversationMode}
        onClose={() => setIsConversationMode(false)}
        sourceLang={sourceLang}
        targetLang={targetLang}
        selectedVoice={selectedVoice}
        playbackSpeed={playbackSpeed}
      />
    )}
    </>
  );
}
