import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, RefreshCw, Wand2, Gauge, MessageSquare, Sparkles, ArrowDown, Paperclip, FileText, Trash2 } from 'lucide-react';
import { LLMSelector } from '@/components/ui/LLMSelector';
import { PersonaSelector } from '@/components/ui/PersonaSelector';
import { UnifiedSelector } from '@/components/ui/UnifiedSelector';
import { Button } from '@/components/ui/Button';
import { TONES } from '@/constants';
import { LLMService } from '@/services/llm';
import toast from 'react-hot-toast';
import { usePrompt } from '@/contexts/PromptContext';
import { llmConfigDB } from '@/services/llmConfigDB';

interface NodeConfigurationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    nodeData: any;
    onUpdate: (data: any) => void;
    onSave: () => void;
}

const COMPLEXITY_OPTIONS = [
    { value: 'low', label: 'Low - Simple & Direct' },
    { value: 'medium', label: 'Medium - Balanced' },
    { value: 'high', label: 'High - Detailed & Complex' }
];

export const NodeConfigurationDrawer: React.FC<NodeConfigurationDrawerProps> = ({ isOpen, onClose, nodeData, onUpdate, onSave }) => {
    const { llmConfig } = usePrompt();
    const [formData, setFormData] = useState<any>(nodeData || {});
    const [showAutoFill, setShowAutoFill] = useState(false);
    const [autoFillContext, setAutoFillContext] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    // Initialize attachedFiles from nodeData
    const [attachedFiles, setAttachedFiles] = useState<{ name: string, size: string, content: string }[]>(nodeData?.files || []);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync formData when attachedFiles changes
    useEffect(() => {
        handleChange('files', attachedFiles);
    }, [attachedFiles]);

    // Reset form data and files when nodeData changes
    useEffect(() => {
        setFormData(nodeData || {});
        setAttachedFiles(nodeData?.files || []);
    }, [nodeData]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result as string;
                    const newFile = {
                        name: file.name,
                        size: (file.size / 1024).toFixed(1) + ' KB',
                        content: content // Store text content
                    };
                    setAttachedFiles(prev => [...prev, newFile]);
                };
                reader.readAsText(file);
            });
            toast.success(`Attached ${files.length} file(s)`);
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Helper to get the correct config for THIS node, independent of global state
    const getEffectiveConfig = async () => {
        // If node has a specific provider selected
        if (formData.providerId) {
            try {
                const allConfigs = await llmConfigDB.getAllConfigs();
                // Find a saved config for this provider AND model (if specified)
                const nodeConfig = allConfigs.find(c =>
                    c.providerId === formData.providerId &&
                    (!formData.model || c.model === formData.model)
                );
                // If found, return it.
                if (nodeConfig) return nodeConfig;

                // If no specific saved config found but provider is selected (e.g. 'openai'),
                // and global is ALSO 'openai' AND matches model (or no model set), use global.
                if (llmConfig.providerId === formData.providerId && (!formData.model || llmConfig.model === formData.model)) return llmConfig;

                // If global is different, do NOT use global. Return a placeholder so the UI attempts to use the CORRECT provider.
                return {
                    providerId: formData.providerId,
                    apiKey: '',
                    model: formData.model || '',
                    baseUrl: ''
                } as any;
            } catch (err) {
                console.warn("Error fetching node config, falling back to clean slate", err);
                return { providerId: formData.providerId, apiKey: '', model: '' } as any;
            }
        }
        // If node has no provider set, use global
        return llmConfig;
    };

    const [generatingField, setGeneratingField] = useState<string | null>(null);

    const handleAiFieldAssist = async (field: 'label' | 'prompt') => {
        const currentContent = formData[field];
        const context = field === 'label' ? formData.prompt : formData.label;

        // Validation
        if (field === 'label' && !context) {
            toast.error("Please enter a prompt first to generate a label");
            return;
        }
        if (field === 'prompt' && !currentContent && !context) {
            toast.error("Please enter a label or prompt content first");
            return;
        }

        setGeneratingField(field);
        try {
            const config = await getEffectiveConfig();

            if (!config?.providerId) {
                throw new Error("No LLM Provider selected. Please configure one in settings.");
            }

            let systemPrompt = '';
            let userContent = '';

            if (field === 'label') {
                systemPrompt = "You are a naming expert. Generate a short, action-oriented, professional title (max 5 words) for the following prompt task. Return ONLY the title.";
                userContent = context;
            } else if (field === 'prompt') {
                if (currentContent) {
                    systemPrompt = "You are a Master Prompt Engineer. Refine the following system prompt to be more structured, clear, and effective. Improve the tone and add any missing best practices. Return ONLY the refined prompt.";
                    userContent = currentContent;
                } else {
                    systemPrompt = "You are a Master Prompt Engineer. Generate a comprehensive system prompt for the following task/step. Return ONLY the prompt.";
                    userContent = context;
                }
            }

            console.log(`[AI Assist] Generating ${field} using ${config.providerId}...`);

            const generated = await LLMService.getInstance().getProvider(config.providerId).generateCompletion({
                userPrompt: `${systemPrompt}\n\nContent:\n${userContent}`,
                config: config,
                temperature: 0.7
            });

            handleChange(field, generated.replace(/^"|"$/g, '').trim()); // Remove quotes if any
            toast.success(`${field === 'label' ? 'Label' : 'Prompt'} updated!`);
        } catch (error: any) {
            console.error("[AI Assist Error]:", error);
            toast.error(`Failed to generate: ${error.message || 'Unknown error'}`);
        } finally {
            setGeneratingField(null);
        }
    };

    const handleAutoGenerate = async () => {
        if (!autoFillContext.trim()) {
            toast.error("Please enter some context for the Auto-Fill");
            return;
        }

        setIsGenerating(true);
        try {
            const config = await getEffectiveConfig();

            const personaName = formData.personaId || 'Expert';
            const tone = formData.tone || 'Professional';
            const complexity = formData.complexity || 'Medium';

            const metayPrompt = `
            Act as a Lead Prompt Engineer.
            Create a detailed, high-quality system prompt for a ${personaName}.
            
            Task Description: ${autoFillContext}
            
            Requirements:
            - Tone: ${tone}
            - Complexity Level: ${complexity}
            - Use the {{input}} variable if the task implies processing previous output.
            - Return ONLY the prompt content, no conversational filler.
            `;

            const generated = await LLMService.getInstance().getProvider(config.providerId).generateCompletion({
                userPrompt: metayPrompt,
                config: config,
                temperature: 0.7
            });

            handleChange('prompt', generated.trim());
            toast.success("Prompt generated successfully!");
            setShowAutoFill(false); // Optionally close after success
        } catch (error) {
            console.error(error);
            toast.error("Failed to auto-generate prompt");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = () => {
        onUpdate(formData);
        onSave();
    };

    const handleReset = () => {
        setFormData({
            ...nodeData,
            providerId: '',
            model: '', // Reset model too
            personaId: '',
            complexity: 'medium',
            tone: '',
            prompt: ''
        });
    };

    if (!isOpen && !nodeData) return null;

    const content = (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[100] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="w-full relative group/label">
                        <input
                            type="text"
                            value={formData.label || ''}
                            onChange={(e) => handleChange('label', e.target.value)}
                            className="text-lg font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-400 w-full pr-8"
                            placeholder="Node Name"
                        />
                        <button
                            onClick={() => handleAiFieldAssist('label')}
                            disabled={generatingField === 'label'}
                            className={`absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 transition-all opacity-0 group-hover/label:opacity-100 ${generatingField === 'label' ? 'animate-spin text-indigo-400 opacity-100' : ''}`}
                            title="Generate Label from Prompt"
                        >
                            <Wand2 size={16} />
                        </button>
                        <div className="text-xs text-slate-500 font-mono mt-1">
                            Node ID: {formData.id || 'N/A'}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* 1. AI Model */}
                    <div className="space-y-4">
                        <LLMSelector
                            onOpenSettings={() => window.dispatchEvent(new Event('open-settings-modal'))}
                            value={formData.providerId}
                            model={formData.model}
                            onChange={(pid, model) => {
                                handleChange('providerId', pid);
                                if (model !== undefined) handleChange('model', model);
                            }}
                            className=""
                        />
                    </div>

                    {/* 2. Persona */}
                    <div className="space-y-4">
                        <PersonaSelector
                            activePersonaId={formData.personaId || 'prompt-engineer'}
                            setActivePersonaId={(id) => handleChange('personaId', id)}
                            className=""
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* 3. Complexity */}
                        <UnifiedSelector
                            label="Complexity"
                            icon={<Gauge size={14} />}
                            value={formData.complexity || 'medium'}
                            onChange={(val) => handleChange('complexity', val)}
                            options={COMPLEXITY_OPTIONS.map(opt => ({
                                value: opt.value,
                                label: opt.label.split(' - ')[0],
                                description: opt.label.split(' - ')[1],
                                icon: <Gauge size={18} />
                            }))}
                        />

                        {/* 4. Tone */}
                        <UnifiedSelector
                            label="Tone"
                            icon={<MessageSquare size={14} />}
                            value={formData.tone || ''}
                            onChange={(val) => handleChange('tone', val)}
                            placeholder="Select Tone"
                            searchable={true}
                            options={TONES.map(t => ({
                                value: t.value,
                                label: t.label,
                                description: t.description,
                                icon: <MessageSquare size={18} />
                            }))}
                        />
                    </div>

                    {/* 5, 6. Prompt Input & Auto-Fill */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                Prompt Content
                            </label>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAiFieldAssist('prompt')}
                                    disabled={generatingField === 'prompt'}
                                    className={`h-7 text-xs gap-1.5 ${generatingField === 'prompt' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-indigo-600'}`}
                                >
                                    <Sparkles size={12} className={generatingField === 'prompt' ? "animate-spin" : ""} />
                                    {generatingField === 'prompt' ? 'Refining...' : 'Refine'}
                                </Button>
                                <Button
                                    variant={showAutoFill ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setShowAutoFill(!showAutoFill)}
                                    className={`h-7 text-xs gap-1.5 ${showAutoFill ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-indigo-600'}`}
                                >
                                    <Wand2 size={12} className={showAutoFill ? "fill-indigo-300" : ""} />
                                    Draft with AI
                                </Button>
                            </div>
                        </div>

                        {/* Auto-Fill Section */}
                        {showAutoFill && (
                            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-indigo-900 ml-1">
                                        What should this step do?
                                    </label>
                                    <textarea
                                        value={autoFillContext}
                                        onChange={(e) => setAutoFillContext(e.target.value)}
                                        placeholder="e.g. Summarize the text and extract key action items..."
                                        className="w-full h-20 bg-white border border-indigo-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 placeholder:text-slate-400 resize-none"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        size="sm"
                                        onClick={handleAutoGenerate}
                                        disabled={isGenerating}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm w-full sm:w-auto"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Wand2 size={14} className="animate-spin mr-2" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 size={14} className="mr-2" />
                                                Generate Text
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <div className="flex justify-center text-indigo-200">
                                    <ArrowDown size={16} />
                                </div>
                            </div>
                        )}

                        <textarea
                            value={formData.prompt || ''}
                            onChange={(e) => handleChange('prompt', e.target.value)}
                            placeholder="Enter your instructions here. Use {{input}} to reference the previous step's output."
                            className="w-full h-48 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />

                        {/* File Upload / Attachments */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                                    Attachments
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-7 text-xs gap-1.5 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600"
                                >
                                    <Paperclip size={12} />
                                    Attach File
                                </Button>
                            </div>

                            {/* File List */}
                            {attachedFiles.length > 0 && (
                                <div className="space-y-2 mt-1">
                                    {attachedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg group animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div className="p-1.5 bg-white rounded border border-slate-200 text-indigo-600">
                                                <FileText size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-slate-700 font-medium truncate">{file.name}</div>
                                                <div className="text-[10px] text-slate-400">{file.size}</div>
                                            </div>
                                            <button
                                                onClick={() => removeFile(idx)}
                                                className="p-1.5 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded transition-colors"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                        className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                        leftIcon={<RefreshCw size={16} />}
                    >
                        Reset
                    </Button>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-slate-500"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="!bg-slate-900 !bg-none hover:!bg-slate-800 text-white shadow-lg shadow-slate-900/20"
                            leftIcon={<Save size={16} />}
                        >
                            Save & Exit
                        </Button>
                    </div>
                </div>

            </div>
        </>
    );

    return createPortal(content, document.body);
};
