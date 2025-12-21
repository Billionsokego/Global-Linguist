
import React, { useState, useEffect, useCallback } from 'react';
import { LanguageSelector } from './components/LanguageSelector';
import { TextInputPanel } from './components/TextInputPanel';
import { LoadingSpinner } from './components/LoadingSpinner';
import { languages, playbackSpeeds, ttsVoices } from './constants';
import { Language } from './types';
import { translateText, textToSpeech, getPronunciationFeedback } from './services/geminiService';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useLiveTranscription } from './hooks/useLiveTranscription';
import { audioUtils } from './utils/audioUtils';

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
  </svg>
);

const SwapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
);


export default function App() {
  const [sourceLang, setSourceLang] = useState<Language>(languages[0]); // Default: English
  const [targetLang, setTargetLang] = useState<Language>(languages[5]); // Default: Spanish
  const [inputText, setInputText] = useState<string>(() => localStorage.getItem('linguist-app-input') || '');
  const [outputText, setOutputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pronunciation Practice State
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState<boolean>(false);

  // Use separate recorders for distinct functionalities
  const practiceRecorder = useAudioRecorder();
  const liveTranscriber = useLiveTranscription();
  
  // Playback speed state
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedVoice, setSelectedVoice] = useState<string>(ttsVoices[0].name);

  // Effect to update input text from the live transcriber
  useEffect(() => {
    if (liveTranscriber.isRecording || liveTranscriber.isConnecting) {
      setInputText(liveTranscriber.transcript);
    }
  }, [liveTranscriber.transcript, liveTranscriber.isRecording, liveTranscriber.isConnecting]);

  // Effect to save final input text to local storage
  useEffect(() => {
    // Only save when not actively transcribing to avoid storing partial text
    if (!liveTranscriber.isRecording && !liveTranscriber.isConnecting) {
      localStorage.setItem('linguist-app-input', inputText);
    }
  }, [inputText, liveTranscriber.isRecording, liveTranscriber.isConnecting]);

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setError(null);
    setOutputText('');
    
    // Reset practice mode on new translation
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
  
  const handleSpeak = useCallback(async () => {
      if (!outputText.trim()) return;
      setIsLoading(true);
      setError(null);
      try {
        const audioData = await textToSpeech(outputText, selectedVoice);
        await audioUtils.playAudio(audioData, playbackSpeed);
      } catch (e) {
          console.error(e);
          setError("Failed to generate audio. Please try again.");
      } finally {
          setIsLoading(false);
      }
  }, [outputText, playbackSpeed, selectedVoice]);

  const handleSwapLanguages = () => {
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);
    setInputText(outputText);
    setOutputText(inputText);
    // Reset practice mode on swap
    setIsPracticing(false); 
    setPracticeFeedback(null);
  };

  const handleMicClick = async () => {
    if (liveTranscriber.isRecording || liveTranscriber.isConnecting) {
      liveTranscriber.stopRecording();
    } else {
      setInputText(''); // Clear previous text
      liveTranscriber.startRecording();
    }
  };

  const handlePracticeClick = () => {
    setIsPracticing(true);
    setPracticeFeedback(null); // Clear previous feedback
  };

  const handleCancelPractice = () => {
      if(practiceRecorder.isRecording) {
          practiceRecorder.stopRecording(); // Stop recording if active
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
        // Do not show an error if recording was empty, user might have misclicked.
      }
    } else {
      setPracticeFeedback(null); // Clear old feedback before new recording
      practiceRecorder.startRecording();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans">
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
            isRecording={liveTranscriber.isRecording}
            isTranscribing={liveTranscriber.isConnecting}
            showMic
          />
          <TextInputPanel
            id="target-text"
            value={outputText}
            placeholder="Translation will appear here..."
            onSpeakClick={handleSpeak}
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
          />
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={handleTranslate}
            disabled={isLoading || !inputText.trim()}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            {isLoading ? <LoadingSpinner /> : 'Translate'}
            <ArrowIcon />
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
  );
}
