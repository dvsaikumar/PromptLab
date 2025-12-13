import React, { useState, useEffect } from 'react';
import { RefreshCw, Wand2, Eye, EyeOff } from 'lucide-react';
import { PromptHighlighter } from './PromptHighlighter';
import { usePrompt } from '@/contexts/PromptContext';
import { TextStats } from '@/components/ui/TextStats';
import { Card } from '@/components/ui/Card';
import { clsx } from 'clsx';
import { estimateTokens } from '@/utils/tokenEstimator';

export interface PromptOutputProps {
    hideHeader?: boolean;
}

export const PromptOutput: React.FC<PromptOutputProps> = ({ hideHeader = false }) => {
    const {
        generatedPrompt, setGeneratedPrompt, isGenerating, isAnalyzing, executionTime, llmConfig, totalInputTokens
    } = usePrompt();

    const [loadingStep, setLoadingStep] = useState(0);
    const [isVisualMode, setIsVisualMode] = useState(false);
    const textSteps = ["Connecting to LLM...", "Drafting content...", "Polishing output..."];

    useEffect(() => {
        if (isGenerating) {
            setLoadingStep(0);
            const t1 = setTimeout(() => setLoadingStep(1), 2000);
            const t2 = setTimeout(() => setLoadingStep(2), 5000);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
    }, [isGenerating]);

    const handleReplace = (oldText: string, newText: string) => {
        if (!generatedPrompt) return;
        const updated = generatedPrompt.replace(oldText, newText);
        setGeneratedPrompt(updated);
    };

    return (
        <div className={clsx(
            "custom-scrollbar bg-slate-50/50 animate-in fade-in slide-in-from-right-4 duration-300 flex-1 relative flex flex-col h-full",
            !hideHeader && "px-3 pb-6 pt-4"
        )}>
            {isGenerating ? (
                <Card className="h-[50vh] flex flex-col items-center justify-center border-dashed relative">
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10 transition-all">
                        <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mb-4 drop-shadow-sm" />
                        <p className="text-slate-600 font-bold text-lg animate-pulse">{textSteps[loadingStep]}</p>
                        <div className="flex gap-1 mt-2">
                            <div className={clsx("w-2 h-2 rounded-full transition-colors", loadingStep >= 0 ? "bg-indigo-500" : "bg-slate-200")} />
                            <div className={clsx("w-2 h-2 rounded-full transition-colors", loadingStep >= 1 ? "bg-indigo-500" : "bg-slate-200")} />
                            <div className={clsx("w-2 h-2 rounded-full transition-colors", loadingStep >= 2 ? "bg-indigo-500" : "bg-slate-200")} />
                        </div>
                    </div>
                </Card>
            ) : generatedPrompt ? (
                <div className="w-full h-full">
                    <Card className={clsx(
                        "relative group overflow-hidden flex flex-col h-full transition-all",
                        !hideHeader ? "border border-slate-200 shadow-sm rounded-xl" : "border-none shadow-none rounded-none bg-transparent"
                    )}>
                        {/* Header Bar */}
                        <div className={clsx(
                            "flex items-center justify-between py-2 border-b border-slate-100 bg-slate-50/50 shrink-0",
                            !hideHeader ? "px-4" : "px-0"
                        )}>
                            <button
                                onClick={() => setIsVisualMode(!isVisualMode)}
                                className={clsx(
                                    "p-1.5 rounded-lg border transition-all shadow-sm",
                                    isVisualMode
                                        ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                                        : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                )}
                                title={isVisualMode ? "Back to Edit" : "Enable Visual Logic"}
                            >
                                {isVisualMode ? <EyeOff size={16} /> : <Eye size={16} />}
                                <span className="sr-only">Toggle Visual Mode</span>
                            </button>

                            <TextStats
                                text={generatedPrompt}
                                tokenCount={estimateTokens(generatedPrompt, llmConfig?.model || '')}
                                contextTokenCount={totalInputTokens}
                                executionTime={executionTime}
                                className="!static !bottom-auto !left-auto !translate-x-0 !m-0 bg-white border border-slate-200 shadow-sm origin-right"
                            />
                        </div>

                        {/* Content Area */}
                        {isVisualMode ? (
                            <div className="w-full flex-1 p-4 overflow-auto custom-scrollbar bg-slate-50/30">
                                <PromptHighlighter text={generatedPrompt} onReplace={handleReplace} />
                            </div>
                        ) : (
                            <textarea
                                readOnly
                                value={generatedPrompt}
                                className="w-full flex-1 p-4 bg-transparent border-none text-slate-800 text-base leading-relaxed resize-none focus:outline-none focus:ring-0 custom-scrollbar"
                            />
                        )}
                    </Card>
                </div>
            ) : (
                <Card className="h-full flex flex-col items-center justify-center border-dashed bg-slate-50/30 hover:bg-slate-50/50 transition-colors group cursor-default">
                    <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                        <Wand2 className="w-16 h-16 mb-4 opacity-20 group-hover:opacity-30 transition-opacity" />
                        <p className="font-bold text-slate-500 text-lg">Ready to Generate</p>
                        <p className="text-sm opacity-70 mt-2 max-w-[240px]">
                            Configure your parameters on the left and click Generate to see the magic happen.
                        </p>
                    </div>
                </Card>
            )}

            {/* Analysis Loading Overlay */}
            {isAnalyzing && !isGenerating && (
                <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md shadow-xl border border-blue-100 px-4 py-2 rounded-full flex items-center gap-2.5 text-xs font-bold text-blue-600 animate-pulse pointer-events-none ring-1 ring-blue-500/10">
                    <RefreshCw size={14} className="animate-spin" />
                    Analyzing Quality...
                </div>
            )}
        </div>
    );
};
