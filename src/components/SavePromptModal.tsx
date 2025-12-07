import React, { useState } from 'react';
import { X } from 'lucide-react';

interface SavePromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string) => void;
}

export const SavePromptModal: React.FC<SavePromptModalProps> = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        if (title.trim()) {
            onSave(title.trim());
            setTitle('');
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h3 className="text-xl font-bold text-slate-900">Save Prompt</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Prompt Title
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter a descriptive title..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        autoFocus
                    />
                </div>
                <div className="p-6 border-t border-slate-200 flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Prompt
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
