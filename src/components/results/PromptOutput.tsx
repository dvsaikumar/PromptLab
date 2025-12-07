import React from 'react';
import { RefreshCw, Wand2 } from 'lucide-react';
import { usePrompt } from '@/contexts/PromptContext';
import { TextStats } from '@/components/ui/TextStats';
import { ResultToolbar } from '@/components/ui/ResultToolbar';

interface PromptOutputProps {
    onExport?: (format: 'md' | 'txt' | 'json') => void;
    onSave?: () => void;
    onSaveAs?: () => void;
}

export const PromptOutput: React.FC<PromptOutputProps> = ({ onExport, onSave, onSaveAs }) => {
    const {
        generatedPrompt, isGenerating, isAnalyzing
    } = usePrompt();

    return (
        <div className="flex-1 relative flex flex-col h-full">
            {isGenerating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-slate-200 z-10 transition-all">
                    <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mb-4 drop-shadow-sm" />
                    <p className="text-slate-600 font-bold text-lg animate-pulse">Forging your prompt...</p>
                </div>
            ) : generatedPrompt ? (
                <div className="relative w-full h-full flex-1 min-h-[400px]">
                    {onExport && (
                        <div className="absolute top-3 right-3 z-10">
                            <ResultToolbar
                                onExport={onExport}
                                onSave={onSave}
                                onSaveAs={onSaveAs}
                                contentToCopy={generatedPrompt}
                                className="shadow-md border-slate-200"
                            />
                        </div>
                    )}
                    <textarea
                        readOnly
                        value={generatedPrompt}
                        className="w-full h-full p-5 pt-16 pb-10 bg-slate-50/50 rounded-2xl border border-slate-200 text-slate-800 text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/10 shadow-inner custom-scrollbar"
                    />
                    <TextStats text={generatedPrompt} />
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30 p-8 text-center min-h-[400px] hover:bg-slate-50/50 hover:border-slate-300 transition-colors">
                    <Wand2 className="w-16 h-16 mb-4 opacity-20" />
                    <p className="font-bold text-slate-500 text-lg">Ready to Generate</p>
                    <p className="text-sm opacity-70 mt-2 max-w-[240px]">
                        Configure your parameters on the left and click Generate to see the magic happen.
                    </p>
                </div>
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
