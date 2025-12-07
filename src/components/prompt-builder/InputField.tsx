import React, { useRef, useState } from 'react';
import {
    X, ChevronDown, ChevronUp,
    RefreshCw, Lightbulb
} from 'lucide-react';
import { usePrompt } from '@/contexts/PromptContext';
import { clsx } from 'clsx';
import { TextStats } from '@/components/ui/TextStats';

interface InputFieldProps {
    id: string;
    label: string;
    description: string;
    isReadOnly?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({ id, label, description, isReadOnly }) => {
    const {
        fields, setField, generateSuggestions, generatePrompt
    } = usePrompt();

    const rawValue = fields[id];
    const value = typeof rawValue === 'string' ? rawValue : (rawValue ? (typeof rawValue === 'object' ? JSON.stringify(rawValue, null, 2) : String(rawValue)) : '');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);



    // Validation
    const getValidation = (text: string) => {
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (words === 0) return { status: 'empty', message: 'Empty', color: 'text-gray-400' };
        if (words < 5) return { status: 'warning', message: 'Too short', color: 'text-amber-500' };
        if (words < 15) return { status: 'good', message: 'Good', color: 'text-blue-500' };
        return { status: 'excellent', message: 'Excellent', color: 'text-green-600' };
    };

    const validation = getValidation(value);

    // Handlers

    const handleSuggestion = async () => {
        setIsLoadingSuggestions(true);
        const result = await generateSuggestions(id);
        setSuggestions(result);
        setIsLoadingSuggestions(false);
    };

    const applySuggestion = (text: string) => {
        setField(id, text);
        setSuggestions([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Ctrl/Cmd + Enter to Generate
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            generatePrompt();
        }
    };

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value, isCollapsed]);

    return (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <label htmlFor={id} className="block text-xl font-bold text-slate-900">
                    {label}
                </label>
                <div className="flex items-center space-x-2">
                    <span className={clsx("text-sm font-semibold", validation.color)}>
                        {validation.message}
                    </span>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="text-black-400 hover:text-black-600 transition-colors p-1 rounded-md"
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                </div>
            </div>

            <p className="text-base text-slate-500 mb-3">{description}</p>

            <div className="relative">
                {!isCollapsed && (
                    <div className="relative group">
                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => setField(id, e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isReadOnly}
                                placeholder={`Enter ${label.toLowerCase()}... (Ctrl+Enter to generate)`}
                                rows={Math.max(3, value.split('\n').length)}
                                className={clsx(
                                    "w-full px-4 pt-4 pb-12 rounded-xl text-base transition-all resize-none overflow-hidden form-input",
                                    isReadOnly
                                        ? "bg-slate-50 text-slate-500 cursor-not-allowed border border-slate-300"
                                        : "input-premium text-slate-700 placeholder:text-slate-400",
                                )}
                            />

                            <TextStats text={value} className="bottom-3 left-4 border-slate-200/50 bg-slate-50/80 scale-90" />

                            {/* Smart Suggest Trigger - show if value exists and enough length */}
                            {
                                !isReadOnly && value.length > 5 && !suggestions.length && (
                                    <button
                                        onClick={handleSuggestion}
                                        className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-indigo-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-50 shadow-sm border border-indigo-100 text-xs font-bold"
                                        title="Get AI Suggestions"
                                    >
                                        {isLoadingSuggestions ? <RefreshCw size={16} className="animate-spin" /> : <Lightbulb size={16} />}
                                        <span>AI Assistant</span>
                                    </button>
                                )
                            }
                        </div >

                        {/* Suggestions Panel */}
                        {
                            suggestions.length > 0 && (
                                <div className="mt-4 bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-indigo-100 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/5">
                                    <div className="flex justify-between items-center mb-3 px-1">
                                        <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 uppercase tracking-wider">
                                            <SparklesIco /> Smart Suggestions
                                        </span>
                                        <button onClick={() => setSuggestions([])} className="text-slate-400 hover:text-indigo-500 transition-colors p-1 hover:bg-indigo-50 rounded-lg">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {suggestions.map((s, i) => (
                                            <button
                                                key={i}
                                                onClick={() => applySuggestion(s)}
                                                className="w-full text-left p-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-900 border border-slate-100 hover:border-indigo-200 rounded-lg text-sm text-slate-600 transition-all shadow-sm group hover:shadow-md"
                                            >
                                                <div className="flex gap-2.5">
                                                    <span className="text-indigo-400 group-hover:text-indigo-600 font-bold text-xs mt-0.5">{i + 1}</span>
                                                    <span className="leading-relaxed">{s}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        }
                    </div >
                )}
            </div >
        </div >
    );
};

const SparklesIco = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
    </svg>
);
