import React, { useMemo } from 'react';
import { analyzePromptHighlights, HighlightType } from '@/utils/promptHighlighter';
import { clsx } from 'clsx';
import { AlertTriangle, ShieldCheck, Database } from 'lucide-react';

interface PromptHighlighterProps {
    text: string;
    onReplace?: (oldText: string, newText: string) => void;
    className?: string;
}

export const PromptHighlighter: React.FC<PromptHighlighterProps> = ({ text, onReplace, className }) => {
    const segments = useMemo(() => analyzePromptHighlights(text), [text]);

    const getStyles = (type: HighlightType, hasReplacement: boolean) => {
        switch (type) {
            case 'vague':
                return hasReplacement
                    ? "underline decoration-red-500 decoration-wavy decoration-2 text-slate-800 bg-red-50/50 cursor-pointer hover:bg-red-100"
                    : "underline decoration-red-500 decoration-wavy decoration-2 text-slate-800 bg-red-50/50 cursor-help";
            case 'constraint':
                return "bg-green-100 text-green-900 border-b-2 border-green-300 px-0.5 font-medium cursor-help";
            case 'context':
                return "bg-blue-50 text-blue-700 border border-blue-200 rounded px-1 font-mono text-[0.9em] cursor-help";
            default:
                return "text-slate-800";
        }
    };

    const getTooltip = (type: HighlightType, replacement?: string) => {
        switch (type) {
            case 'vague': return replacement ? `Try: "${replacement}" (Click to fix)` : "Ambiguous instruction.";
            case 'constraint': return "Strong constraint detected.";
            case 'context': return "Dynamic context placeholder.";
            default: return "";
        }
    };

    return (
        <div className={clsx("font-sans text-base leading-relaxed whitespace-pre-wrap font-normal", className)}>
            {segments.map((seg, i) => (
                <span
                    key={i}
                    onClick={() => {
                        if (seg.type === 'vague' && seg.replacement && onReplace) {
                            onReplace(seg.text, seg.replacement);
                        }
                    }}
                    className={clsx("transition-colors duration-200 relative group", getStyles(seg.type, !!seg.replacement))}
                >
                    {seg.text}
                    {/* Tooltip */}
                    {seg.type !== 'normal' && (
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[240px] px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 flex items-center gap-2 shadow-xl">
                            {seg.type === 'vague' && <AlertTriangle size={12} className="text-red-400" />}
                            {seg.type === 'constraint' && <ShieldCheck size={12} className="text-green-400" />}
                            {seg.type === 'context' && <Database size={12} className="text-blue-400" />}
                            {getTooltip(seg.type, seg.replacement)}
                            {/* Arrow */}
                            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
                        </span>
                    )}
                </span>
            ))}
        </div>
    );
};
