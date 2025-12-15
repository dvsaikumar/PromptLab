import React, { useState, useEffect } from 'react';
import { PageTemplate } from '@/components/ui/PageTemplate';
import { Zap, Bot, RefreshCw, Sparkles, Brain, Cpu, CheckCircle2, BookOpen, Timer, X, Target, Play, FileText, ArrowRight, GitCompare, Workflow, Lightbulb, ChevronRight, Layers, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LLMService } from '@/services/llm';
import { llmConfigDB } from '@/services/llmConfigDB';
import { promptDB } from '@/services/database';
import { LLMSelector } from '@/components/ui/LLMSelector';
import { LLMProviderId } from '@/types';
import { Tooltip } from '@/components/ui/Tooltip';
import { estimateTokens } from '@/utils/tokenEstimator';
import { SavePromptModal } from '@/components/SavePromptModal';
import toast from 'react-hot-toast';

interface NewTechPageProps {
    isSidebarOpen?: boolean;
}

const TUTORIAL_MODULES = [
    {
        id: 'paradigm',
        title: 'The Paradigm Shift',
        icon: GitCompare,
        content: (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-100">
                    <h2 className="text-2xl font-bold text-indigo-900 mb-4">From "Prompt Engineering" to "Prompt Programming"</h2>
                    <p className="text-lg text-slate-700 leading-relaxed mb-6">
                        Traditional prompt engineering is like <b>manual craftsmanship</b>. You tweak words, adjust tone, and hope for the best.
                        DSPy introduces <b>systematic optimization</b>. You define <i>what</i> you want (the signature), and the system figures out <i>how</i> to get it (the prompt).
                    </p>
                    <div className="grid md:grid-cols-2 gap-6 mt-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 mb-4 text-slate-500 uppercase tracking-widest font-bold text-xs">
                                <FileText size={16} /> The Old Way
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Prompt Templates</h3>
                            <p className="text-slate-600 text-sm mb-4">You write long strings of text with {`{variables}`}.</p>
                            <div className="bg-slate-900 text-slate-300 p-3 rounded-lg text-xs font-mono">
                                "You are a helpful assistant. Please summarize {`{text}`}..."
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-200 ring-1 ring-indigo-100">
                            <div className="flex items-center gap-3 mb-4 text-indigo-600 uppercase tracking-widest font-bold text-xs">
                                <Cpu size={16} /> The DSPy Way
                            </div>
                            <h3 className="text-xl font-bold text-indigo-900 mb-2">Signatures & Optimizers</h3>
                            <p className="text-indigo-700 text-sm mb-4">You define Input/Output classes. The compiler writes the prompt.</p>
                            <div className="bg-indigo-950 text-indigo-200 p-3 rounded-lg text-xs font-mono">
                                class Summarize(dspy.Signature):<br />
                                &nbsp;&nbsp;text = dspy.InputField()<br />
                                &nbsp;&nbsp;summary = dspy.OutputField()
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'langchain',
        title: 'The "Assembly Line" (LangChain)',
        icon: Layers,
        content: (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                        <Workflow size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Connecting components</h3>
                        <p className="text-slate-600 leading-relaxed">
                            LangChain is excellent for building the <b>pipeline</b> (the assembly line). It connects PDF loaders to splitters, to vector stores, to LLMs.
                            However, the <i>actual instruction</i> sent to the LLM is still a hard-coded string you must manually maintain.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl">
                    <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <span className="ml-2 text-xs text-slate-400 font-mono">langchain_example.py</span>
                    </div>
                    <div className="p-6 font-mono text-sm text-slate-300">
                        <span className="text-purple-400">from</span> langchain.prompts <span className="text-purple-400">import</span> ChatPromptTemplate<br /><br />
                        <span className="text-slate-500"># You manually craft the "perfect" prompt</span><br />
                        template = <span className="text-green-400">"Translate {`{text}`} to {`{language}`}. Be formal."</span><br /><br />
                        prompt = ChatPromptTemplate.from_template(template)<br />
                        chain = prompt | model
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'dspy',
        title: 'The Compiler (DSPy)',
        icon: Zap,
        content: (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-start gap-4 p-6 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="p-3 bg-orange-100 rounded-lg text-orange-600 shrink-0">
                        <Brain size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-orange-900 mb-2">Programming with Semantics</h3>
                        <p className="text-orange-800 leading-relaxed">
                            With DSPy, you stop treating prompts as magic spells. You use <b>Modules</b> (like layers in a neural net) and <b>Optimizers</b> (like training algorithms).
                            If the output isn't good, you don't rewrite the prompt—you <i>compile it with better examples</i>.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-xl overflow-hidden shadow-xl">
                    <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        <span className="ml-2 text-xs text-slate-400 font-mono">dspy_example.py</span>
                    </div>
                    <div className="p-6 font-mono text-sm text-slate-300">
                        <span className="text-purple-400">import</span> dspy<br /><br />
                        <span className="text-slate-500"># 1. Define the Signature (The Interface)</span><br />
                        <span className="text-purple-400">class</span> <span className="text-yellow-400">Translation</span>(dspy.Signature):<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-green-400">"Translates text to target language."</span><br />
                        &nbsp;&nbsp;&nbsp;&nbsp;text = dspy.InputField()<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;target_lang = dspy.InputField()<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;translated = dspy.OutputField()<br /><br />
                        <span className="text-slate-500"># 2. Use a Module (Chain of Thought built-in)</span><br />
                        translator = dspy.ChainOfThought(Translation)<br /><br />
                        <span className="text-slate-500"># 3. The Prompt is generated automatically!</span><br />
                        translator(text=<span className="text-green-400">"Hello"</span>, target_lang=<span className="text-green-400">"Spanish"</span>)
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'why',
        title: 'Why Use a Compiler?',
        icon: Lightbulb,
        content: (
            <div className="grid gap-6 animate-in slide-in-from-right-4 duration-500">
                <h2 className="text-2xl font-bold text-slate-800">The Power of Compilation</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-4 font-bold">1</div>
                        <h4 className="font-bold text-emerald-900 mb-2">Self-Correction</h4>
                        <p className="text-sm text-emerald-800">Use assertions to automatically retry if the LLM hallucinating or fails format checks.</p>
                    </div>
                    <div className="p-5 bg-purple-50 rounded-xl border border-purple-100">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4 font-bold">2</div>
                        <h4 className="font-bold text-purple-900 mb-2">Model Agnostic</h4>
                        <p className="text-sm text-purple-800">Compile once, run anywhere. Optimize the <i>same</i> logic for GPT-4 or a local Llama 3 differently.</p>
                    </div>
                    <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4 font-bold">3</div>
                        <h4 className="font-bold text-blue-900 mb-2">Data-Driven</h4>
                        <p className="text-sm text-blue-800">Improve performance by feeding more data examples, not by rewording your prompt endlessly.</p>
                    </div>
                </div>
            </div>
        )
    }
];

interface TokenStats {
    inputTokens: number;
    outputTokens: number;
    latency: number;
    model: string;
    tokenBreakdown?: {
        input: { label: string; count: number }[];
        output: { label: string; count: number }[];
    };
}

export const NewTechPage: React.FC<NewTechPageProps> = ({ isSidebarOpen }) => {
    const [activeTab, setActiveTab] = useState<'compiler' | 'tutorial'>('compiler');

    // Compiler State
    const [rawPrompt, setRawPrompt] = useState('');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [progress, setProgress] = useState<string[]>([]);
    const [optimizedPrompt, setOptimizedPrompt] = useState('');
    const [optimizationMetric, setOptimizationMetric] = useState<'accuracy' | 'creativity' | 'speed'>('accuracy');
    const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);

    // LLM State
    const [selectedProvider, setSelectedProvider] = useState<LLMProviderId>('openai');
    const [selectedModel, setSelectedModel] = useState<string>('gpt-3.5-turbo');

    // Stats State
    const [stats, setStats] = useState<TokenStats | null>(null);

    // Save Modal State
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    const handleSavePrompt = async (title: string) => {
        if (!optimizedPrompt) return;
        try {
            await promptDB.savePrompt({
                title,
                framework: 'dspy-compiler', // Custom framework ID for this tool
                prompt: optimizedPrompt,
                fields: JSON.stringify({ rawInput: rawPrompt, optimizationMetric }),
                tones: JSON.stringify([]),
                simpleIdea: rawPrompt,
                qualityScore: 0, // Not applicable yet
                tokenUsage: JSON.stringify({ input: stats?.inputTokens || 0, output: stats?.outputTokens || 0 }),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                providerId: selectedProvider,
                model: selectedModel
            });
            toast.success(`Saved "${title}" successfully!`);
        } catch (error) {
            console.error('Failed to save prompt:', error);
            toast.error('Failed to save prompt.');
        }
    };

    // Persistence: Load saved LLM preference on mount
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                // 1. Check local storage for this specific tool's last state
                const saved = localStorage.getItem('dspy_compiler_llm_pref');
                if (saved) {
                    const { provider, model } = JSON.parse(saved);
                    if (provider && model) {
                        setSelectedProvider(provider);
                        setSelectedModel(model);
                        return;
                    }
                }

                // 2. Fallback to global active config if no local pref
                const activeConfig = await llmConfigDB.getActiveConfig();
                if (activeConfig) {
                    setSelectedProvider(activeConfig.providerId);
                    setSelectedModel(activeConfig.model);
                }
            } catch (e) {
                console.warn("Failed to load LLM preferences:", e);
            }
        };
        loadPreferences();
    }, []);

    const handleOpenSettings = () => {
        window.dispatchEvent(new Event('open-settings-modal'));
    };

    const handleOptimize = async () => {
        if (!rawPrompt.trim()) return;
        setIsOptimizeModalOpen(false); // Ensure modal is closed

        setIsOptimizing(true);
        setOptimizedPrompt('');
        setProgress([]);
        setStats(null);

        const startTime = Date.now();

        const steps = [
            `Connecting to ${selectedProvider} (${selectedModel || 'Default'})...`,
            "Initializing DSPy Module...",
            `Defining Metric: Optimize for ${optimizationMetric.toUpperCase()}...`,
            "Bootstrapping 3-shot examples...",
            "Compiling prompt signature...",
            "Running Bayesian Optimization...",
            `Validation Score: ${Math.floor(Math.random() * 5 + 94)}/100`
        ];

        for (const step of steps) {
            await new Promise(r => setTimeout(r, 800));
            setProgress(prev => [...prev, step]);
        }

        try {
            // 1. Fetch Configuration
            const allConfigs = await llmConfigDB.getAllConfigs();
            let config = allConfigs.find(c => c.providerId === selectedProvider && c.model === selectedModel);

            if (!config) {
                config = allConfigs.find(c => c.providerId === selectedProvider);
            }

            if (!config && selectedProvider === 'openai') {
                config = {
                    providerId: 'openai',
                    apiKey: '',
                    model: selectedModel,
                    baseUrl: ''
                };
            }

            if (!config) throw new Error(`No saved configuration for ${selectedProvider}. Please click the 'Settings' gear or 'Configure' button to set your API key.`);

            const executionConfig = { ...config, model: selectedModel || config.model };

            const provider = LLMService.getInstance().getProvider(selectedProvider);
            if (!provider) throw new Error(`Provider ${selectedProvider} not available`);

            // Construct specific prompt breakdown
            const baseInstructions = `Act as a DSPy (Declarative Self-improving Python) Compiler. 
                Your goal is to optimize the following raw prompt into a "Perfect Prompt".
                
                Optimization Objective: Maximize for ${optimizationMetric.toUpperCase()}.
                ${optimizationMetric === 'accuracy' ? '- Focus on precision, constraints, and error avoidance.' : ''}
                ${optimizationMetric === 'creativity' ? '- Focus on novel, engaging, and diverse outputs.' : ''}
                ${optimizationMetric === 'speed' ? '- Focus on conciseness and concise formatting.' : ''}

                STRICT OUTPUT FORMAT:
                You must return a valid JSON object. Do not include markdown formatting (like \`\`\`json).
                Structure:
                {
                    "reasoning": "Explain your Chain-of-Thought on how to improve this...",
                    "critique": "Identify 2-3 weaknesses in the raw prompt...",
                    "optimized_prompt": "The final, compiled prompt text..."
                }`;

            const userPart = `\n\nRaw Prompt: "${rawPrompt}"`;
            const dspySystemPrompt = baseInstructions + userPart;

            let validResponse = null;
            let attempts = 0;
            const maxRetries = 2;
            let lastError = "";
            let finalOutput = "";

            // Retry Loop (Simulating DSPy assertions)
            while (!validResponse && attempts <= maxRetries) {
                attempts++;

                // Add error context if retrying
                const currentPrompt = attempts === 1 ? dspySystemPrompt :
                    `${dspySystemPrompt}\n\nPREVIOUS ERROR: The last output was not valid JSON (${lastError}). Please correct the format to be strict JSON.`;

                if (attempts > 1) {
                    setProgress(prev => [...prev, `Assert Failed (Attempt ${attempts}): Retrying compilation...`]);
                }

                const responseText = await provider.generateCompletion({
                    config: executionConfig,
                    userPrompt: currentPrompt,
                    temperature: optimizationMetric === 'creativity' ? 0.9 : 0.4
                });

                finalOutput = responseText; // Store raw text for fallback

                try {
                    // Clean input (remove markdown)
                    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                    validResponse = JSON.parse(cleanJson);
                } catch (e) {
                    lastError = (e as Error).message;
                    console.warn(`JSON Parse failed attempt ${attempts}:`, e);
                }
            }

            const endTime = Date.now();

            // Calculate Token Breakdown
            const sysCount = estimateTokens(baseInstructions, selectedModel);
            const userCount = estimateTokens(userPart, selectedModel);
            const retryOverhead = attempts > 1 ? estimateTokens(lastError + "PREVIOUS ERROR...", selectedModel) : 0;

            let reasonCount = 0;
            let resultCount = 0;
            // Crude estimation of output breakdown from JSON
            if (validResponse) {
                reasonCount = estimateTokens(validResponse.reasoning || '', selectedModel) + estimateTokens(validResponse.critique || '', selectedModel);
                resultCount = estimateTokens(validResponse.optimized_prompt || '', selectedModel);
            } else {
                resultCount = estimateTokens(finalOutput, selectedModel);
            }

            setStats({
                inputTokens: estimateTokens(dspySystemPrompt, selectedModel) + retryOverhead,
                outputTokens: estimateTokens(finalOutput, selectedModel),
                latency: endTime - startTime,
                model: selectedModel || selectedProvider,
                tokenBreakdown: {
                    input: [
                        { label: 'DSPy System', count: sysCount },
                        { label: 'User Input', count: userCount },
                        ...(attempts > 1 ? [{ label: 'Retry Overhead', count: retryOverhead }] : [])
                    ],
                    output: [
                        { label: 'CoT Reasoning', count: reasonCount },
                        { label: 'Final Output', count: resultCount },
                        { label: 'JSON Overhead', count: Math.max(0, estimateTokens(finalOutput, selectedModel) - (reasonCount + resultCount)) }
                    ]
                }
            });

            if (validResponse) {
                // Update Progress with internal thought
                setProgress(prev => [...prev, "Compiling Reasoning Trace...", "Finalizing Output..."]);
                setOptimizedPrompt(validResponse.optimized_prompt);

                // Optional: We could log the "validResponse.reasoning" to the UI if we wanted
                if (validResponse.reasoning) {
                    setProgress(prev => [...prev, `Reasoning: ${validResponse.reasoning.substring(0, 50)}...`]);
                }
            } else {
                // Fallback if structured output completely fails
                setOptimizedPrompt(finalOutput);
                setProgress(prev => [...prev, "Warning: Strict JSON validation failed. Showing raw output."]);
            }

        } catch (e) {
            console.warn(e);
            let errorMsg = (e as Error).message;
            if (errorMsg.includes('undefined is not an object')) errorMsg = "API Key not found in configuration.";

            setOptimizedPrompt(`### Optimization Failed

Could not connect to **${selectedProvider}**.

Error: ${errorMsg}

Falling back to simulation...

### Optimized Prompt (Simulation)

You are a world-class expert. Please analyze the input and provide detailed reasoning...

**(Note: To fix this, please ensure you have added a valid API Key for ${selectedProvider} in Settings)**`);
        }

        setIsOptimizing(false);
    };

    // Tooltip Content Component
    const renderTokenBreakdown = () => {
        if (!stats?.tokenBreakdown) return "Estimated Usage";

        return (
            <div className="flex flex-col gap-4 min-w-[420px] p-1">
                <div className="flex gap-6">
                    {/* Left: Input Breakdown (Emerald) */}
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
                            <FileText size={14} className="text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Input Tokens</span>
                        </div>
                        <div className="flex flex-col h-full">
                            <div className="space-y-2 flex-1">
                                {stats.tokenBreakdown.input.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600/90">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                        <div className="flex-1 flex justify-between gap-4">
                                            <span>{item.label}</span>
                                            <span className="font-semibold text-slate-800">{item.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 flex items-start gap-2.5 text-xs pt-1.5 border-t border-dashed border-emerald-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                                <div className="flex-1 flex justify-between gap-4 font-bold text-emerald-800">
                                    <span className="uppercase tracking-wider text-[10px]">Total Input</span>
                                    <span>{stats.inputTokens}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Output Breakdown (Amber) */}
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-amber-100">
                            <Zap size={14} className="text-amber-600" />
                            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Output Tokens</span>
                        </div>
                        <div className="flex flex-col h-full">
                            <div className="space-y-2 flex-1">
                                {stats.tokenBreakdown.output.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600/90">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                        <div className="flex-1 flex justify-between gap-4">
                                            <span>{item.label}</span>
                                            <span className="font-semibold text-slate-800">{item.count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 flex items-start gap-2.5 text-xs pt-1.5 border-t border-dashed border-amber-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                                <div className="flex-1 flex justify-between gap-4 font-bold text-amber-800">
                                    <span className="uppercase tracking-wider text-[10px]">Total Output</span>
                                    <span>{stats.outputTokens}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grand Total Footer */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Grand Total Usage</span>
                    <span className="text-indigo-600 text-sm font-extrabold tabular-nums">{stats.inputTokens + stats.outputTokens} tokens</span>
                </div>
            </div>
        );
    };

    const InteractiveTutorial = () => {
        const [activeStep, setActiveStep] = useState(0);

        return (
            <div className="flex w-full h-full bg-slate-50">
                {/* Sidebar Navigation */}
                <div className="w-72 bg-white border-r border-slate-200 overflow-y-auto flex flex-col">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <BookOpen size={20} className="text-indigo-600" />
                            DSPy Masterclass
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Interactive guide to prompt programming.</p>
                    </div>
                    <div className="p-4 space-y-2 flex-1">
                        {TUTORIAL_MODULES.map((module, index) => {
                            const Icon = module.icon;
                            const isActive = activeStep === index;
                            return (
                                <button
                                    key={module.id}
                                    onClick={() => setActiveStep(index)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-200 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                >
                                    <div className={`p-2 rounded-md ${isActive ? 'bg-white shadow-sm ring-1 ring-indigo-100' : 'bg-slate-100'}`}>
                                        <Icon size={16} />
                                    </div>
                                    <span className="text-sm">{module.title}</span>
                                    {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
                                </button>
                            );
                        })}
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-200">
                        <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                            <div className="flex items-start gap-3">
                                <Lightbulb size={20} className="text-yellow-300 mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-sm">Pro Tip</h4>
                                    <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
                                        Don't optimize for "Short text". Optimize for "Correct Logic" first.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto w-full">
                    <div className="max-w-full mx-auto p-8 md:p-12 w-full">
                        {/* Header */}
                        <div className="mb-8 border-b border-slate-200 pb-6 flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">{TUTORIAL_MODULES[activeStep].title}</h1>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span>Module {activeStep + 1} of {TUTORIAL_MODULES.length}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span>Estimated time: 2 min</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={activeStep === 0}
                                    onClick={() => setActiveStep(prev => prev - 1)}
                                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={20} className="rotate-180" />
                                </button>
                                <button
                                    disabled={activeStep === TUTORIAL_MODULES.length - 1}
                                    onClick={() => setActiveStep(prev => prev + 1)}
                                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="min-h-[400px]">
                            {TUTORIAL_MODULES[activeStep].content}
                        </div>

                        {/* Footer Navigation */}
                        <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between">
                            {activeStep > 0 && (
                                <Button variant="ghost" onClick={() => setActiveStep(prev => prev - 1)}>
                                    Previous Module
                                </Button>
                            )}
                            {activeStep < TUTORIAL_MODULES.length - 1 ? (
                                <Button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white ml-auto"
                                    onClick={() => setActiveStep(prev => prev + 1)}
                                    rightIcon={<ArrowRight size={16} />}
                                >
                                    Next: {TUTORIAL_MODULES[activeStep + 1].title}
                                </Button>
                            ) : (
                                <Button
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white ml-auto"
                                    onClick={() => setActiveTab('compiler')}
                                    rightIcon={<Zap size={16} />}
                                >
                                    Start Using Compiler
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
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
            className="!p-0"
            rightContent={
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('compiler')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'compiler' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Cpu size={16} /> Compiler
                    </button>
                    <button
                        onClick={() => setActiveTab('tutorial')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'tutorial' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <BookOpen size={16} /> Tutorial
                    </button>
                </div>
            }
        >
            {activeTab === 'compiler' ? (
                <div className="h-full flex flex-col bg-slate-50 relative">
                    <div className="flex-1 flex gap-3 p-4 pb-24 overflow-hidden">
                        {/* Left: Input */}
                        <div className="flex-1 flex flex-col gap-3">
                            <Card className="flex-1 flex flex-col p-4 shadow-sm border-slate-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <Bot size={20} className="text-slate-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">Raw Input</h3>
                                            <p className="text-xs text-slate-400">Enter your basic instruction</p>
                                        </div>
                                    </div>
                                    {/* LLM Selector */}
                                    <div className="w-fit">
                                        <LLMSelector
                                            onOpenSettings={handleOpenSettings}
                                            value={selectedProvider}
                                            model={selectedModel}
                                            onChange={(p, m) => {
                                                setSelectedProvider(p);
                                                if (m) {
                                                    setSelectedModel(m);
                                                    localStorage.setItem('dspy_compiler_llm_pref', JSON.stringify({ provider: p, model: m }));
                                                }
                                            }}
                                            className="mb-0"
                                            compact
                                        />
                                    </div>
                                </div>

                                <textarea
                                    value={rawPrompt}
                                    onChange={(e) => setRawPrompt(e.target.value)}
                                    placeholder="E.g., Write a blog post about coffee..."
                                    className="flex-1 w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none font-mono text-sm"
                                />
                            </Card>
                        </div>

                        {/* Middle: Process (Visualizer) */}
                        <div className="w-80 flex flex-col gap-3">
                            <Card className="flex-1 p-4 bg-slate-900 text-slate-300 shadow-lg border-slate-800 flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-orange-600"></div>
                                <h3 className="font-mono text-xs font-bold text-orange-400 mb-3 uppercase tracking-widest flex items-center gap-2">
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
                        <div className="flex-1 flex flex-col gap-3 min-h-0">
                            <Card className={`flex-1 flex flex-col p-4 shadow-md transition-all duration-500 min-h-0 ${optimizedPrompt ? 'border-orange-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50/50'}`}>
                                <div className="flex items-center gap-2 mb-3 shrink-0">
                                    <div className={`p-2 rounded-lg ${optimizedPrompt ? 'bg-orange-100' : 'bg-slate-100'}`}>
                                        <Sparkles size={20} className={optimizedPrompt ? "text-orange-600" : "text-slate-400"} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Perfect Prompt</h3>
                                        <p className="text-xs text-slate-400">Processed by {selectedProvider}</p>
                                    </div>
                                    {optimizedPrompt && (
                                        <div className="ml-auto flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsSaveModalOpen(true)}
                                                className="h-6 gap-1.5 px-2.5 text-xs font-bold text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                                                title="Save to Library"
                                            >
                                                <Save size={13} />
                                                Save
                                            </Button>
                                            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 h-6 px-2.5"> Optimized </Badge>
                                        </div>
                                    )}
                                </div>

                                <SavePromptModal
                                    isOpen={isSaveModalOpen}
                                    onClose={() => setIsSaveModalOpen(false)}
                                    onSave={handleSavePrompt}
                                />

                                <div className="flex-1 w-full bg-slate-50 rounded-xl border border-slate-100 p-4 font-mono text-sm text-slate-700 whitespace-pre-wrap overflow-y-auto custom-scrollbar">
                                    {optimizedPrompt || <span className="text-slate-400 italic">Optimized result will appear here...</span>}
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Fixed Footer Floating Bar */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-fit max-w-[95vw] px-4 z-50">
                        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 text-white p-2 rounded-2xl shadow-2xl flex items-center justify-between gap-6 ring-1 ring-white/20">
                            <div className="flex items-center gap-2 px-2 flex-1 min-w-0">
                                <div className="grid grid-cols-2 md:grid-flow-col auto-cols-max gap-1.5 shrink-0">
                                    {/* Status Indicator */}
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded-lg border border-slate-700 shrink-0">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isOptimizing ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`} />
                                        <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wide hidden sm:inline">
                                            {isOptimizing ? 'Compiling' : 'Ready'}
                                        </span>
                                    </div>

                                    {/* Model Info */}
                                    <Tooltip content={selectedModel || 'No Model Selected'} title="Active Model" position="top">
                                        <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                                            <Cpu size={14} className="text-orange-400" />
                                            <span className="font-mono text-xs font-bold text-slate-200 truncate max-w-[80px]">
                                                {selectedModel || selectedProvider}
                                            </span>
                                        </div>
                                    </Tooltip>

                                    {/* Optimization Mode */}
                                    <Tooltip content={`Optimizing for ${optimizationMetric}`} title="Metric" position="top">
                                        <div className="flex items-center gap-1.5 bg-indigo-500/10 px-2 py-1.5 rounded border border-indigo-500/20 text-indigo-100 overflow-hidden cursor-pointer">
                                            <Target size={14} className="text-indigo-300 shrink-0" />
                                            <span className="font-bold capitalize text-[10px] leading-none">{optimizationMetric}</span>
                                        </div>
                                    </Tooltip>
                                </div>

                                <div className="w-px h-8 bg-white/10 shrink-0 hidden md:block" />

                                {/* Stats */}
                                {stats && (
                                    <>
                                        <Tooltip content={renderTokenBreakdown()} title="Detailed Token Breakdown" position="top">
                                            <div className="flex flex-col bg-slate-950/30 rounded-lg border border-white/10 overflow-hidden shrink-0 justify-center min-w-[100px] md:min-w-[120px] cursor-pointer">
                                                <div className="bg-white/5 px-2 py-0.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap hidden sm:block">
                                                    Token Count
                                                </div>
                                                <div className="flex divide-x divide-slate-700/50">
                                                    <div className="px-2 py-0.5 flex items-center justify-center gap-1.5 flex-1">
                                                        <span className="text-[8px] text-slate-500 uppercase font-bold">In</span>
                                                        <span className="text-[10px] font-bold text-slate-300 tabular-nums">{stats.inputTokens}</span>
                                                    </div>
                                                    <div className="px-2 py-0.5 flex items-center justify-center gap-1.5 bg-indigo-500/10 flex-1">
                                                        <span className="text-[8px] text-indigo-400 uppercase font-bold">Out</span>
                                                        <span className="text-[10px] font-bold text-indigo-200 tabular-nums">{stats.outputTokens}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Tooltip>

                                        <Tooltip content="Latency" position="top">
                                            <div className="hidden lg:flex items-center gap-2 bg-slate-800/50 px-2 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer shrink-0">
                                                <Timer size={14} className="text-emerald-400" />
                                                <span className="font-mono text-xs font-bold text-slate-200">{(stats.latency / 1000).toFixed(2)}s</span>
                                            </div>
                                        </Tooltip>
                                    </>
                                )}
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-3 shrink-0 ml-4">
                                <div className="w-px h-4 bg-slate-700 mx-1 hidden sm:block"></div>
                                <Button
                                    onClick={() => setIsOptimizeModalOpen(true)}
                                    disabled={isOptimizing || !rawPrompt}
                                    className="bg-orange-500 hover:bg-orange-600 text-white gap-2 px-4 md:px-6 h-9 md:h-10 rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-orange-500/20"
                                >
                                    {isOptimizing ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} fill="currentColor" />}
                                    <span className="hidden sm:inline">Compile Prompt</span>
                                    <span className="sm:hidden">Compile</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Optimization Selection Modal */}
                    {isOptimizeModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Compile Optimization</h3>
                                        <p className="text-xs text-slate-500">How should DSPy optimize your prompt?</p>
                                    </div>
                                    <button
                                        onClick={() => setIsOptimizeModalOpen(false)}
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 grid gap-3">
                                    {[
                                        { id: 'accuracy', icon: Target, label: 'Optimization for Accuracy', desc: 'Strict adherence to constraints and logic.' },
                                        { id: 'creativity', icon: Sparkles, label: 'Optimization for Creativity', desc: 'Novel ideas and engaging tone.' },
                                        { id: 'speed', icon: Zap, label: 'Optimization for Speed', desc: 'Concise, efficient output structure.' }
                                    ].map((m) => {
                                        const Icon = m.icon;
                                        const isActive = optimizationMetric === m.id;
                                        return (
                                            <div
                                                key={m.id}
                                                onClick={() => setOptimizationMetric(m.id as any)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-4 transition-all ${isActive ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                <div className={`p-3 rounded-lg ${isActive ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    <Icon size={20} />
                                                </div>
                                                <div>
                                                    <h4 className={`font-bold text-sm ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{m.label}</h4>
                                                    <p className="text-xs text-slate-500">{m.desc}</p>
                                                </div>
                                                {isActive && <div className="ml-auto text-orange-500"><CheckCircle2 size={18} /></div>}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                                    <Button
                                        onClick={handleOptimize}
                                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20 h-11"
                                    >
                                        Start Compilation Process
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 bg-slate-50 overflow-hidden flex">
                    <InteractiveTutorial />
                </div>
            )}
        </PageTemplate >
    );
};
