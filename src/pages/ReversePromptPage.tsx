import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, HelpCircle, Sparkles, Paperclip, Loader2, Save, Copy, FileText, X, Settings2, Eye, ChevronRight, Wand2, ArrowRight, Microscope } from 'lucide-react';
import { PageTemplate } from '@/components/ui/PageTemplate';
import { Button } from '@/components/ui/Button';
import { usePrompt } from '@/contexts/PromptContext';
import { LLMService } from '@/services/llm';
import { promptDB } from '@/services/database';
import { SavePromptModal } from '@/components/SavePromptModal';
import Tesseract from 'tesseract.js';
import toast from 'react-hot-toast';
import { LLMSelector } from '@/components/ui/LLMSelector';
import { PersonaSelector } from '@/components/ui/PersonaSelector';
import { AnalysisFocusSelector } from '@/components/ui/AnalysisFocusSelector';
import { PERSONAS } from '@/constants/personas';
import {
    ANALYSIS_MODES,
    FOCUS_TEMPLATES,
    GOD_MODE_INSTRUCTION,
    CURSOR_AGENT_PROTOCOL,
    // GEMINI_VIBE_CODER_PROTOCOL, // Unused
    // V0_DESIGN_PROTOCOL, // Unused
    SONNET_DESIGN_PROTOCOL,
    TECHNOLOGIES_DEFAULT
} from '@/constants/reverse-prompt';
import { Card } from '@/components/ui/Card';

interface ReversePromptProps {
    isSidebarOpen?: boolean;
}

interface UploadedFile {
    id: string;
    name: string;
    type: string;
    base64: string;
    preview?: string;
}

