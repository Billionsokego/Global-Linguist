
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LanguageSelector } from './components/LanguageSelector';
import { TextInputPanel } from './components/TextInputPanel';
import { LoadingSpinner } from './components/LoadingSpinner';
import { languages, playbackSpeeds, ttsVoices, MAX_INPUT_LENGTH } from './constants';
import { Language, SavedPhrase, SavedSnippet } from './types';
import { translateText, translateTextStream, textToSpeech, getPronunciationFeedback } from './services/geminiService';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useLiveTranscription } from './hooks/useLiveTranscription';
import { audioUtils } from './utils/audioUtils';
import { ConversationModal } from './components/ConversationModal';
import { PhrasebookModal } from './components/PhrasebookModal';
import { SnippetsModal } from './components/SnippetsModal';
import { SaveSnippetModal } from './components/SaveSnippetModal';
import { ArrowIcon, SwapIcon, ConversationIcon, BookOpenIcon, ClipboardDocumentListIcon } from './components/icons';

export default function App() {
  const [sourceLang, setSourceLang] = useState<Language>(languages[0]); // Default: Auto-detect
  const [targetLang, setTargetLang] = useState<Language>(languages[6]); // Default: Spanish
  const [inputText, setInputText] = useState<string>(() => localStorage.getItem('linguist-app-input') || '');
  const [outputText, setOutputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isConversationMode, setIsConversationMode] = useState<boolean>(false);
  const [isPhrasebookOpen, setIsPhrasebookOpen] = useState<boolean>(false);
  const [isSnippetsModalOpen, setIsSnippetsModalOpen] = useState<boolean>(false);
  const [snippetToSave, setSnippetToSave] = useState<{content: string} | null>(null);


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

  // Phrasebook state
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>(() => {
      const stored = localStorage.getItem('linguist-phrasebook');
      return stored ? JSON.parse(stored) : [];
  });
  
  // Snippet state
  const [savedSnippets, setSavedSnippets] = useState<SavedSnippet[]>(() => {
    const stored = localStorage.getItem('linguist-snippets');
    return stored ? JSON.parse(stored) : [];
  });

  // New state for Instant Interpreter mode
  const [isVoiceOverActive, setIsVoiceOverActive] = useState(false);

  const latestRequest = useRef(0);

  // Effect to save phrases to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('linguist-phrasebook', JSON.stringify(savedPhrases));
  }, [savedPhrases]);

  // Effect to save snippets to local storage
  useEffect(() => {
    localStorage.setItem('linguist-snippets', JSON.stringify(savedSnippets));
  }, [savedSnippets]);


  // Effect to update input text from any live transcription
  useEffect(() => {
    if (liveTranscriber.isRecording || liveTranscriber.isConnecting) {
      setInputText(liveTranscriber.transcript);
      setOutputText(''); // Clear output to mirror transcription
    }
  }, [liveTranscriber.transcript, liveTranscriber.isRecording, liveTranscriber.isConnecting]);

  // Effect to save final input text to local storage
  useEffect(() => {
    if (!liveTranscriber.isRecording && !liveTranscriber.isConnecting) {
      localStorage.setItem('linguist-app-input', inputText);
    }
  }, [inputText, liveTranscriber.isRecording, liveTranscriber.isConnecting]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // When user types, invalidate previous requests by incrementing the ref.
    latestRequest.current++;
    setInputText(e.target.value);
    setOutputText(''); // Clear previous translation
  };

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;

    const requestId = ++latestRequest.current;
    
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);
    setOutputText('');
    setIsPracticing(false);
    setPracticeFeedback(null);

    try {
      const stream = translateTextStream(inputText, sourceLang.name, targetLang.name);
      
      for await (const result of stream) {
        if (latestRequest.current !== requestId) {
          return; // A new request has started, so stop processing this one.
        }

        if (result.detectedSourceLanguage) {
          const detectedLangObj = languages.find(lang => lang.name.toLowerCase() === result.detectedSourceLanguage!.toLowerCase());
          if (detectedLangObj) {
            setSourceLang(detectedLangObj);
          }
        }
        if (result.chunk) {
          setOutputText(prev => prev + result.chunk);
        }
      }
    } catch (e: any) {
      console.error(e);
      if (latestRequest.current === requestId) {
        setError(e.message || 'Failed to translate. Please try again.');
      }
    } finally {
      if (latestRequest.current === requestId) {
        setIsLoading(false);
        setIsStreaming(false);
      }
    }
  }, [inputText, sourceLang.name, targetLang.name]);

  // Auto-translation with debounce
  useEffect(() => {
    if (!inputText.trim() || isVoiceOverActive) {
      latestRequest.current++; // Invalidate any ongoing stream
      setIsStreaming(false);
      setOutputText('');
      return;
    }
  
    const debounceTimer = setTimeout(() => {
      handleTranslate();
    }, 500); // Shorter debounce for a more "real-time" feel
  
    return () => {
      clearTimeout(debounceTimer);
    };
  }, [inputText, sourceLang, targetLang, isVoiceOverActive, handleTranslate]);
  
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
    // Cannot swap if source is auto-detect and there's no output text
    if (sourceLang.code === 'auto' && !outputText) return;
    
    const newSource = targetLang;
    const newTarget = sourceLang.code === 'auto' ? languages.find(l => l.name === targetLang.name) : sourceLang;

    setSourceLang(newSource);
    setTargetLang(newTarget || languages[0]); // fallback to auto-detect if something goes wrong
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
      setOutputText('');
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
        // Voice-over uses the non-streaming translation for a complete response
        const { translatedText, detectedSourceLanguage } = await translateText(finalTranscript, sourceLang.name, targetLang.name);
        
        if (detectedSourceLanguage) {
            const detectedLangObj = languages.find(lang => lang.name.toLowerCase() === detectedSourceLanguage.toLowerCase());
            if (detectedLangObj) {
                setSourceLang(detectedLangObj);
            }
        }

        setOutputText(translatedText);
        await handleSpeak(translatedText);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Voice-over failed. Please try again.");
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

  // Phrasebook Handlers
  const handleSavePhrase = () => {
    if (!inputText.trim() || !outputText.trim() || sourceLang.code === 'auto') return;
    const newPhrase: SavedPhrase = {
      id: Date.now(),
      sourceText: inputText,
      translatedText: outputText,
      sourceLang: sourceLang,
      targetLang: targetLang,
    };
    setSavedPhrases(prev => [newPhrase, ...prev]);
  };

  const handleDeletePhrase = (id: number) => {
    setSavedPhrases(prev => prev.filter(p => p.id !== id));
  };

  const handleUsePhrase = (phrase: SavedPhrase) => {
    setInputText(phrase.sourceText);
    setOutputText(phrase.translatedText);
    setSourceLang(phrase.sourceLang);
    setTargetLang(phrase.targetLang);
    setIsPhrasebookOpen(false);
  };

  // Snippet Handlers
  const handleOpenSaveSnippetModal = (content: string) => {
    setSnippetToSave({ content });
  };

  const handleSaveSnippet = (title: string, content: string, category: string) => {
    const newSnippet: SavedSnippet = { id: Date.now(), title, content, category };
    setSavedSnippets(prev => [newSnippet, ...prev]);
    setSnippetToSave(null); // Close the modal
    setIsSnippetsModalOpen(true); // Optionally open the main snippets modal
  };

  const handleDeleteSnippet = (id: number) => {
    setSavedSnippets(prev => prev.filter(s => s.id !== id));
  };

  const handleUseSnippet = (content: string) => {
    setInputText(content);
    setOutputText(''); // Clear previous translation to mirror the new snippet
    setIsSnippetsModalOpen(false);
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
            disabled={sourceLang.code === 'auto' && !outputText}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
            onChange={handleInputChange}
            placeholder="Enter text or start speaking..."
            onMicClick={handleMicClick}
            isRecording={liveTranscriber.isRecording && !isVoiceOverActive}
            isTranscribing={liveTranscriber.isConnecting && !isVoiceOverActive}
            showMic
            maxLength={MAX_INPUT_LENGTH}
            showSaveSnippetButton
            onSaveSnippet={handleOpenSaveSnippetModal}
            showCopyButton
          />
          <TextInputPanel
            id="target-text"
            value={outputText}
            isMirrored={isStreaming}
            displayLang={targetLang.name}
            placeholder="Translation will appear here..."
            onSpeakClick={() => handleSpeak(outputText)}
            readOnly
            showSpeaker
            isLoading={isLoading}
            showPractice={!isPracticing && !!outputText && !isStreaming}
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
            showSaveButton={!!outputText && sourceLang.code !== 'auto' && !isStreaming}
            onSavePhrase={handleSavePhrase}
            showSaveSnippetButton
            onSaveSnippet={handleOpenSaveSnippetModal}
            showCopyButton
          />
        </div>

        <div className="flex justify-center mt-4 flex-wrap gap-4">
          <button
            onClick={handleTranslate}
            disabled={isLoading || !inputText.trim()}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg w-full sm:w-auto"
          >
            {isLoading ? <LoadingSpinner /> : 'Translate'}
            <ArrowIcon />
          </button>
           <button
            onClick={() => setIsConversationMode(true)}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-cyan-600 rounded-lg font-semibold hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg w-full sm:w-auto"
          >
            Start Conversation
            <ConversationIcon />
          </button>
           <button
            onClick={() => setIsPhrasebookOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg w-full sm:w-auto"
          >
            Phrasebook
            <BookOpenIcon />
          </button>
           <button
            onClick={() => setIsSnippetsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg w-full sm:w-auto"
          >
            Snippets
            <ClipboardDocumentListIcon />
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
    {isPhrasebookOpen && (
        <PhrasebookModal
            isOpen={isPhrasebookOpen}
            onClose={() => setIsPhrasebookOpen(false)}
            phrases={savedPhrases}
            onDelete={handleDeletePhrase}
            onUse={handleUsePhrase}
            onSpeak={handleSpeak}
        />
    )}
    {isSnippetsModalOpen && (
        <SnippetsModal
            isOpen={isSnippetsModalOpen}
            onClose={() => setIsSnippetsModalOpen(false)}
            snippets={savedSnippets}
            onDelete={handleDeleteSnippet}
            onUse={handleUseSnippet}
            onAddNew={() => handleOpenSaveSnippetModal('')}
        />
    )}
    {snippetToSave !== null && (
        <SaveSnippetModal
            isOpen={snippetToSave !== null}
            onClose={() => setSnippetToSave(null)}
            onSave={handleSaveSnippet}
            initialContent={snippetToSave.content}
        />
    )}
    </>
  );
}