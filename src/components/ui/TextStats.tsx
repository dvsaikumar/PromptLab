import React from 'react';
import { clsx } from 'clsx';

interface TextStatsProps {
    text?: string;
    charCount?: number;
    wordCount?: number;
    tokenCount?: number;
    contextTokenCount?: number;
    executionTime?: number;
    className?: string;
}

export const TextStats: React.FC<TextStatsProps> = ({ text, charCount: propCharCount, wordCount: propWordCount, tokenCount, contextTokenCount, executionTime, className }) => {
    // Calculate if not provided but text is available
    const charCount = propCharCount ?? (text ? text.length : 0);
    const wordCount = propWordCount ?? (text ? text.trim().split(/\s+/).filter(w => w.length > 0).length : 0);

    return (
        <div className={clsx("flex gap-3 items-center text-xs font-semibold text-slate-400 px-3 py-1.5 rounded-lg select-none pointer-events-none", className)}>
            <span>{charCount} chars</span>
            <div className="w-px h-3 bg-slate-300 my-auto" />
            <span>{wordCount} words</span>
            {(tokenCount !== undefined || contextTokenCount !== undefined) && (
                <>
                    <div className="w-px h-3 bg-slate-300 my-auto" />
                    <span className="text-indigo-400">
                        {contextTokenCount !== undefined && <span>In: {contextTokenCount} {tokenCount !== undefined && '| '}</span>}
                        {tokenCount !== undefined && <span>Out: {tokenCount}</span>}
                        {contextTokenCount === undefined && tokenCount !== undefined && <span> tokens</span>}
                    </span>
                </>
            )}
            {executionTime !== undefined && (
                <>
                    <div className="w-px h-3 bg-slate-300 my-auto" />
                    <span>{executionTime.toFixed(2)}s</span>
                </>
            )}
        </div>
    );
};
