import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QualityScore as QualityScoreType } from '@/types';
import { clsx } from 'clsx';
import { Activity, ThumbsUp, AlertTriangle } from 'lucide-react';

interface QualityScoreProps {
    score: QualityScoreType;
    onImprove?: () => void;
    isImproving?: boolean;
}

export const QualityScore: React.FC<QualityScoreProps> = ({ score, onImprove, isImproving }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ bottom: 0, left: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const getScoreColor = (val: number) => {
        if (val >= 90) return 'text-green-600 bg-green-50 border-green-200';
        if (val >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (val >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const handleMouseEnter = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setTooltipPos({
                bottom: window.innerHeight - rect.top + 10,
                left: rect.left
            });
            setShowTooltip(true);
        }
    };

    const mainColorClass = getScoreColor(score.overallScore);
    const borderColorClass = mainColorClass.split(' ').find(c => c.startsWith('border-')) || 'border-slate-200';

    return (
        <div
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setShowTooltip(false)}
            className={clsx(
                "h-full w-full flex items-stretch rounded-xl border bg-white relative hover:shadow-md transition-shadow",
                borderColorClass
            )}
        >
            {/* Part 1: Score Overview */}
            <div className="flex-1 min-w-[200px] flex items-center justify-center gap-4 px-6 border-r border-slate-100">
                <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl w-16 h-16 border border-slate-100 shrink-0">
                    <span className={clsx("text-4xl font-black leading-none tracking-tighter", mainColorClass.split(' ')[0])}>
                        {score.overallScore}
                    </span>
                </div>
                <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                        <Activity className="w-4 h-4" /> Quality Analysis
                    </div>
                    <p className="text-xs opacity-60 font-medium">{score.rating}</p>
                </div>
            </div>

            {/* Part 2: Detailed Metrics */}
            <div className="flex-[2] min-w-[400px] grid grid-cols-5 gap-px bg-slate-100/50 border-r border-slate-100">
                {[
                    { label: 'Clarity', val: score.clarity },
                    { label: 'Specificity', val: score.specificity },
                    { label: 'Structure', val: score.structure },
                    { label: 'Completeness', val: score.completeness },
                    { label: 'Actionability', val: score.actionability },
                ].map((m) => (
                    <div key={m.label} className="bg-white flex flex-col items-center justify-center text-center p-2 group hover:bg-slate-50 transition-colors">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 group-hover:text-slate-600">{m.label}</div>
                        <div className={`text-xl font-bold leading-none ${getScoreColor(m.val).split(' ')[0]}`}>{m.val}</div>
                    </div>
                ))}
            </div>

            {/* Part 3: Actions */}
            <div className="flex-1 min-w-[200px] flex items-center justify-center px-6 bg-slate-50/30">
                {onImprove && score.overallScore < 95 ? (
                    <button
                        onClick={onImprove}
                        disabled={isImproving}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {isImproving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Activity size={16} />
                        )}
                        {isImproving ? 'Optimizing...' : 'Auto-Improve'}
                    </button>
                ) : (
                    <div className="w-full flex items-center justify-center gap-2 text-green-600 font-bold text-sm bg-green-50 py-3 rounded-lg border border-green-100">
                        <ThumbsUp size={16} /> Optimized
                    </div>
                )}
            </div>

            {/* Portal Tooltip */}
            {showTooltip && createPortal(
                <div
                    className="fixed w-[600px] bg-white/95 backdrop-blur-xl border border-slate-200 p-6 rounded-xl shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200"
                    style={{
                        bottom: tooltipPos.bottom,
                        left: tooltipPos.left,
                    }}
                >
                    <div className="grid grid-cols-2 gap-8 text-sm">
                        <div className="space-y-3">
                            <div className="font-bold flex items-center gap-2 text-green-700 text-xs uppercase tracking-wide pb-2 border-b border-green-100">
                                <ThumbsUp size={16} /> Strengths
                            </div>
                            <ul className="space-y-2">
                                {score.strengths.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2.5 leading-relaxed text-slate-700">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 shadow-sm" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <div className="font-bold flex items-center gap-2 text-amber-700 text-xs uppercase tracking-wide pb-2 border-b border-amber-100">
                                <AlertTriangle size={16} /> Improvements
                            </div>
                            <ul className="space-y-2">
                                {score.improvements.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2.5 leading-relaxed text-slate-700">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 shadow-sm" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
