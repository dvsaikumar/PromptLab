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
        <div className={clsx("flex gap-4 items-center text-[13px] font-medium text-slate-500 px-4 py-2 rounded-lg select-none pointer-events-none bg-white/50 backdrop-blur-sm", className)}>
            <span className="tracking-tight">{charCount} <span className="opacity-70 font-normal">chars</span></span>
            <div className="w-px h-3 bg-slate-200" />
            <span className="tracking-tight">{wordCount} <span className="opacity-70 font-normal">words</span></span>
            {(tokenCount !== undefined || contextTokenCount !== undefined) && (
                <>
                    <div className="w-px h-3 bg-slate-200" />
                    <span className="text-indigo-600 font-semibold tracking-tight">
                        {contextTokenCount !== undefined && <span>In: {contextTokenCount} {tokenCount !== undefined && <span className="text-slate-200 mx-1">|</span>}</span>}
                        {tokenCount !== undefined && <span>Out: {tokenCount}</span>}
                        {contextTokenCount === undefined && tokenCount !== undefined && <span className="opacity-70 font-normal ml-1">tokens</span>}
                    </span>
                </>
            )}
            {executionTime !== undefined && (
                <>
                    <div className="w-px h-3 bg-slate-200" />
                    <span className="tabular-nums text-slate-600">{executionTime.toFixed(2)}s</span>
                </>
            )}
        </div>
    );
};
