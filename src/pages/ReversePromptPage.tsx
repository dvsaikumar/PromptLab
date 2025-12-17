import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Paperclip, Loader2, Save, Copy, FileText, X, Eye, ChevronRight, Wand2, Microscope, Globe, BookOpen, ArrowRight, Layout, Code, ScanEye } from 'lucide-react';
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
import { Tooltip } from '@/components/ui/Tooltip';
import { estimateTokens } from '@/utils/tokenEstimator';
import { PERSONAS } from '@/constants/personas';
import { Card } from '@/components/ui/Card';
import { useRealtimeAssist } from '@/hooks/useRealtimeAssist';
import { RealtimeSuggestions } from '@/components/ui/RealtimeSuggestions';
import {
    ANALYSIS_MODES,
    FOCUS_TEMPLATES,
    GOD_MODE_INSTRUCTION,
    CURSOR_AGENT_PROTOCOL,
    SONNET_DESIGN_PROTOCOL,
    TECHNOLOGIES_DEFAULT
} from '@/constants/reverse-prompt';

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

const TUTORIAL_MODULES = [
    {
        id: 'concept',
        title: 'The Reverse Engineering Paradigm',
        icon: Microscope,
        content: (
            <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-2xl border border-orange-100">
                    <h2 className="text-2xl font-bold text-orange-900 mb-4">From "Product" to "Blueprint"</h2>
                    <p className="text-lg text-slate-700 leading-relaxed mb-6">
                        Most AI tools generate content. This tool <b>deconstructs</b> it.
                        Whether it's a website screenshot, a snippet of code, or a marketing email, Reverse Engineering extracts the hidden <i>intent, structure, and style</i> so you can recreate or modify it.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6 mt-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 mb-4 text-slate-500 uppercase tracking-widest font-bold text-xs">
                                <FileText size={16} /> Input (The "What")
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">The Raw Material</h3>
                            <p className="text-slate-600 text-sm mb-4">You provide the finished result.</p>
                            <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg text-xs font-mono text-slate-600">
                                <ScanEye className="text-slate-400" size={16} /> Screenshot or Text
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-200 ring-1 ring-orange-100">
                            <div className="flex items-center gap-3 mb-4 text-orange-600 uppercase tracking-widest font-bold text-xs">
                                <FileText size={16} /> Output (The "How")
                            </div>
                            <h3 className="text-xl font-bold text-orange-900 mb-2">The "Bible" Prompt</h3>
                            <p className="text-orange-700 text-sm mb-4">We generate the master instructions.</p>
                            <div className="flex items-center gap-2 p-3 bg-orange-50 text-orange-800 rounded-lg text-xs font-mono">
                                <Sparkles className="text-orange-500" size={16} /> "Act as X... Create Y..."
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'modes',
        title: 'Analysis Modes',
        icon: Layout,
        content: (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-5 bg-purple-50 rounded-xl border border-purple-100">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
                            <Sparkles size={20} />
                        </div>
                        <h4 className="font-bold text-purple-900 mb-2">God Mode</h4>
                        <p className="text-sm text-purple-800">The "Bible" creator. Extracts EVERYTHING: tone, structure, content strategy, and user persona.</p>
                    </div>
                    <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                            <Code size={20} />
                        </div>
                        <h4 className="font-bold text-blue-900 mb-2">Code Analysis</h4>
                        <p className="text-sm text-blue-800">For developers. Extracts design patterns, tech stack, and logic flow from code snippets.</p>
                    </div>
                    <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-4">
                            <Layout size={20} />
                        </div>
                        <h4 className="font-bold text-emerald-900 mb-2">Design Specs</h4>
                        <p className="text-sm text-emerald-800">For UI/UX. Extracts spacing, color palettes, typography, and component hierarchy.</p>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                    <strong className="text-slate-800">Pro Tip:</strong> Use "God Mode" for general purposes. It creates a comprehensive context file you can give to any other AI.
                </div>
            </div>
        )
    },
    {
        id: 'vision',
        title: 'Vision & OCR',
        icon: ScanEye,
        content: (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600 shrink-0">
                        <ScanEye size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Seeing is Engineering</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Don't write descriptions of websites. <b>Show them.</b><br />
                            Upload a screenshot of a dashboard, a landing page, or a mobile app. Our Vision AI scans the pixels to understand the layout, while OCR (Optical Character Recognition) extracts the text.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="font-bold text-slate-700">1. Upload Image</div>
                        <div className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="font-bold text-slate-700">2. AI Scans It</div>
                        <div className="text-xs text-slate-400 mt-1">Vision + OCR</div>
                    </div>
                </div>
            </div>
        )
    }
];

export const ReversePrompt: React.FC<ReversePromptProps> = ({ isSidebarOpen = false }) => {
    const { llmConfig } = usePrompt();
    const [activeTab, setActiveTab] = useState<'tool' | 'tutorial'>('tool');
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
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [url, setUrl] = useState('');
    const [isFetchingUrl, setIsFetchingUrl] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Track the last auto-generated text to allow safe overwrites
    const lastAutoTemplateRef = useRef<string>('');

    // Realtime Assist
    const {
        suggestions: realtimeSuggestions,
        isLoading: isRealtimeLoading,
        clearSuggestions
    } = useRealtimeAssist(inputText, {
        fieldLabel: 'Analysis Context',
        context: 'User is inputting content to reverse engineer.',
        minChars: 15
    });

    const handleApplyRealtime = (text: string) => {
        setInputText(prev => prev + (prev.endsWith(' ') ? '' : ' ') + text);
        clearSuggestions();
    };

    // Token Calculation Memo
    const tokenStats = React.useMemo(() => {
        // 1. System Prompt Estimation
        let systemPrompt = '';
        switch (analysisMode) {
            case 'god-mode': systemPrompt = GOD_MODE_INSTRUCTION + `\n\nTARGET TECH STACK: ${techStack}`; break;
            case 'design': systemPrompt = SONNET_DESIGN_PROTOCOL; break;
            case 'code': systemPrompt = CURSOR_AGENT_PROTOCOL; break;
            default:
                const persona = PERSONAS.find(p => p.id === selectedPersonaId);
                systemPrompt = `You are a ${persona?.role || 'Expert System'}. ${persona?.prompt || ''}`;
        }
        const sysCount = estimateTokens(systemPrompt, llmConfig.model);

        // 2. User Input + Context
        const userCount = estimateTokens(inputText, llmConfig.model);
        const ocrCount = ocrContent ? estimateTokens(ocrContent, llmConfig.model) : 0;
        const totalInput = sysCount + userCount + ocrCount;

        // 3. Output
        const outputCount = result ? estimateTokens(result, llmConfig.model) : 0;

        return {
            system: sysCount,
            user: userCount,
            ocr: ocrCount,
            totalInput,
            totalOutput: outputCount
        };
    }, [analysisMode, selectedPersonaId, techStack, inputText, ocrContent, result, llmConfig.model]);

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

    const handleUrlFetch = async () => {
        if (!url) return;
        setIsFetchingUrl(true);
        const toastId = toast.loading('Fetching website content...');

        try {
            let htmlContent = '';

            // Strategy 1: Try corsproxy.io (Direct HTML)
            try {
                const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
                if (response.ok) {
                    htmlContent = await response.text();
                } else {
                    throw new Error('Proxy 1 failed');
                }
            } catch (e1) {
                console.warn('Primary proxy failed, trying backup...', e1);
                // Strategy 2: Try allorigins.win (JSON wrapped)
                const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
                const data = await response.json();
                if (data.contents) {
                    htmlContent = data.contents;
                } else {
                    throw new Error('No content returned from backup proxy');
                }
            }

            if (htmlContent) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlContent, 'text/html');

                // 1. Extract Metadata (Critical for Context)
                const title = doc.title;
                const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
                const keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
                const author = doc.querySelector('meta[name="author"]')?.getAttribute('content') || '';

                // 2. Extract Information Architecture (Navigation)
                const navItems: string[] = [];
                doc.querySelectorAll('nav a, header a').forEach(a => {
                    const text = a.textContent?.trim();
                    if (text && text.length < 30) navItems.push(text);
                });
                const uniqueNav = [...new Set(navItems)].slice(0, 15).join(' | ');

                // 3. Clean DOM for Main Content Extraction
                const scripts = doc.querySelectorAll('script, style, noscript, iframe, svg, footer, form');
                scripts.forEach(script => script.remove());

                // 4. Structured Content Extraction
                let structuredContent = '';

                // Headers are good anchors
                doc.querySelectorAll('h1, h2, h3, p, li').forEach(el => {
                    const tag = el.tagName.toLowerCase();
                    const text = el.textContent?.replace(/\s+/g, ' ').trim();
                    if (!text || text.length < 5) return;

                    if (tag === 'h1') structuredContent += `\n# ${text}\n`;
                    else if (tag === 'h2') structuredContent += `\n## ${text}\n`;
                    else if (tag === 'h3') structuredContent += `\n### ${text}\n`;
                    else if (tag === 'li') structuredContent += `- ${text}\n`;
                    else structuredContent += `${text}\n\n`;
                });

                // Fail-safe if structured extraction is too empty
                if (structuredContent.length < 100) {
                    structuredContent = doc.body.textContent?.replace(/\s+/g, ' ').trim() || '';
                }

                const limit = 25000; // Increased limit for God Mode
                const truncatedContent = structuredContent.length > limit ? structuredContent.substring(0, limit) + "...(truncated)" : structuredContent;

                // 5. Construct God Mode "Bible" Input
                const bibleContext = `
=================================================================
GOD MODE SOURCE MATERIAL: WEBSITE REVERSE ENGINEERING
=================================================================
URL: ${url}
TITLE: ${title}
METADATA: ${description} ${keywords ? `[Keywords: ${keywords}]` : ''}
AUTHOR/ORG: ${author}
INFORMATION ARCHITECTURE: ${uniqueNav}

=== STRUCTURAL & CONTENT ANALYSIS ===
${truncatedContent}
=================================================================
INSTRUCTION: Reverse engineer this content into a comprehensive technical and creative "Bible".
`;

                setInputText(prev => (prev ? prev + '\n\n' : '') + bibleContext.trim());

                // Auto-switch to God Mode
                setAnalysisMode('god-mode');

                toast.success('Website extracted in God Mode Standard!', { id: toastId });
                setShowUrlInput(false);
                setUrl('');
            } else {
                throw new Error("No content returned");
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to fetch. Site may block proxies.', { id: toastId });
        } finally {
            setIsFetchingUrl(false);
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

            const GOLDEN_RULES = `
***GOLDEN RULES OF PROMPTING (MUST FOLLOW)***
1. **Tone**: Use a friendly, clear, and firm tone for better results.
2. **Action-Oriented**: State requests as clear commands with necessary details.
3. **Use Templates**: "Fill-in-the-box" structures produce more creative results than empty fields.
4. **Plan First**: For complex tasks, generate an outline or rough version first.
5. **Structured Output**: Demand specific formats (JSON, Markdown, Lists) beyond simple prose.
6. **Explain Why**: Provide the "why" behind instructions to clarify intent.
7. **Control Verbosity**: Explicitly define if the output should be verbose or concise.
8. **Guide with Examples**: Provide templates or examples to guide structure and style.
9. **Advanced Terminology**: Use precise prompting terms to trigger sophisticated behaviors.
10. **Modular Synthesis**: For complex contexts, handle parts separately and then synthesize.
`;

            // Mode-Specific Prompt Construction
            switch (analysisMode) {
                case 'god-mode':
                    systemPrompt = GOD_MODE_INSTRUCTION + `\n\nTARGET TECH STACK: ${techStack}`;
                    break;
                case 'design':
                    systemPrompt = SONNET_DESIGN_PROTOCOL;
                    break;
                case 'code':
                    systemPrompt = CURSOR_AGENT_PROTOCOL;
                    break;
                default:
                    const persona = PERSONAS.find(p => p.id === selectedPersonaId);
                    systemPrompt = `You are a ${persona?.role || 'Expert System'}. ${persona?.prompt || ''}`;
            }

            // Append Golden Rules to ALL modes
            systemPrompt += `\n\n${GOLDEN_RULES}`;

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

    const InteractiveTutorial = () => {
        const [activeStep, setActiveStep] = useState(0);

        return (
            <div className="flex w-full h-full bg-slate-50">
                {/* Sidebar Navigation */}
                <div className="w-72 bg-white border-r border-slate-200 overflow-y-auto flex flex-col">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <BookOpen size={20} className="text-orange-600" />
                            Reverse Engineering
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Master the art of deconstruction.</p>
                    </div>
                    <div className="p-4 space-y-2 flex-1">
                        {TUTORIAL_MODULES.map((module, index) => {
                            const Icon = module.icon;
                            const isActive = activeStep === index;
                            return (
                                <button
                                    key={module.id}
                                    onClick={() => setActiveStep(index)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${isActive ? 'bg-orange-50 text-orange-700 font-semibold ring-1 ring-orange-200 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                >
                                    <div className={`p-2 rounded-md ${isActive ? 'bg-white shadow-sm ring-1 ring-orange-100' : 'bg-slate-100'}`}>
                                        <Icon size={16} />
                                    </div>
                                    <span className="text-sm">{module.title}</span>
                                    {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
                                </button>
                            );
                        })}
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
                                    <span>Quick Guide</span>
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
                                    className="bg-orange-600 hover:bg-orange-700 text-white ml-auto"
                                    onClick={() => setActiveStep(prev => prev + 1)}
                                    rightIcon={<ArrowRight size={16} />}
                                >
                                    Next: {TUTORIAL_MODULES[activeStep + 1].title}
                                </Button>
                            ) : (
                                <Button
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white ml-auto"
                                    onClick={() => setActiveTab('tool')}
                                    rightIcon={<Microscope size={16} />}
                                >
                                    Start Deconstructing
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
            title="Reverse Engineering Lab"
            subtitle="Deconstruct apps, code, and designs"
            icon={Microscope}
            iconGradient="from-orange-500 to-amber-600"
            isSidebarOpen={isSidebarOpen}
            className="flex flex-col !p-0 bg-slate-50/50"
            headerClassName="!px-4 bg-slate-50 z-50"
            iconSize={20}
            titleClassName="text-lg"
            subtitleClassName="text-xs"
            rightContent={
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('tool')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${activeTab === 'tool' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Microscope size={16} /> Tool
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
                            model: llmConfig.model,
                            source: 'reverse'
                        });
                        toast.success('Prompt saved to library!');
                        setIsSaveModalOpen(false);
                    } catch (error) {
                        toast.error('Failed to save prompt.');
                    }
                }}
            />

            {activeTab === 'tool' ? (
                <div className="flex h-full w-full overflow-hidden">
                    <div className="w-full h-full flex flex-col relative">

                        {/* Content Grid */}
                        <div className="flex-1 overflow-hidden p-2">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full max-w-[1920px] mx-auto">

                                {/* --- LEFT: CONFIG & INPUTS --- */}
                                <div className="h-full flex flex-col gap-2 pl-1 pb-16 group/left relative overflow-hidden">

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
                                                    onClick={() => setShowUrlInput(!showUrlInput)}
                                                    className={`gap-2 ${showUrlInput ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
                                                >
                                                    <Globe size={16} />
                                                    <span className="hidden xl:inline">Website</span>
                                                </Button>
                                                <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>
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
                                                    data-testid="file-upload"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    onChange={handleFileUpload}
                                                    multiple
                                                    accept="image/*,.txt,.md,.js,.ts,.tsx,.py"
                                                />
                                            </div>
                                        </div>

                                        {showUrlInput && (
                                            <div className="mb-3 p-2 bg-indigo-50 rounded-lg flex gap-2 animate-in slide-in-from-top-2">
                                                <input
                                                    type="url"
                                                    placeholder="https://example.com"
                                                    className="flex-1 px-3 py-1.5 rounded-md border border-indigo-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    value={url}
                                                    onChange={(e) => setUrl(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleUrlFetch()}
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={handleUrlFetch}
                                                    disabled={isFetchingUrl || !url}
                                                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                                                >
                                                    {isFetchingUrl ? <Loader2 size={14} className="animate-spin" /> : 'Fetch'}
                                                </Button>
                                            </div>
                                        )}

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

                                        <RealtimeSuggestions
                                            suggestions={realtimeSuggestions}
                                            isLoading={isRealtimeLoading}
                                            onApply={handleApplyRealtime}
                                            onDismiss={clearSuggestions}
                                            className="bottom-4 left-4 right-4 w-auto max-w-none"
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
                        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-50">
                            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 text-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 ring-1 ring-white/20">

                                {/* Left: Configuration & Stats */}
                                <div className="w-full md:flex-1 min-w-0 flex items-center gap-3 overflow-x-auto no-scrollbar mask-gradient-r pr-4">
                                    {/* LLM Selector */}
                                    <div className="w-48 shrink-0">
                                        <LLMSelector
                                            onOpenSettings={() => toast('Settings functionality placeholder')}
                                            compact={true}
                                        />
                                    </div>

                                    <div className="w-px h-8 bg-white/10 shrink-0 hidden md:block" />

                                    {/* Persona Selector */}
                                    <div className="w-48 shrink-0">
                                        <PersonaSelector
                                            activePersonaId={selectedPersonaId}
                                            setActivePersonaId={setSelectedPersonaId}
                                            compact={true}
                                        />
                                    </div>

                                    <div className="w-px h-8 bg-white/10 shrink-0 hidden md:block" />

                                    {/* Focus Selector */}
                                    <div className="w-48 shrink-0">
                                        <AnalysisFocusSelector
                                            value={analysisMode}
                                            onChange={setAnalysisMode}
                                            modes={ANALYSIS_MODES}
                                            compact={true}
                                        />
                                    </div>
                                </div>

                                {/* Fixed Token Stats & Action */}
                                <div className="w-full md:w-auto flex items-center justify-between gap-3 shrink-0">
                                    <div className="w-px h-8 bg-white/10 shrink-0 hidden md:block" />

                                    <Tooltip
                                        title="Detailed Token Analysis"
                                        content={
                                            <div className="flex gap-6 min-w-[240px] p-1">
                                                <div className="flex flex-col gap-2 flex-1">
                                                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Input</span>
                                                        <span className="text-sm font-bold text-emerald-600 tabular-nums">{tokenStats.totalInput}</span>
                                                    </div>
                                                </div>
                                                <div className="w-px bg-slate-100"></div>
                                                <div className="flex flex-col gap-2 flex-1">
                                                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Output</span>
                                                        <span className="text-sm font-bold text-rose-600 tabular-nums">{tokenStats.totalOutput}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                        position="top"
                                    >
                                        <div className="flex flex-col bg-slate-950/30 rounded-lg border border-white/10 overflow-hidden shrink-0 justify-center min-w-[80px] cursor-pointer hover:bg-slate-900/50 transition-colors">
                                            <div className="bg-white/5 px-2 py-0.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap hidden sm:block">
                                                Tokens
                                            </div>
                                            <div className="flex divide-x divide-slate-700/50">
                                                <div className="px-2 py-0.5 flex items-center justify-center gap-1.5 flex-1">
                                                    <span className="text-[10px] font-bold text-emerald-200 tabular-nums">
                                                        {tokenStats?.totalInput || 0}
                                                    </span>
                                                </div>
                                                <div className="px-2 py-0.5 flex items-center justify-center gap-1.5 bg-rose-500/10 flex-1">
                                                    <span className="text-[10px] font-bold text-rose-200 tabular-nums">
                                                        {tokenStats?.totalOutput > 0 ? tokenStats.totalOutput : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Tooltip>

                                    <div className="w-px h-4 bg-slate-700 mx-1 hidden md:block"></div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => {
                                                setResult(null);
                                                setInputText('');
                                                setFiles([]);
                                                toast.success('Cleared');
                                            }}
                                            variant="ghost"
                                            className="h-9 w-9 p-0 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"
                                            title="Clear All"
                                        >
                                            <X size={16} />
                                        </Button>

                                        <Button
                                            onClick={handleAnalyze}
                                            disabled={isAnalyzing || isProcessingFile || (!inputText && files.length === 0)}
                                            className="h-10 px-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 border-none transition-all whitespace-nowrap"
                                        >
                                            {isAnalyzing ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin mr-2" /> Deconstructing...
                                                </>
                                            ) : (
                                                <>
                                                    <Microscope size={16} className="mr-2" /> Deconstruct
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            ) : (
                <InteractiveTutorial />
            )}
        </PageTemplate>
    );
};
