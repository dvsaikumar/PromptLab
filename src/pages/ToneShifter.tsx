import React, { useState } from 'react';
import { Palette, Copy, Check, Wand2, ArrowRight } from 'lucide-react';
import { usePrompt } from '@/contexts/PromptContext';
import { TONES } from '@/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageTemplate } from '@/components/ui/PageTemplate';
import toast from 'react-hot-toast';

interface ToneShifterProps {
    isSidebarOpen?: boolean;
}

export const ToneShifter: React.FC<ToneShifterProps> = ({ isSidebarOpen = false }) => {
    const { generatedPrompt } = usePrompt();
    const [selectedTone, setSelectedTone] = useState<string>('');
    const [shiftedPrompt, setShiftedPrompt] = useState('');
    const [copied, setCopied] = useState(false);
    const [isShifting, setIsShifting] = useState(false);

    const handleShift = () => {
        if (!generatedPrompt || !selectedTone) return;
        setIsShifting(true);

        // Simulate processing
        setTimeout(() => {
            const tone = TONES.find(t => t.value === selectedTone);
            setShiftedPrompt(`[Tone: ${tone?.label}]\n\n${generatedPrompt}`);
            setIsShifting(false);
            toast.success(`Tone shifted to ${tone?.label}`);
        }, 500);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shiftedPrompt);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <PageTemplate
            title="Tone Shifter"
            subtitle="Transform your prompts with different tones and styles"
            icon={Palette}
            iconGradient="from-pink-500 to-rose-600"
            shadowColor="shadow-rose-500/30"
            isSidebarOpen={isSidebarOpen}
            className="flex flex-col !p-0"
            headerClassName="!px-4"
            iconSize={20}
            titleClassName="text-lg"
            subtitleClassName="text-xs"
        >
            <div className="h-full overflow-y-auto bg-slate-50 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Original Prompt */}
                    <Card noPadding className="overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-900">Original Prompt</h3>
                        </div>
                        <div className="p-6">
                            <div className="bg-slate-50 p-5 rounded-xl min-h-[200px] text-slate-700 border border-slate-100">
                                {generatedPrompt || (
                                    <div className="text-center text-slate-400">
                                        <Wand2 size={32} className="mx-auto mb-3 opacity-50" />
                                        <p>No prompt generated yet.</p>
                                        <p className="text-sm mt-1">Go to Prompt Lab to create one.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Shifted Prompt */}
                    <Card noPadding className="overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-900">Shifted Prompt</h3>
                            {shiftedPrompt && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleCopy}
                                    leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
                                    className={copied ? "text-emerald-600" : ""}
                                >
                                    {copied ? 'Copied!' : 'Copy'}
                                </Button>
                            )}
                        </div>
                        <div className="p-6">
                            <div className="bg-slate-50 p-5 rounded-xl min-h-[200px] text-slate-700 border border-slate-100 whitespace-pre-wrap">
                                {shiftedPrompt || (
                                    <div className="text-center text-slate-400">
                                        <ArrowRight size={32} className="mx-auto mb-3 opacity-50" />
                                        <p>Select a tone and click Shift.</p>
                                        <p className="text-sm mt-1">Your transformed prompt will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Tone Selection */}
                <Card noPadding className="overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-lg text-slate-900">Select Target Tone</h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                            {TONES.slice(0, 12).map((tone) => (
                                <button
                                    key={tone.value}
                                    onClick={() => setSelectedTone(tone.value)}
                                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${selectedTone === tone.value
                                        ? 'border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-500/20 shadow-md transform scale-[1.02]'
                                        : 'border-slate-200 bg-white hover:border-pink-300 hover:shadow-md hover:-translate-y-0.5'
                                        }`}
                                >
                                    <div className={`font-bold text-sm ${selectedTone === tone.value ? 'text-pink-700' : 'text-slate-700'}`}>
                                        {tone.label}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">{tone.description}</div>
                                </button>
                            ))}
                        </div>

                        <Button
                            onClick={handleShift}
                            disabled={!generatedPrompt || !selectedTone}
                            isLoading={isShifting}
                            className="w-full h-14 text-lg bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-rose-500/30"
                            leftIcon={!isShifting && <Wand2 size={20} />}
                        >
                            Shift Tone
                        </Button>
                    </div>
                </Card>
            </div>
        </PageTemplate>
    );
};
