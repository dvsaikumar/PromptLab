import React from 'react';
import { ArrowRight, Lightbulb, Sparkles, X, Loader2 } from 'lucide-react';

export interface Suggestion {
    type: 'completion' | 'context' | 'refinement';
    text: string;
}

interface RealtimeSuggestionsProps {
    suggestions: Suggestion[];
    isLoading: boolean;
    onApply: (text: string) => void;
    onDismiss: () => void;
    className?: string; // For positioning
}

export const RealtimeSuggestions: React.FC<RealtimeSuggestionsProps> = ({
    suggestions,
    isLoading,
    onApply,
    onDismiss,
    className
}) => {
    if (!suggestions.length && !isLoading) return null;

    return (
        <div className={`absolute z-20 w-full max-w-lg mt-2 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-indigo-100 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/5 animate-in fade-in slide-in-from-top-2 ${className}`}>
            <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 uppercase tracking-wider">
                    {isLoading ? (
                        <><Loader2 size={12} className="animate-spin" /> Thinking...</>
                    ) : (
                        <><Sparkles size={12} /> Smart Assist</>
                    )}
                </span>
                <button
                    onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                    className="text-slate-400 hover:text-indigo-500 transition-colors p-1 hover:bg-indigo-50 rounded-lg"
                >
                    <X size={14} />
                </button>
            </div>

            {!isLoading && (
                <div className="space-y-2">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onApply(s.text); }}
                            className="w-full text-left p-2.5 bg-indigo-50/50 hover:bg-indigo-100/50 border border-indigo-100 hover:border-indigo-200 rounded-lg text-sm text-slate-700 transition-all group flex items-start gap-3"
                        >
                            <div className="mt-0.5 shrink-0 text-indigo-500">
                                {s.type === 'completion' && <ArrowRight size={14} />}
                                {s.type === 'context' && <Lightbulb size={14} />}
                                {s.type === 'refinement' && <Sparkles size={14} />}
                            </div>
                            <div className="flex-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-0.5 block">
                                    {s.type}
                                </span>
                                <span className="leading-relaxed text-xs block">{s.text}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
