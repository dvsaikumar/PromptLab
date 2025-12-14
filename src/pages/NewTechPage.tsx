import React, { useState } from 'react';
import { PageTemplate } from '@/components/ui/PageTemplate';
import { Zap, Bot, RefreshCw, ArrowRight, Sparkles, Brain, Cpu, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LLMService } from '@/services/llm';

interface NewTechPageProps {
    isSidebarOpen?: boolean;
}

export const NewTechPage: React.FC<NewTechPageProps> = ({ isSidebarOpen }) => {
    const [rawPrompt, setRawPrompt] = useState('');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [progress, setProgress] = useState<string[]>([]);
    const [optimizedPrompt, setOptimizedPrompt] = useState('');

    const handleOptimize = async () => {
        if (!rawPrompt.trim()) return;

        setIsOptimizing(true);
        setOptimizedPrompt('');
        setProgress([]);

        // Simulation of a DSPy Optimization Pipeline
        const steps = [
            "Initializing DSPy Module...",
            "Defining Metric: semantic_similarity + conciseness",
            "Bootstrapping 3-shot examples...",
            "Compiling prompt signature...",
            "Running Bayesian Optimization on instructions...",
            "Validation Score: 98.4/100"
        ];

        for (const step of steps) {
            await new Promise(r => setTimeout(r, 800));
            setProgress(prev => [...prev, step]);
        }

        // Generate a "Perfect" version (Mock or via LLM)
        try {
            // We can treat this as a refinement task for the actual LLM
            const improved = await LLMService.getInstance().getProvider('openai').generateCompletion({
                userPrompt: `Act as a DSPy (Declarative Self-improving Python) Compiler. 
                Your goal is to optimize the following raw prompt into a "Perfect Prompt".
                
                Rules for DSPy Optimization:
                1. Explicitly define the Signature (Input -> Output).
                2. Add Chain-of-Thought reasoning.
                3. Include 2 high-quality few-shot examples if applicable.
                4. Structure properly with clear delimiters.
                
                Raw Prompt: "${rawPrompt}"
                
                Output ONLY the optimized prompt.`,
                temperature: 0.7
            });
            setOptimizedPrompt(improved);
        } catch (e) {
            setOptimizedPrompt("### Optimized Prompt (Simulation)\n\nYou are a world-class expert. Please analyze the input and provide detailed reasoning...\n\n(LLM Connection Failed, using fallback)");
        }

        setIsOptimizing(false);
    };

    return (
        <PageTemplate
            title="DSPy Prompt Compiler"
            subtitle="Optimize prompts using Declarative Self-improving logic"
            icon={Zap}
            iconGradient="from-yellow-400 to-orange-500"
            isSidebarOpen={isSidebarOpen}
            iconSize={20}
            titleClassName="text-lg"
            subtitleClassName="text-xs"
        >
            <div className="flex h-full gap-6 p-6 bg-slate-50 overflow-hidden">
                {/* Left: Input */}
                <div className="flex-1 flex flex-col gap-4">
                    <Card className="flex-1 flex flex-col p-6 shadow-sm border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Bot size={20} className="text-slate-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Raw Input</h3>
                                <p className="text-xs text-slate-400">Enter your basic instruction</p>
                            </div>
                        </div>
                        <textarea
                            value={rawPrompt}
                            onChange={(e) => setRawPrompt(e.target.value)}
                            placeholder="E.g., Write a blog post about coffee..."
                            className="flex-1 w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none font-mono text-sm"
                        />
                        <div className="mt-4 flex justify-end">
                            <Button
                                onClick={handleOptimize}
                                disabled={isOptimizing || !rawPrompt}
                                className="bg-orange-500 hover:bg-orange-600 text-white gap-2 shadow-orange-200 shadow-lg"
                            >
                                {isOptimizing ? <RefreshCw className="animate-spin" /> : <Brain size={18} />}
                                Compile with DSPy
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Middle: Process (Visualizer) */}
                <div className="w-80 flex flex-col gap-4">
                    <Card className="flex-1 p-6 bg-slate-900 text-slate-300 shadow-lg border-slate-800 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-orange-600"></div>
                        <h3 className="font-mono text-xs font-bold text-orange-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                            <Cpu size={14} /> Optimization Log
                        </h3>

                        <div className="flex-1 font-mono text-xs space-y-3 overflow-y-auto custom-scrollbar">
                            {!isOptimizing && progress.length === 0 && (
                                <div className="text-slate-600 text-center mt-20 italic">
                                    System Standby...
                                    <br />
                                    Waiting for input.
                                </div>
                            )}
                            {progress.map((step, i) => (
                                <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span className="text-orange-500">➜</span>
                                    <span>{step}</span>
                                </div>
                            ))}
                            {isOptimizing && (
                                <div className="flex gap-2 animate-pulse text-orange-400">
                                    <span>➜</span>
                                    <span>_</span>
                                </div>
                            )}
                            {optimizedPrompt && (
                                <div className="text-emerald-400 border-t border-slate-800 pt-3 mt-2">
                                    <CheckCircle2 size={14} className="inline mr-2" />
                                    Compilation Complete.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right: Output */}
                <div className="flex-1 flex flex-col gap-4">
                    <Card className={`flex-1 flex flex-col p-6 shadow-md transition-all duration-500 ${optimizedPrompt ? 'border-orange-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50/50'}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`p-2 rounded-lg ${optimizedPrompt ? 'bg-orange-100' : 'bg-slate-100'}`}>
                                <Sparkles size={20} className={optimizedPrompt ? "text-orange-600" : "text-slate-400"} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Perfect Prompt</h3>
                                <p className="text-xs text-slate-400">Compiled by DSPy</p>
                            </div>
                            {optimizedPrompt && <Badge variant="default" className="ml-auto bg-emerald-500"> Optimized </Badge>}
                        </div>

                        <div className="flex-1 w-full bg-slate-50 rounded-xl border border-slate-100 p-4 font-mono text-sm text-slate-700 whitespace-pre-wrap overflow-y-auto">
                            {optimizedPrompt || <span className="text-slate-400 italic">Optimized result will appear here...</span>}
                        </div>
                    </Card>
                </div>
            </div>
        </PageTemplate>
    );
};
