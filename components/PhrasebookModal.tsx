
import React from 'react';
import { SavedPhrase } from '../types';
import { CloseIcon, SpeakerIcon, TrashIcon, UsePhraseIcon } from './icons';

interface PhrasebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  phrases: SavedPhrase[];
  onDelete: (id: number) => void;
  onUse: (phrase: SavedPhrase) => void;
  onSpeak: (text: string) => void;
}

export const PhrasebookModal: React.FC<PhrasebookModalProps> = ({ isOpen, onClose, phrases, onDelete, onUse, onSpeak }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex flex-col z-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl mx-auto bg-gray-800 rounded-xl border border-gray-700 flex flex-col h-full max-h-[90dvh]">
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Phrasebook
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <CloseIcon />
          </button>
        </header>

        <main className="flex-grow p-4 overflow-y-auto">
          {phrases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                <h3 className="text-lg font-semibold">Your Phrasebook is Empty</h3>
                <p className="mt-1">Save translations by clicking the bookmark icon.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {phrases.map((phrase) => (
                <li key={phrase.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-xs text-gray-400">{phrase.sourceLang.name}</p>
                      <p className="text-white">{phrase.sourceText}</p>
                    </div>
                    <div className="border-t border-gray-700 my-1"></div>
                    <div>
                      <p className="text-xs text-cyan-400">{phrase.targetLang.name}</p>
                      <p className="text-cyan-200">{phrase.translatedText}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-700/50">
                     <button onClick={() => onSpeak(phrase.translatedText)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="Speak translation">
                        <SpeakerIcon/>
                     </button>
                      <button onClick={() => onUse(phrase)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="Use this phrase">
                        <UsePhraseIcon/>
                      </button>
                      <button onClick={() => onDelete(phrase.id)} className="p-2 rounded-full hover:bg-red-900/50 text-red-400 transition-colors" aria-label="Delete phrase">
                        <TrashIcon/>
                      </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
};