export const ReversePrompt: React.FC<ReversePromptProps> = ({ isSidebarOpen = false }) => {
    const { llmConfig } = usePrompt();
    const [inputText, setInputText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isEnhancingInput, setIsEnhancingInput] = useState(false);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string>('prompt-engineer');
    const [analysisMode, setAnalysisMode] = useState<string>('general');
    const [techStack] = useState<string>(TECHNOLOGIES_DEFAULT);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [ocrContent, setOcrContent] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Track the last auto-generated text to allow safe overwrites
    const lastAutoTemplateRef = useRef<string>('');

    // Tutorial State
    const [tutorialStep, setTutorialStep] = useState<number>(-1);

    const startTutorial = () => {
        setTutorialStep(0);
        toast.dismiss();
        toast('Tutorial started!', { icon: '🎓' });
    };

    const nextTutorialStep = () => {
        setTutorialStep(prev => prev + 1);
    };

    const endTutorial = () => {
        setTutorialStep(-1);
        toast.success("You're ready to reverse engineer!");
    };

    const TutorialOverlay = () => {
        if (tutorialStep === -1) return null;

        const steps = [
            {
                title: "Welcome to Reverse Engineering",
                content: "This tool helps you deconstruct code, designs, and prompts to understand how they were made. Let's take a quick tour.",
            },
            {
                title: "1. Configuration",
                content: "Start by selecting your LLM, a specific Persona (Role), and the Analysis Mode (e.g., Design, Code, Security).",
            },
            {
                title: "2. Input Content",
                content: "Paste your code/text or upload images (screenshots/diagrams). We use Vision AI to analyze visual inputs.",
            },
            {
                title: "3. Analyze & Deconstruct",
                content: "Click the 'Deconstruct' button in the bottom dock. The AI will generate a 'Bible Prompt' or technical specification.",
            },
            {
                title: "4. Result & Export",
                content: "Your result appears on the right. You can copy it or save it to your library.",
            }
        ];

        const step = steps[tutorialStep];
        if (!step) {
            endTutorial();
            return null;
        }

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative border border-slate-100 animate-in zoom-in-50 duration-300">
                    <div className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer" onClick={endTutorial}>
                        <X size={20} />
                    </div>

                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                        <HelpCircle size={28} />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {step.title}
                    </h3>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        {step.content}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-all ${idx === tutorialStep ? 'bg-orange-500 w-6' : 'bg-slate-200'}`}
                                />
                            ))}
                        </div>
                        <Button onClick={nextTutorialStep} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                            {tutorialStep === steps.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // Auto-fill template dynamically based on Mode AND Persona
    useEffect(() => {
        const baseTemplate = FOCUS_TEMPLATES[analysisMode];
        if (!baseTemplate) return;

        const persona = PERSONAS.find(p => p.id === selectedPersonaId) || PERSONAS[0];

        // Construct Dynamic Template: "As a [Role], [instruction lowercased]"
        const newTemplate = `As a ${persona.role}, ${baseTemplate.charAt(0).toLowerCase() + baseTemplate.slice(1)}`;

        const currentText = inputText.trim();

        // Smart Overwrite Logic:
        // Only update if input is empty OR if the current text identifies identical to what we auto-generated last time.
        if (!currentText || currentText === lastAutoTemplateRef.current) {
            setInputText(newTemplate);
            lastAutoTemplateRef.current = newTemplate;
        }
    }, [analysisMode, selectedPersonaId, inputText]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0) return;

        setIsProcessingFile(true);
        const toastId = toast.loading('Processing files...');

        try {
            const newFiles: UploadedFile[] = [];

            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];
                if (!file.type.startsWith('image/')) {
                    toast.error(`Skipped ${file.name}: Not an image.`);
                    continue;
                }

                // 1. Convert to Base64
                const base64String = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });

                // 2. OCR (Optional - Best Effort)
                try {
                    const { data: { text } } = await Tesseract.recognize(file, 'eng');
                    if (text && text.trim()) {
                        setOcrContent(prev => prev + (prev ? '\n\n' : '') + `[Context from ${file.name}]:\n${text}`);
                        toast.success(`Extracted text from ${file.name}`, { id: 'ocr-success-' + i });
                    }
                } catch (ocrError) {
                    console.warn(`OCR Failed for ${file.name}`, ocrError);
                }

                newFiles.push({
                    id: Math.random().toString(36).substring(7),
                    name: file.name,
                    type: file.type,
                    base64: base64String,
                    preview: base64String
                });
            }

            setFiles(prev => [...prev, ...newFiles]);
            toast.success('Files processed', { id: toastId });
        } catch (error) {
            console.error('File processing error:', error);
            toast.error('Failed to process files', { id: toastId });
        } finally {
            setIsProcessingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleEnhanceInput = async () => {
        if (!inputText.trim()) {
            toast.error('Please enter some text to enhance');
            return;
        }

        setIsEnhancingInput(true);
        const toastId = toast.loading('Enhancing input...');

        try {
            const provider = LLMService.getInstance().getProvider(llmConfig.providerId);
            const enhanced = await provider.generateCompletion({
                config: llmConfig,
                systemPrompt: "You are an expert technical editor. Your task is to refine the user's input text to make it clearer, better structured, and more suitable for technical analysis or reverse engineering. If it is code, format it and add comments where unclear. If it is a description, make it more precise and detailed. Do not add introductory conversational text, just output the enhanced content.",
                userPrompt: inputText,
                temperature: 0.3
            });

            setInputText(enhanced);
            toast.success('Input enhanced!', { id: toastId });
        } catch (error: any) {
            toast.error('Failed to enhance input: ' + error.message, { id: toastId });
        } finally {
            setIsEnhancingInput(false);
        }
    };

    const handleAnalyze = async () => {
        if (!inputText.trim() && files.length === 0) {
            toast.error('Please provide some content or upload an image.');
            return;
        }

        setIsAnalyzing(true);
        const toastId = toast.loading('Deconstructing...');

        try {
            let systemPrompt = '';

            // Mode-Specific Prompt Construction
            switch (analysisMode) {
                case 'god-mode':
                    systemPrompt = GOD_MODE_INSTRUCTION + `\n\nTARGET TECH STACK: ${techStack}`;
                    break;
                case 'design-dna':
                    systemPrompt = SONNET_DESIGN_PROTOCOL;
                    break;
                case 'code-audit':
                    systemPrompt = CURSOR_AGENT_PROTOCOL;
                    break;
                default:
                    const persona = PERSONAS.find(p => p.id === selectedPersonaId);
                    systemPrompt = `You are a ${persona?.role || 'Expert System'}. ${persona?.prompt || ''}`;
            }

            // Append OCR or Context
            let finalInput = inputText;
            if (ocrContent) {
                finalInput += `\n\n[EXTRACTED VISUAL CONTEXT]\n${ocrContent}`;
            }

            const images = files
                .filter(f => f.type.startsWith('image/'))
                .map(f => f.base64);

            const provider = LLMService.getInstance().getProvider(llmConfig.providerId);
            const content = await provider.generateCompletion({
                config: llmConfig,
                systemPrompt,
                userPrompt: finalInput,
                temperature: 0.2,
                images: images.length > 0 ? images : undefined
            });

            setResult(content);
            toast.success('Analysis Complete', { id: toastId });
        } catch (error: any) {
            console.error('Analysis failed:', error);
            toast.error('Analysis failed: ' + (error.message || 'Unknown error'), { id: toastId });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Header Actions
    const HeaderButtons = (
        <Button
            variant="ghost"
            size="sm"
            onClick={startTutorial}
            className="text-slate-500 hover:text-orange-600 hover:bg-orange-50 gap-2"
        >
            <HelpCircle size={18} />
        </Button>
    );

    return (
        <PageTemplate
            title="Reverse Engineering Lab"
            subtitle="Deconstruct apps, code, and designs"
            icon={Microscope}
            iconGradient="from-orange-500 to-amber-600"
            isSidebarOpen={isSidebarOpen}
            rightContent={HeaderButtons}
            className="flex flex-col !p-0 !top-[144px] bg-slate-50/50"
            headerClassName="!px-4 bg-slate-50 z-50"
            iconSize={20}
            titleClassName="text-lg"
            subtitleClassName="text-xs"
        >
            <TutorialOverlay />
            <SavePromptModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={async (title) => {
                    try {
                        await promptDB.savePrompt({
                            title,
                            framework: 'reverse-engineering',
                            prompt: inputText,
                            fields: JSON.stringify({ analysisMode, techStack, selectedPersonaId }),
                            tones: JSON.stringify([]),
                            simpleIdea: result || '',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            industry: 'Tech',
                            role: selectedPersonaId,
                            qualityScore: 0,
                            qualityScoreDetails: '{}',
                            providerId: llmConfig.providerId,
                            model: llmConfig.model
                        });
                        toast.success('Prompt saved to library!');
                        setIsSaveModalOpen(false);
                    } catch (error) {
                        toast.error('Failed to save prompt.');
                    }
                }}
            />

            <div className="flex h-[calc(100vh-180px)] w-full overflow-hidden">
                <div className="w-full h-full flex flex-col relative">

                    {/* Content Grid */}
                    <div className="flex-1 overflow-hidden p-2">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full max-w-[1920px] mx-auto">

                            {/* --- LEFT: CONFIG & INPUTS --- */}
                            <div className="h-full flex flex-col gap-2 pl-1 pb-16 group/left relative overflow-hidden">

                                {/* Configuration Card */}
                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-3 shrink-0">
                                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide opacity-90">
                                        <div className="p-1 rounded-md bg-indigo-100 text-indigo-600">
                                            <Settings2 size={14} />
                                        </div>
                                        Configuration
                                    </h3>
                                    <div className="grid grid-cols-12 gap-2 items-start">
                                        <div className="col-span-12 md:col-span-4">
                                            <LLMSelector
                                                onOpenSettings={() => toast('Settings functionality placeholder')}
                                            />
                                        </div>
                                        <div className="col-span-12 md:col-span-4">
                                            <PersonaSelector
                                                activePersonaId={selectedPersonaId}
                                                setActivePersonaId={setSelectedPersonaId}
                                            />
                                        </div>
                                        <div className="col-span-12 md:col-span-4">
                                            <AnalysisFocusSelector
                                                value={analysisMode}
                                                onChange={setAnalysisMode}
                                                modes={ANALYSIS_MODES}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Input Area */}
                                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide opacity-90">
                                            <div className="p-1 rounded-md bg-amber-100 text-amber-600">
                                                <FileText size={14} />
                                            </div>
                                            Input Source
                                        </h3>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleEnhanceInput}
                                                disabled={isEnhancingInput || !inputText.trim()}
                                                className="gap-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-bold"
                                                leftIcon={isEnhancingInput ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                            >
                                                AI Enhance
                                            </Button>
                                            <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="gap-2"
                                            >
                                                <Paperclip size={16} /> Attach
                                            </Button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                onChange={handleFileUpload}
                                                multiple
                                                accept="image/*,.txt,.md,.js,.ts,.tsx,.py"
                                            />
                                        </div>
                                    </div>

                                    {/* File Previews */}
                                    {files.length > 0 && (
                                        <div className="flex gap-3 mb-2 overflow-x-auto pb-2">
                                            {files.map(f => (
                                                <div key={f.id} className="relative group shrink-0">
                                                    {f.type.startsWith('image/') ? (
                                                        <img src={f.preview} alt={f.name} className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                                                    ) : (
                                                        <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
                                                            <FileText size={24} className="text-slate-400" />
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveFile(f.id)}
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <textarea
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Paste code, requirements, or enter a description needed for reverse engineering..."
                                        className="flex-1 w-full p-3 bg-slate-50 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono text-sm leading-relaxed"
                                    />
                                </div>
                            </div>

                            {/* --- RIGHT: OUTPUT RESULTS --- */}
                            <div className="h-full overflow-y-auto [&::-webkit-scrollbar]:hidden pl-1 pb-16">
                                {result ? (
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col group animate-in slide-in-from-right-4 duration-500">
                                        <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
                                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide opacity-90">
                                                <div className="p-1 rounded-md bg-emerald-100 text-emerald-600">
                                                    <Eye size={14} />
                                                </div>
                                                Observation Result
                                            </h3>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => {
                                                    navigator.clipboard.writeText(result);
                                                    toast.success('Copied to clipboard');
                                                }}>
                                                    <Copy size={16} />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => setIsSaveModalOpen(true)}>
                                                    <Save size={16} />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex-1 p-6 overflow-auto custom-scrollbar bg-slate-50/30">
                                            <pre className="whitespace-pre-wrap font-mono text-sm leading-7 text-slate-700">{result}</pre>
                                        </div>
                                    </div>
                                ) : (
                                    <Card className="h-full flex flex-col items-center justify-center border-dashed bg-slate-50/30 hover:bg-slate-50/50 transition-colors group cursor-default">
                                        <div className="flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                            <Wand2 className="w-16 h-16 mb-4 opacity-20 group-hover:opacity-30 transition-opacity text-orange-500" />
                                            <p className="font-bold text-slate-500 text-lg">Ready to Deconstruct</p>
                                            <p className="text-sm opacity-70 mt-2 max-w-[240px]">
                                                Input your data on the left and click Deconstruct to reveal the hidden engineering.
                                            </p>
                                        </div>
                                    </Card>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Floating Action Dock */}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-50">
                        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 text-white p-2 rounded-2xl shadow-2xl flex items-center justify-between gap-4 ring-1 ring-white/20">

                            {/* Status Info */}
                            <div className="flex items-center gap-4 px-4 text-xs font-medium text-slate-200">
                                {isProcessingFile && <span className="flex items-center gap-2 text-emerald-400"><Loader2 size={12} className="animate-spin" /> Processing Files...</span>}
                                {!isProcessingFile && <span className="opacity-60">{files.length} files attached</span>}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => {
                                        setResult(null);
                                        setInputText('');
                                        setFiles([]);
                                        toast.success('Cleared');
                                    }}
                                    variant="ghost"
                                    className="h-9 px-4 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl text-xs"
                                >
                                    Clear All
                                </Button>
                                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                                <Button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || isProcessingFile || (!inputText && files.length === 0)}
                                    className="h-10 px-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 border-none transition-all"
                                >
                                    {isAnalyzing ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin" /> Analyzing...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Deconstruct <ArrowRight size={16} />
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </PageTemplate>
    );
};
