import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, Loader2, Copy, X, Image as ImageIcon, Send, Paperclip, FileText, Save } from 'lucide-react';
import { PageTemplate } from '@/components/ui/PageTemplate';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from '@/components/ui/SectionHeader';
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
    GEMINI_VIBE_CODER_PROTOCOL,
    SONNET_DESIGN_PROTOCOL,
    V0_DESIGN_PROTOCOL,
    TECHNOLOGIES_DEFAULT
} from '@/constants/reverse-prompt';
import { AnalysisLoader } from '@/components/reverse-prompt/AnalysisLoader';

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
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string>('prompt-engineer');
    const [analysisMode, setAnalysisMode] = useState<string>('general');
    const [techStack, setTechStack] = useState<string>(TECHNOLOGIES_DEFAULT);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [ocrContent, setOcrContent] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Track the last auto-generated text to allow safe overwrites
    const lastAutoTemplateRef = useRef<string>('');

    // Auto-fill template dynamically based on Mode AND Persona
    useEffect(() => {
        const baseTemplate = FOCUS_TEMPLATES[analysisMode];
        if (!baseTemplate) return;

        const persona = PERSONAS.find(p => p.id === selectedPersonaId) || PERSONAS[0];

        // Construct Dynamic Template: "As a [Role], [instruction lowercased]"
        // e.g., "As a Senior Engineer, analyze this code..."
        const newTemplate = `As a ${persona.role}, ${baseTemplate.charAt(0).toLowerCase() + baseTemplate.slice(1)}`;

        const currentText = inputText.trim();

        // Smart Overwrite Logic:
        // Only update if input is empty OR if the current text identifies identical to what we auto-generated last time.
        // This ensures we never overwrite user's custom edits.
        if (!currentText || currentText === lastAutoTemplateRef.current) {
            setInputText(newTemplate);
            lastAutoTemplateRef.current = newTemplate;
        }
    }, [analysisMode, selectedPersonaId]);

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
                        // Store OCR invisibly for fallback, don't clutter UI
                        setOcrContent(prev => prev + (prev ? '\n\n' : '') + `[Context from ${file.name}]:\n${text}`);
                        toast.success(`Extracted text from ${file.name}`, { id: 'ocr-success-' + i });
                    }
                } catch (ocrError) {
                    console.warn(`OCR Failed for ${file.name}`, ocrError);
                    // Continue without text - Vision LLM can still see it
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
            // Auto-switch to design mode if images uploaded
            if (newFiles.length > 0) setAnalysisMode('design');

            toast.success(`Processed ${newFiles.length} file(s)!`, { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Failed to process files.', { id: toastId });
        } finally {
            setIsProcessingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };


    const handleAnalyze = async () => {
        if (!inputText.trim() && files.length === 0) return;
        if (!llmConfig.apiKey) {
            toast.error('Please configure your LLM settings first.');
            window.dispatchEvent(new Event('open-settings-modal'));
            return;
        }

        setIsAnalyzing(true);
        setResult(null);

        try {
            const hasImages = files.length > 0;
            const activePersona = PERSONAS.find(p => p.id === selectedPersonaId) || PERSONAS[0];

            let systemPrompt = `${activePersona.prompt}\n${GOD_MODE_INSTRUCTION}`;
            let prompt = '';

            // Mode Switching Logic
            switch (analysisMode) {
                // =========================================================
                // 1. DESIGN MODE (THE VISUAL BIBLE)
                // =========================================================
                case 'design':
                    if (hasImages) {
                        systemPrompt += `\n${SONNET_DESIGN_PROTOCOL}\n${V0_DESIGN_PROTOCOL}`;
                        prompt = `Execute a "Visual Compiler Trace" on this UI screenshot. Treat the image as a compiled render that must be de-compiled back into source code.

<VISUAL_DECOMPILATION_STEPS>
1.  **Global Design DNA Extraction (EVIDENCE BASED)**:
    *   **Chromatics**: Identify the HEX codes for Background, Surface, Primary, and Text.
    *   **Typography**: Accurately determine Font Family (Serif/Sans), Weights, and Relative Scales.
    *   **Geometry**: Measure Border Radius and Spacing chains.

2.  **Layout Topology (The Skeleton)**:
    *   **Macro-Structure**: Is it a Shell Layout? Holy Grail? Dashboard Grid?
    *   **Grid/Flex Logic**: Explicit CSS identification (e.g., "flex-row justify-between").
    *   **Responsiveness**: Infer breakpoints based on component crowding.

3.  **Atomic Component Inventory**:
    *   **Visible Components Only**: List Buttons, Inputs, Cards.
    *   **Interactive State Inference**: Identify "Active" states or "Hover" affordances ONLY if visually distinct.

4.  **Anti-Hallucination Check**:
    *   Verify: Do not hallucinate hover states for components that are static.
    *   Verify: Do not invent data fields that are cut off.
</VISUAL_DECOMPILATION_STEPS>

<OUTPUT_COMMANDMENT>
Generate the **"Creation Bible"** - a single, comprehensive prompt for a Senior AI Engineer.
Target Stack: **${techStack}** (Default to React + Tailwind + Lucide if unspecified).

Structure the Output as follows:

# 🏗️ Master Implementation Protocol (Verified)
**Role**: Senior Frontend Architect specialized in ${techStack}.
**Task**: Build a Pixel-Perfect Derivative of the analyzed UI.
**Style**: v0.dev / Shadcn UI Standard.
**Vibe**: Premium, "Wow Factor" (Sonnet 4.5 Standard).

## 1. Design Tokens (Observed)
[List exact Colors, Fonts, Shadows, and Spacing variables]

## 2. Component Hierarchy (Mapped)
*   **AppShell**: [Layout Strategy]
*   **[Component Name]**: [Visual Specs] -> [Child Components]

## 3. Implementation Code Standards
*   Use **${techStack}**.
*   **Strict Constraint**: Do not use arbitrary values. Use the Design Tokens defined above.
*   **Mock Data**: Generate realistic data matching the *exact types* seen in the image.

## 4. Refinement Instructions
"Ensure the final output matches the screenshot's 'Air Density' (whitespace) and 'Visual Weight' (contrast) perfectly."
</OUTPUT_COMMANDMENT>`;
                    } else {
                        systemPrompt += `\n${SONNET_DESIGN_PROTOCOL}`;
                        prompt = `Analyze this Description: "${inputText}".
Generate a **Midjourney / DALL-E 3 "Bible Prompt"**.
Deconstruct the request into:
1. **Subject**: The core subject matter.
2. **Medium**: Photography, 3D Render, Oil Painting, Vector Illustration.
3. **Style**: Cyberpunk, Minimalist, Baroque, Synthwave.
4. **Lighting**: Volumetric, Rembrant, Golden Hour, Neon.
5. **Color**: Palette and Saturation.
6. **Composition**: Camera Angle, Aspect Ratio, Depth of Field.`;
                    }
                    break;

                // =========================================================
                // 2. CODE MODE (THE ARCHITECTURAL BIBLE)
                // =========================================================
                case 'code':
                    systemPrompt += `\n${CURSOR_AGENT_PROTOCOL}\n${GEMINI_VIBE_CODER_PROTOCOL}`;
                    prompt = `Perform a **Deep Analysis** on this Code Snippet / Architecture.

<INPUT_CODE>
${inputText}
</INPUT_CODE>

<ARCHITECTURAL_DECONSTRUCTION>
1.  **Fact-Based Pattern Recognition**: Identify patterns ONLY if code evidence exists.
2.  **Complexity Audit**: Estimate Cyclomatic Complexity and Big-O Time/Space notation.
3.  **Safety & Security**: Check for sanitization gaps, memory leaks, or race conditions.
4.  **Tech Stack Fingerprint**: Identify specific libraries and version paradigms used.
5.  **Hidden Dependency Scan**: Infer likely external services (e.g., "AWS SDK" implies Cloud usage).
</ARCHITECTURAL_DECONSTRUCTION>

<OUTPUT_COMMANDMENT>
Generate a "Optimization Master-Prompt" structured as a **.cursorrules** file or System Prompt.
**Target Audience**: Cursor AI Agent / Gemini Vibe Coder.
**Constraint**: Use ${techStack || 'Detected Stack'}.
**Requirements**:
1. Reduce Time Complexity to [Target].
2. Implement [Pattern] for better decoupled logic.
3. Add copious JSDoc/TSDoc comments explaining 'Why'.
4. Ensure 100% Type Safety (No 'any').
5. Strictly follow React 18+ / ESM standards.
</OUTPUT_COMMANDMENT>`;
                    break;

                // =========================================================
                // 3. PRODUCT MODE (THE SPECS BIBLE)
                // =========================================================
                case 'product':
                    prompt = `Analyze this Request / Input as a **Chief Product Officer**.

<INPUT_CONTEXT>
${inputText}
</INPUT_CONTEXT>

<PRODUCT_DEEP_DIVE>
1.  **User Psychology**: What is the user's *deepest* motivation? (Jobs-to-be-Done).
2.  **Market Fit**: How does this differentiate from standard solutions?
3.  **Specification**: Define the "Happy Path", "Edge Cases", and "Error States".
4.  **Success Metrics**: Define concrete KPIs (e.g., "Reduce Time-to-Interact by 200ms").
</PRODUCT_DEEP_DIVE>

<OUTPUT_COMMANDMENT>
Generate a **PRD (Product Requirements Document) Generation Prompt**.
Structure:
"Act as a **Lead Product Owner**.
Write a comprehensive PRD for [Feature].
**Sections**:
1. **Problem Statement**: The 'Why' (Data-backed).
2. **User Stories**: Gherkin Syntax (Given/When/Then) for ALL scenarios.
3. **Acceptance Criteria**: Pass/Fail binary conditions.
4. **UI/UX Guidance**: Layout wireframe descriptions with Micro-Interaction specs."
</OUTPUT_COMMANDMENT>`;
                    break;

                // =========================================================
                // 4. SECURITY MODE (THE FORENSIC BIBLE)
                // =========================================================
                case 'security':
                    prompt = `Conduct a **Forensic Code Audit** (Simulate NSA/Nation-State level scrutiny).

<TARGET_CONTENT>
${inputText}
</TARGET_CONTENT>

<FORENSIC_ANALYSIS>
1.  **Attack Surface Mapping**: Identify all entry points (API headers, user inputs, query params).
2.  **Vulnerability Scanner**: Check for OWASP Top 10 (Injection, Broken Auth, XSS, Deserialization).
3.  **Logic Flaws**: Look for business logic bypasses that automated tools miss.
4.  **Supply Chain Audit**: Analyze import paths for known vulnerable dependencies.
</FORENSIC_ANALYSIS>

<OUTPUT_COMMANDMENT>
Generate two prompts:
1.  **Red Team**: "Generate a Python exploit script to verify [Vulnerability]."
2.  **Blue Team**: "Generate a Patch + Unit Test that explicitly prevents [Vulnerability]."
Target Context: ${techStack}.
</OUTPUT_COMMANDMENT>`;
                    break;

                // =========================================================
                // 5. BUG MODE (THE DEBUGGER BIBLE)
                // =========================================================
                case 'bug':
                    prompt = `Analyze this Bug Report / Error Log as a **Distinguished Engineer**.

<INPUT_ERROR>
${inputText}
</INPUT_ERROR>

<DEBUG_PROTOCOL>
1.  **Stack Trace Anatomy**: Deconstruct the error path frame-by-frame.
2.  **State Reconstruction**: Infer the exact state of variables at the crash point.
3.  **Root Cause Analysis**: Apply the "5 Whys" technique to find the *origin*, not just the symptom.
</DEBUG_PROTOCOL>

<OUTPUT_COMMANDMENT>
Generate a "Fix & Prevention Protocol".
1.  **Reproduction Script**: Minimal code to trigger the error.
2.  **The Fix**: Corrected code using ${techStack || 'Detected Stack'}.
3.  **Regression Test**: A test case to ensure it never happens again.
</OUTPUT_COMMANDMENT>`;
                    break;

                // =========================================================
                // 6. GENERIC / DEFAULT (THE CO-STAR BIBLE)
                // =========================================================
                default:
                    prompt = `Deconstruct this content to find its "Source Code" (The Prompt that created it).

<CONTENT>
${inputText}
</CONTENT>

<REVERSE_ENGINEERING_PROTOCOL>
1.  **Tone DNA**: Analyze the exact lexical density, sentence variance, and emotional temperature.
2.  **Structural Blueprint**: Headers, Lists, Spacing, Bold usage.
3.  **Intent Decoding**: What was the *exact* instruction given to the AI?
4.  **Micro-Tone Analysis**: Identifying subtle bias or framing.
</REVERSE_ENGINEERING_PROTOCOL>

<OUTPUT_COMMANDMENT>
Construct the "System Prompt" using the **CO-STAR Bible Format**:
**C**ontext (The World)
**O**bjective (The Mission)
**S**tyle (The Voice)
**T**one (The Vibe)
**A**udience (The Reader)
**R**esponse (The Format)
</OUTPUT_COMMANDMENT>`;
                    break;
            }

            const service = LLMService.getInstance();
            const provider = service.getProvider(llmConfig.providerId);
            const imagePayload = files.length > 0 ? files.map(f => f.base64) : undefined;

            let response;
            try {
                // Attempt 1: Try with Images (Vision)
                response = await provider.generateCompletion({
                    config: llmConfig,
                    systemPrompt: systemPrompt,
                    userPrompt: prompt,
                    temperature: 0.7,
                    images: imagePayload
                });
            } catch (err: any) {
                // Fallback: If 400/Invalid Parameter, the model likely doesn't support Vision.
                // Retry with JUST text (which includes the OCR'd content)
                if (imagePayload && (err.message.includes('400') || err.message.includes('Invalid') || err.message.includes('parameter'))) {
                    console.warn("Vision capabilities rejected by model. Falling back to text-only analysis.");
                    toast('Model lacks Vision support. Using extracted text instead...', { icon: '🔄' });

                    const fallbackPrompt = prompt + (ocrContent ? `\n\n=== EXTRACTED IMAGE TEXT (OCR) ===\n${ocrContent}` : '');

                    response = await provider.generateCompletion({
                        config: llmConfig,
                        systemPrompt: systemPrompt,
                        userPrompt: fallbackPrompt,
                        temperature: 0.7,
                        images: undefined // Remove images to force text-only mode
                    });
                } else {
                    throw err;
                }
            }

            if (!response || !response.trim()) {
                console.warn("Empty response received via", llmConfig.providerId);
                throw new Error("AI returned empty response. The model may have refused the request or timed out silently.");
            }

            setResult(response);
            toast.success(`Analysis complete! (${response.length} chars)`);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to analyze content.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = () => {
        if (!result) return;
        setIsSaveModalOpen(true);
    };

    const handleSaveWithTitle = async (title: string) => {
        if (!result) return;

        try {
            await promptDB.savePrompt({
                title,
                framework: `reverse - ${analysisMode} `,
                prompt: result,
                simpleIdea: inputText || 'Uploaded Content',
                fields: JSON.stringify({
                    analysisMode,
                    hasFiles: files.length > 0,
                    fileNames: files.map(f => f.name)
                }),
                tones: JSON.stringify([]),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                providerId: llmConfig?.providerId || 'unknown',
                model: llmConfig?.model || 'unknown'
            });
            toast.success(`Saved "${title}"!`);
            setIsSaveModalOpen(false);
        } catch (error: any) {
            toast.error('Failed to save prompt.');
            console.error(error);
        }
    };

    // Dynamic Loading Component
    const AnalysisLoader = () => {
        const [step, setStep] = useState(0);
        const steps = [
            "Initializing Reverse Prompt Protocols...",
            "Deconstructing DNA...",
            "Running Forensic Audit...",
            "Applying Anti-Hallucination Filters...",
            "Synthesizing Master Prompt..."
        ];

        useEffect(() => {
            const interval = setInterval(() => {
                setStep((prev) => (prev + 1) % steps.length);
            }, 2000);
            return () => clearInterval(interval);
        }, []);

        return (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full animate-pulse"></div>
                    <RotateCcw className="w-16 h-16 text-orange-500 animate-spin relative z-10 duration-3000" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 animate-pulse">
                        {steps[step]}
                    </h3>
                    <p className="text-slate-500 text-sm font-mono">Running Deep Analysis...</p>
                </div>
                <div className="w-64 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 animate-[progress_2s_ease-in-out_infinite] origin-left"></div>
                </div>
            </div>
        );
    };

    return (
        <PageTemplate
            title="Reverse Prompt Engineering"
            subtitle="Full-page workspace for deconstructing content and designs"
            icon={RotateCcw}
            iconGradient="from-orange-500 to-red-600"
            shadowColor="shadow-orange-500/30"
            isSidebarOpen={isSidebarOpen}
            className="!p-0 !overflow-hidden flex flex-col h-[calc(100vh-144px)]"
            headerClassName="!px-4 !py-4 border-b border-slate-200"
            titleClassName="text-lg"
            subtitleClassName="text-xs"
            iconSize={20}
        >
            <div className="flex h-full flex-col lg:flex-row overflow-hidden relative">

                {/* LEFT PANEL: Input Studio */}
                <div className="w-full lg:w-1/2 flex flex-col bg-white h-full border-r border-slate-200 z-10 shadow-lg lg:shadow-none">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                        {/* 1. Configuration Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* LLM Selector */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1">
                                <LLMSelector
                                    onOpenSettings={() => window.dispatchEvent(new Event('open-settings-modal'))}
                                    className="bg-transparent border-0 shadow-none !p-0"
                                />
                            </div>

                            {/* Persona Selector */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1">
                                <PersonaSelector
                                    activePersonaId={selectedPersonaId}
                                    setActivePersonaId={setSelectedPersonaId}
                                    className="bg-transparent border-0 shadow-none !p-0"
                                />
                            </div>

                            {/* Analysis Mode Selector */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1">
                                <AnalysisFocusSelector
                                    value={analysisMode}
                                    onChange={setAnalysisMode}
                                    modes={ANALYSIS_MODES}
                                    className="bg-transparent border-0 shadow-none !p-0"
                                />
                            </div>
                        </div>



                        {/* Active Persona Badge */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-start gap-3">
                            <div className="mt-1 min-w-[4px] h-4 rounded-full bg-indigo-500"></div>
                            <div>
                                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-1">Acting As</h4>
                                <p className="text-sm text-indigo-800 leading-relaxed font-medium">
                                    {PERSONAS.find(p => p.id === selectedPersonaId)?.role}
                                </p>
                            </div>
                        </div>

                        {/* 2. Text Input Section */}
                        <div className="space-y-2">
                            <SectionHeader title="Text Input" className="text-slate-800 !mb-2" />
                            <div className="relative border border-slate-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-orange-500/20 bg-white transition-all hover:border-slate-300">
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder={`As a ${PERSONAS.find(p => p.id === selectedPersonaId)?.name}, I will analyze your text or code...`}
                                    className="w-full min-h-[160px] p-4 bg-transparent border-none focus:ring-0 outline-none resize-none text-slate-700 font-mono text-sm leading-relaxed placeholder:text-slate-400"
                                    disabled={isAnalyzing}
                                />
                                <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/30 rounded-b-xl">
                                    <div className="text-xs text-slate-400">
                                        {inputText.length} chars
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={handleAnalyze}
                                        isLoading={isAnalyzing}
                                        disabled={(!inputText.trim() && files.length === 0) || isAnalyzing}
                                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-3 py-1 shadow-sm shadow-orange-500/20"
                                        title="Start Analysis"
                                    >
                                        <Send size={16} />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* 3. Document Upload Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <SectionHeader title="Attachments" className="text-slate-800 !mb-0" />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs flex items-center gap-1.5 text-orange-600 font-medium hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    {isProcessingFile ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                                    Upload Docs
                                </button>
                            </div>

                            {/* Empty State for Docs */}
                            {files.length === 0 && (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-orange-300 hover:bg-orange-50/10 transition-all select-none group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white text-slate-400 group-hover:text-orange-500 transition-colors shadow-sm">
                                        <ImageIcon size={20} />
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">Click to upload images</p>
                                    <p className="text-xs text-slate-400">Supports PNG, JPG, Screenshots</p>
                                </div>
                            )}

                            {/* Files List */}
                            {files.length > 0 && (
                                <div className="space-y-2">
                                    {files.map((file) => (
                                        <div key={file.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                                            <div className="w-12 h-12 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden border border-slate-100 relative">
                                                {file.preview ? (
                                                    <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <FileText size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-slate-700 truncate">{file.name}</h4>
                                                <p className="text-[10px] text-slate-400 uppercase">{file.type.split('/')[1] || 'FILE'}</p>
                                            </div>
                                            <button
                                                onClick={() => removeFile(file.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remove file"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tech Stack Preference */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                                Tech Stack Preference
                            </label>
                            <input
                                type="text"
                                value={techStack}
                                onChange={(e) => setTechStack(e.target.value)}
                                placeholder="e.g. React, Tailwind, Lucide, Next.js"
                                className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>

                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        data-testid="file-upload"
                    />
                </div>

                {/* RIGHT PANEL: Output Source */}
                <div className="w-full lg:w-1/2 flex flex-col bg-slate-50/60 h-full relative">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">

                        {isAnalyzing ? (
                            <AnalysisLoader />
                        ) : result ? (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800">Analysis Result</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                {PERSONAS.find(p => p.id === selectedPersonaId)?.name}
                                            </span>
                                            <span className="text-slate-400 text-xs">•</span>
                                            <span className="text-slate-500 text-xs">Generated by {llmConfig.providerId}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleSave}
                                            leftIcon={<Save size={16} />}
                                            className="bg-white hover:bg-slate-50 text-indigo-600 border-indigo-200"
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                navigator.clipboard.writeText(result);
                                                toast.success('Copied to clipboard');
                                            }}
                                            leftIcon={<Copy size={16} />}
                                            className="bg-white hover:bg-slate-50"
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                </div>

                                <div className="prose prose-slate max-w-none">
                                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                                        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                            <div className="ml-auto text-xs text-slate-500 font-mono">mode: {files.length > 0 ? 'vision-design' : 'prompt-breakdown'}</div>
                                        </div>
                                        <div className="p-6 bg-[#1e1e2e] text-slate-300 font-mono text-sm leading-relaxed overflow-x-auto">
                                            <pre className="whitespace-pre-wrap">{result}</pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Empty State using Full Height */
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 select-none">
                                <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <Send size={40} className="text-slate-400 -ml-1 mt-1" />
                                </div>
                                <h3 className="text-3xl font-bold text-slate-300 mb-2">Workspace Ready</h3>
                                <p className="text-slate-400 max-w-sm mx-auto">
                                    Results will appear here. The panel automatically detects code, markdown, and design tokens.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <SavePromptModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleSaveWithTitle}
            />
        </PageTemplate>
    );
};
