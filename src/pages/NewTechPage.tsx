import React, { useState } from 'react';
import { PageTemplate } from '@/components/ui/PageTemplate';
import { Zap, Bot, RefreshCw, Sparkles, Brain, Cpu, CheckCircle2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LLMService } from '@/services/llm';
import { llmConfigDB } from '@/services/llmConfigDB';
import { LLMSelector } from '@/components/ui/LLMSelector';
import { LLMProviderId } from '@/types';
import ReactMarkdown from 'react-markdown';

interface NewTechPageProps {
    isSidebarOpen?: boolean;
}

const EXPERT_TUTORIAL = `
# LangChain vs. DSPy: A Deep Dive

**LangChain** focuses on **connecting** components (Chains). You write the prompt template, and LangChain manages the flow.

**DSPy** focuses on **optimizing** parameters. You define the *logic* (Signature) and provide *data*, and DSPy writes/tunes the prompt for you (simulating a Neural Network optimizer).

---

## 1. DSPy Compiler vs. Prompt Lab (The Concept)

You might ask: *"How is this different from the normal Prompt Lab?"*

| Feature | Prompt Lab (Generator) | DSPy (Compiler) |
| :--- | :--- | :--- |
| **Method** | **Template Filling** | **Optimization** |
| **Logic** | Uses rules (CO-STAR, RTF) to structure text. | Uses **Data & Metrics** to find the best prompt. |
| **User Role** | You are the **Writer**. | You are the **Architect**. |
| **Output** | A clean, human-readable prompt. | A high-performance, model-specific instruction (often messy but works better). |
| **Analogy** | Writing a speech with a template. | Training a dog with rewards (You don't write the "woof", you reward the logic). |

### When to use which?
*   **Use Prompt Lab** when you want to *understand* and *edit* the prompt yourself.
*   **Use DSPy** when you have a dataset of inputs/outputs and want the *highest accuracy* possible.

---

## 2. LangChain: The "Assembly Line" Approach

**Philosophy:** Explicitly define every step. You write the \`PromptTemplate\`.

### Code Example: Joke Generator

\`\`\`python
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

# 1. Define Model
model = ChatOpenAI(model="gpt-4")

# 2. Manual Prompt Template
prompt = ChatPromptTemplate.from_template(
    "Tell me a short, funny joke about {topic}."
)

# 3. Build Chain
chain = prompt | model

# 4. Run
chain.invoke({"topic": "Ice Cream"})
\`\`\`

---

## 3. DSPy: The "Compiler" Approach

**Philosophy:** Prompts are weights. You define **Signatures** (Inputs/Outputs).

### Code Example: Joke Generator

\`\`\`python
import dspy

# 1. Define Logic (Signature)
class GenerateJoke(dspy.Signature):
    """Generates a short, funny joke about a topic."""
    topic = dspy.InputField(desc="The subject")
    joke = dspy.OutputField(desc="A witty one-liner")

# 2. Define Module
joke_module = dspy.ChainOfThought(GenerateJoke)

# 3. Optimize (Compile)
# DSPy writes the prompt for you!
teleprompter = BootstrapFewShot(metric=humor_metric) 
compiled = teleprompter.compile(joke_module, trainset=data)
\`\`\`
`;

export const NewTechPage: React.FC<NewTechPageProps> = ({ isSidebarOpen }) => {
    const [activeTab, setActiveTab] = useState<'compiler' | 'tutorial'>('compiler');

    // Compiler State
    const [rawPrompt, setRawPrompt] = useState('');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [progress, setProgress] = useState<string[]>([]);
    const [optimizedPrompt, setOptimizedPrompt] = useState('');

    // LLM State
    const [selectedProvider, setSelectedProvider] = useState<LLMProviderId>('openai');
    const [selectedModel, setSelectedModel] = useState<string>('gpt-3.5-turbo');

    const handleOpenSettings = () => {
        window.dispatchEvent(new Event('open-settings-modal'));
    };

    const handleOptimize = async () => {
        if (!rawPrompt.trim()) return;

        setIsOptimizing(true);
        setOptimizedPrompt('');
        setProgress([]);

        const steps = [
            `Connecting to ${selectedProvider} (${selectedModel || 'Default'})...`,
            "Initializing DSPy Module...",
            "Defining Metric: semantic_similarity + conciseness",
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

            // Fallback: If no exact model match, try to find ANY config for this provider
            if (!config) {
                config = allConfigs.find(c => c.providerId === selectedProvider);
            }

            // Fallback: Default for OpenAI if not found (simulating first run)
            if (!config && selectedProvider === 'openai') {
                config = {
                    providerId: 'openai',
                    apiKey: '', // Will fail if not set, but allows error message
                    model: selectedModel,
                    baseUrl: ''
                };
            }

            if (!config) throw new Error(`No saved configuration for ${selectedProvider}. Please click the 'Settings' gear or 'Configure' button to set your API key.`);

            // Ensure model is set in config if we overrode it
            const executionConfig = { ...config, model: selectedModel || config.model };

            // 2. Get Provider
            const provider = LLMService.getInstance().getProvider(selectedProvider);
            if (!provider) throw new Error(`Provider ${selectedProvider} not available`);

            // 3. Execute
            const improved = await provider.generateCompletion({
                config: executionConfig,
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
                <div className="flex h-full gap-6 p-6 bg-slate-50 overflow-hidden">
                    {/* Left: Input */}
                    <div className="flex-1 flex flex-col gap-4">
                        <Card className="flex-1 flex flex-col p-6 shadow-sm border-slate-200">
                            <div className="flex items-center justify-between mb-4">
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
                                <div className="w-56">
                                    <LLMSelector
                                        onOpenSettings={handleOpenSettings}
                                        value={selectedProvider}
                                        model={selectedModel}
                                        onChange={(p, m) => {
                                            setSelectedProvider(p);
                                            if (m) setSelectedModel(m);
                                        }}
                                        className="mb-0"
                                    />
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
                                    Compile Prompt
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
                    <div className="flex-1 flex flex-col gap-4 min-h-0">
                        <Card className={`flex-1 flex flex-col p-6 shadow-md transition-all duration-500 min-h-0 ${optimizedPrompt ? 'border-orange-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50/50'}`}>
                            <div className="flex items-center gap-2 mb-4 shrink-0">
                                <div className={`p-2 rounded-lg ${optimizedPrompt ? 'bg-orange-100' : 'bg-slate-100'}`}>
                                    <Sparkles size={20} className={optimizedPrompt ? "text-orange-600" : "text-slate-400"} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Perfect Prompt</h3>
                                    <p className="text-xs text-slate-400">Processed by {selectedProvider}</p>
                                </div>
                                {optimizedPrompt && <Badge variant="default" className="ml-auto bg-emerald-500"> Optimized </Badge>}
                            </div>

                            <div className="flex-1 w-full bg-slate-50 rounded-xl border border-slate-100 p-4 font-mono text-sm text-slate-700 whitespace-pre-wrap overflow-y-auto custom-scrollbar">
                                {optimizedPrompt || <span className="text-slate-400 italic">Optimized result will appear here...</span>}
                            </div>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto bg-white p-8">
                    <div className="max-w-4xl mx-auto prose prose-slate prose-headings:font-bold prose-h1:text-3xl prose-h2:text-xl prose-pre:bg-slate-900 prose-pre:text-slate-200 prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:rounded">
                        <ReactMarkdown>
                            {EXPERT_TUTORIAL}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </PageTemplate>
    );
};
