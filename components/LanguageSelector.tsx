
import React from 'react';
import { languages } from '../constants';
import { Language } from '../types';

interface LanguageSelectorProps {
  selectedLang: Language;
  onSelect: (language: Language) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLang, onSelect }) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = event.target.value;
    const language = languages.find(lang => lang.code === selectedCode);
    if (language) {
      onSelect(language);
    }
  };

  return (
    <div className="w-full">
      <select
        value={selectedLang.code}
        onChange={handleChange}
        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};
