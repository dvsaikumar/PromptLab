import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QualityScore as QualityScoreType } from '@/types';
import { clsx } from 'clsx';
import { Activity, ThumbsUp, AlertTriangle, Wand2, ArrowUpRight } from 'lucide-react';

interface QualityScoreProps {
    score: QualityScoreType;
    onImprove?: () => void;
    isImproving?: boolean;
    variant?: 'default' | 'embedded';
}

export const QualityScore: React.FC<QualityScoreProps> = ({ score, onImprove, isImproving, variant = 'default' }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ bottom: 0, left: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const getScoreColor = (val: number) => {
        if (val >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200 bar-emerald';
        if (val >= 75) return 'text-blue-600 bg-blue-50 border-blue-200 bar-blue';
        if (val >= 60) return 'text-amber-600 bg-amber-50 border-amber-200 bar-amber';
        return 'text-red-600 bg-red-50 border-red-200 bar-red';
    };

    const getBarColor = (val: number) => {
        if (val >= 90) return 'bg-emerald-500';
        if (val >= 75) return 'bg-blue-500';
        if (val >= 60) return 'bg-amber-500';
        return 'bg-red-500';
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
    // const borderColorClass = mainColorClass.split(' ').find(c => c.startsWith('border-')) || 'border-slate-200'; // Not used in new design

    return (
        <div
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setShowTooltip(false)}
            className={clsx(
                "w-full flex flex-col xl:flex-row items-center gap-4 p-1 transition-shadow",
                variant === 'default' && [
                    "bg-white rounded-2xl border border-slate-200 p-3 shadow-sm hover:shadow-md",
                    "border-slate-200"
                ],
                variant === 'embedded' && "bg-transparent ring-0 border-0 p-0"
            )}
        >
            {/* Part 1: Overall Score */}
            <div className="flex items-center gap-3 xl:border-r xl:border-slate-100 xl:pr-4 min-w-[160px] shrink-0">
                <div className="relative flex items-center justify-center w-16 h-16">
                    {/* Dynamic Circle SVG */}
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                        <path
                            className="text-slate-100"
                            d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                        />
                        <path
                            className={valToColor(score.overallScore)}
                            strokeDasharray={`${score.overallScore}, 100`}
                            d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className={clsx("absolute text-2xl font-black tracking-tighter", mainColorClass.split(' ')[0])}>
                        {score.overallScore}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Quality Analysis</span>
                    <span className={clsx("text-base font-bold leading-tight", mainColorClass.split(' ')[0])}>
                        {score.rating}
                    </span>
                </div>
            </div>

            {/* Part 2: Detailed Metrics Grid */}
            <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                    { label: 'Clarity', val: score.clarity },
                    { label: 'Specificity', val: score.specificity },
                    { label: 'Structure', val: score.structure },
                    { label: 'Completeness', val: score.completeness },
                    { label: 'Actionability', val: score.actionability },
                ].map((m) => (
                    <div key={m.label} className="bg-slate-50/50 rounded-lg p-2 border border-slate-100 flex flex-col justify-between gap-2 group hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start">
                            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wide leading-tight">{m.label}</span>
                            {m.val >= 95 && <ArrowUpRight size={10} className="text-emerald-500" />}
                        </div>
                        <div className="space-y-1">
                            <div className={clsx("text-xl font-bold leading-none", getScoreColor(m.val).split(' ')[0])}>
                                {m.val}
                            </div>
                            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={clsx("h-full rounded-full transition-all duration-500", getBarColor(m.val))}
                                    style={{ width: `${m.val}% ` }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Part 3: Action */}
            <div className="min-w-[140px] w-full xl:w-auto xl:pl-4 xl:border-l xl:border-slate-100 flex justify-end shrink-0">
                {onImprove && score.overallScore < 95 ? (
                    <button
                        onClick={onImprove}
                        disabled={isImproving}
                        className="w-full xl:w-auto group relative flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all shadow-md shadow-indigo-200 hover:shadow-indigo-300 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        {isImproving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Wand2 size={16} />
                        )}
                        <span className="text-xs tracking-wide">{isImproving ? 'Optimizing...' : 'Auto-Improve'}</span>
                    </button>
                ) : (
                    <div className="w-full xl:w-auto flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-4 py-2.5 rounded-lg border border-emerald-100">
                        <ThumbsUp size={16} /> <span>Optimized</span>
                    </div>
                )}
            </div>

            {/* Tooltip Portal */}
            {showTooltip && createPortal(
                <div
                    className="fixed w-[640px] pointer-events-none bg-slate-900/95 text-white backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-200"
                    style={{
                        bottom: tooltipPos.bottom + 10,
                        left: tooltipPos.left,
                    }}
                >
                    <div className="flex flex-col gap-4">
                        <div className="pb-3 border-b border-white/10">
                            <div className="flex items-center gap-2 mb-1">
                                <Activity size={16} className="text-indigo-400" />
                                <span className="font-bold text-sm">Analysis Details</span>
                            </div>
                            <p className="text-xs text-slate-400">Breakdown of strengths and improvement areas.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-2">
                                    <ThumbsUp size={12} /> Strengths
                                </h4>
                                <ul className="space-y-1.5">
                                    {score.strengths.slice(0, 5).map((s, i) => (
                                        <li key={i} className="text-xs text-slate-300 pl-3 border-l-2 border-emerald-500/30 leading-snug">{s}</li>
                                    ))}
                                    {score.strengths.length > 5 && <li className="text-xs text-slate-400 pl-3 border-l-2 border-emerald-500/30 leading-snug">...and {score.strengths.length - 5} more</li>}
                                </ul>
                            </div>
                            <div className="space-y-2">
                                {score.improvements.length > 0 ? (
                                    <>
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-2">
                                            <AlertTriangle size={12} /> Improvements
                                        </h4>
                                        <ul className="space-y-1.5">
                                            {score.improvements.slice(0, 5).map((s, i) => (
                                                <li key={i} className="text-xs text-slate-300 pl-3 border-l-2 border-amber-500/30 leading-snug">{s}</li>
                                            ))}
                                            {score.improvements.length > 5 && <li className="text-xs text-slate-400 pl-3 border-l-2 border-amber-500/30 leading-snug">...and {score.improvements.length - 5} more</li>}
                                        </ul>
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-4">
                                        <ThumbsUp size={24} className="mb-2 text-emerald-400" />
                                        <p className="text-xs text-slate-300">No improvements needed.<br />Excellent job!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const valToColor = (val: number) => {
    if (val >= 90) return 'text-emerald-500';
    if (val >= 75) return 'text-blue-500';
    if (val >= 60) return 'text-amber-500';
    return 'text-red-500';
};
