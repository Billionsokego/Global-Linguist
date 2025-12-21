
import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';

interface SaveSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, category: string) => void;
  initialContent: string;
}

export const SaveSnippetModal: React.FC<SaveSnippetModalProps> = ({ isOpen, onClose, onSave, initialContent }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(initialContent);
  const [category, setCategory] = useState('');

  useEffect(() => {
    setContent(initialContent);
    // Reset fields when a new snippet is being saved
    if (isOpen) {
        setTitle('');
        setCategory('');
    }
  }, [initialContent, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
        // Basic validation
        return;
    }
    onSave(title, content, category || 'Uncategorized');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Save New Snippet
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <CloseIcon />
          </button>
        </header>
        
        <form onSubmit={handleSubmit}>
            <main className="p-4 space-y-4">
                <div>
                    <label htmlFor="snippet-title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                    <input
                        type="text"
                        id="snippet-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Email Greeting"
                        required
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <div>
                    <label htmlFor="snippet-category" className="block text-sm font-medium text-gray-300 mb-1">Category (Optional)</label>
                    <input
                        type="text"
                        id="snippet-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g., Work Emails"
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                 <div>
                    <label htmlFor="snippet-content" className="block text-sm font-medium text-gray-300 mb-1">Content</label>
                    <textarea
                        id="snippet-content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={5}
                        required
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                </div>
            </main>
            <footer className="p-4 border-t border-gray-700 flex justify-end">
                 <button type="submit" className="px-4 py-2 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-600 transition-colors">
                    Save Snippet
                </button>
            </footer>
        </form>
      </div>
    </div>
  );
};
