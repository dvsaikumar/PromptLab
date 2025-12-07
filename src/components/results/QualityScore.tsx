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
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, bottom: 0 });
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
                top: rect.top,
                left: rect.right + 12, // 12px offset from right edge
                bottom: window.innerHeight - rect.bottom // Distance from bottom of viewport
            });
            setShowTooltip(true);
        }
    };

    const mainColorClass = getScoreColor(score.overallScore);

    return (
        <div
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setShowTooltip(false)}
            className={clsx("rounded-xl border p-4 mb-4 animate-in fade-in zoom-in duration-300 shadow-sm relative cursor-help transition-all hover:shadow-md", mainColorClass)}
        >
            {/* Header & Metrics Compact Row */}
            <div className="flex flex-col gap-3 mb-3">
                <div className="flex items-center gap-3 w-full">
                    <div className="flex flex-col items-center justify-center bg-white/50 rounded-lg w-12 h-12 backdrop-blur-sm border border-black/5 shrink-0">
                        <span className="text-2xl font-black leading-none tracking-tight">{score.overallScore}</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 font-bold text-base leading-none mb-1">
                            <Activity className="w-4 h-4" /> Quality Analysis
                        </div>
                        <p className="text-xs opacity-70 font-medium">{score.rating}</p>
                    </div>
                </div>

                <div className="flex gap-1.5 justify-between w-full">
                    {[
                        { label: 'Cle', val: score.clarity },
                        { label: 'Spe', val: score.specificity },
                        { label: 'Str', val: score.structure },
                        { label: 'Com', val: score.completeness },
                        { label: 'Act', val: score.actionability },
                    ].map((m) => (
                        <div key={m.label} className="bg-white/40 rounded-md p-1.5 flex-1 text-center backdrop-blur-sm border border-black/5">
                            <div className="text-[9px] font-bold uppercase opacity-60 mb-0.5">{m.label}</div>
                            <div className={`text-xs font-bold leading-none ${getScoreColor(m.val).split(' ')[0]}`}>{m.val}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Portal Tooltip */}
            {showTooltip && createPortal(
                <div
                    className="fixed w-[600px] bg-white/95 backdrop-blur-xl border border-slate-200 p-6 rounded-xl shadow-2xl z-[100] animate-in fade-in slide-in-from-left-2 duration-200"
                    style={{
                        bottom: tooltipPos.bottom,
                        left: tooltipPos.left,
                    }}
                >
                    <div className="grid grid-cols-2 gap-8 text-xs">
                        <div className="space-y-3">
                            <div className="font-bold flex items-center gap-2 text-green-700 text-xs uppercase tracking-wide pb-2 border-b border-green-100">
                                <ThumbsUp size={14} /> Strengths
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
                                <AlertTriangle size={14} /> Improvements
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

            {/* Auto-Improve Button */}
            {onImprove && score.overallScore < 95 && (
                <button
                    onClick={onImprove}
                    disabled={isImproving}
                    className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                >
                    {isImproving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Activity size={14} />
                    )}
                    {isImproving ? 'Optimizing Prompt...' : 'Auto-Improve to 95+'}
                </button>
            )}
        </div>
    );
};
