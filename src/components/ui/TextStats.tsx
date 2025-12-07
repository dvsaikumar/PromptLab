import React, { useMemo } from 'react';
import { clsx } from 'clsx';

interface TextStatsProps {
    text?: string;
    charCount?: number;
    wordCount?: number;
    className?: string;
}

export const TextStats: React.FC<TextStatsProps> = ({ text, charCount: propCharCount, wordCount: propWordCount, className }) => {
    const { charCount, wordCount } = useMemo(() => {
        if (text !== undefined) {
            return {
                charCount: text.length,
                wordCount: text.trim().split(/\s+/).filter(w => w.length > 0).length
            };
        }
        return {
            charCount: propCharCount || 0,
            wordCount: propWordCount || 0
        };
    }, [text, propCharCount, propWordCount]);

    return (
        <div className={clsx("absolute bottom-4 left-5 text-xs font-semibold text-slate-400 flex gap-3 pointer-events-none bg-slate-100/80 px-3 py-1.5 rounded-lg backdrop-blur-md border border-slate-200/60 shadow-sm", className)}>
            <span>{charCount} chars</span>
            <div className="w-px h-3 bg-slate-300 my-auto" />
            <span>{wordCount} words</span>
        </div>
    );
};
