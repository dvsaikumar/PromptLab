import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { SimpleIdea } from '@/components/prompt-builder/SimpleIdea';
import { TemplateSelector } from '@/components/prompt-builder/TemplateSelector';
import { FrameworkSelector } from '@/components/prompt-builder/FrameworkSelector';
import { ToneSelector } from '@/components/prompt-builder/ToneSelector';
import { InputField } from '@/components/prompt-builder/InputField';
import { LLMSelector } from '@/components/ui/LLMSelector';
import { PersonaSelector } from '@/components/ui/PersonaSelector';
import { PromptOutput } from '@/components/results/PromptOutput';
import { QualityScore } from '@/components/results/QualityScore';
import { usePrompt } from '@/contexts/PromptContext';
import { FRAMEWORKS } from '@/constants';
import { FlaskConical, FileText, BookOpen, Palette, Layout, RotateCcw, Layers, Settings2, X, Check, ChevronDown, Zap, Brain, SlidersHorizontal, User } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { promptDB } from '@/services/database';
import { SavePromptModal } from '@/components/SavePromptModal';
import { Button } from '@/components/ui/Button';
import { PageTemplate } from '@/components/ui/PageTemplate';
import { ResultToolbar } from '@/components/ui/ResultToolbar';
import { ProviderIcon } from '@/components/ui/ProviderIcon';
import { vectorDb } from '@/services/vectorDbService';
import { estimateTokens } from '@/utils/tokenEstimator';

interface PromptLaboratoryProps {
    isSidebarOpen?: boolean;
}

export const PromptLaboratory: React.FC<PromptLaboratoryProps> = ({ isSidebarOpen = false }) => {
    const {
        activeFramework, generatePrompt, isGenerating, fields, qualityScore,
        generatedPrompt, improvePrompt, isImproving,
        activeIndustry, activeRole, selectedTones,
        requestChainOfThought, toggleChainOfThought, simpleIdea, expandIdea, isExpanding,
        resetAll, currentPromptId, llmConfig, totalInputTokens, totalOutputTokens,
        activePersonaId, setActivePersonaId, complexity, setComplexity
    } = usePrompt();

    const selectedFramework = useMemo(() =>
        FRAMEWORKS.find(f => f.id === activeFramework) || FRAMEWORKS[0],
        [activeFramework]
    );

    const [isTemplateDrawerVisible, setIsTemplateDrawerVisible] = useState(false);
    const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
    const [isConfigurationModalVisible, setIsConfigurationModalVisible] = useState(false);
    const [selectedConfigurationTab, setSelectedConfigurationTab] = useState<'framework' | 'tone'>('framework');
    const [isOutputModalVisible, setIsOutputModalVisible] = useState(false);
    const [isComplexitySelectionVisible, setIsComplexitySelectionVisible] = useState(false);

    // Export prompt to file in various formats
    const exportPromptToFile = (format: 'md' | 'txt' | 'json') => {
        if (!generatedPrompt) return;
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `prompt_${activeFramework}_${timestamp} `;
        // Logic reused from original
        const charCount = generatedPrompt.length;
        const wordCount = generatedPrompt.trim().split(/\s+/).filter(w => w.length > 0).length;
        let content = '';
        let mime = 'text/plain';

        if (format === 'md') {
            content = `# AI Prompt(${activeFramework.toUpperCase()}) \n\n${generatedPrompt} \n\n-- -\n ** Word Count:** ${wordCount} \n ** Character Count:** ${charCount} `;
            mime = 'text/markdown';
        } else if (format === 'json') {
            content = JSON.stringify({
                meta: { framework: activeFramework, tones: selectedTones, created: new Date().toISOString() },
                inputs: fields, simpleIdea, prompt: generatedPrompt
            }, null, 2);
            mime = 'application/json';
        } else {
            content = generatedPrompt + `\n\n-- -\nWord Count: ${wordCount} \nCharacter Count: ${charCount} `;
        }

        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${format} `;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const saveNewPrompt = () => {
        if (!generatedPrompt) {
            toast.error('No prompt to save');
            return;
        }
        setIsSaveModalVisible(true);
    };

    const updateExistingPrompt = async () => {
        if (!generatedPrompt || !currentPromptId) return;
        try {
            await promptDB.updatePrompt(currentPromptId, {
                framework: activeFramework,
                prompt: generatedPrompt,
                fields: JSON.stringify(fields),
                tones: JSON.stringify(selectedTones),
                industry: activeIndustry || undefined,
                role: activeRole || undefined,
                simpleIdea: simpleIdea,
                qualityScore: qualityScore?.overallScore,
                qualityScoreDetails: qualityScore ? JSON.stringify(qualityScore) : undefined,
                persona: activePersonaId || undefined,
                tokenUsage: JSON.stringify({ input: totalInputTokens, output: totalOutputTokens }),
                updatedAt: new Date().toISOString(),
                providerId: llmConfig?.providerId || 'unknown',
                model: llmConfig?.model || 'unknown'
            });

            // Sync with Vector DB
            if (vectorDb.isAvailable()) {
                try {
                    const vector = vectorDb.generateDummyEmbedding(generatedPrompt);
                    await vectorDb.addDocuments('prompts', [{
                        title: simpleIdea || "Updated Prompt", // Title might not be strictly accurate but text is what matters
                        text: generatedPrompt,
                        category: activeFramework,
                        vector,
                        timestamp: new Date().toISOString()
                    }]);
                } catch (e) {
                    console.error("Vector update failed", e);
                }
            }

            toast.success('Changes saved!');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to update prompt.');
        }
    };

    const savePromptWithTitle = async (title: string) => {
        try {
            await promptDB.savePrompt({
                title,
                framework: activeFramework,
                prompt: generatedPrompt,
                fields: JSON.stringify(fields),
                tones: JSON.stringify(selectedTones),
                industry: activeIndustry || undefined,
                role: activeRole || undefined,
                simpleIdea: simpleIdea,
                qualityScore: qualityScore?.overallScore,
                qualityScoreDetails: qualityScore ? JSON.stringify(qualityScore) : undefined,
                persona: activePersonaId || undefined,
                tokenUsage: JSON.stringify({ input: totalInputTokens, output: totalOutputTokens }),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                providerId: llmConfig?.providerId || 'unknown',
                model: llmConfig?.model || 'unknown'
            });
            toast.success(`✓ "${title}" saved successfully!`);
            if (vectorDb.isAvailable()) {
                try {
                    const vector = vectorDb.generateDummyEmbedding(generatedPrompt);
                    await vectorDb.addDocuments('prompts', [{
                        title, text: generatedPrompt, category: activeFramework, vector, timestamp: new Date().toISOString()
                    }]);
                } catch (e) {
                    console.error("Vector save failed", e);
                }
            }
            resetAll();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to save prompt.');
        }
    };

    // Check if all mandatory fields are filled
    const areAllRequiredFieldsFilled = useMemo(() => {
        const requiredFields = selectedFramework.fields.filter(field => field.id !== 'tone');
        return requiredFields.every(field => {
            const value = fields[field.id];
            return typeof value === 'string' && value.trim().length > 0;
        });
    }, [fields, selectedFramework]);


    // Calculate token breakdown including overhead
    const tokenUsageBreakdownDisplay = useMemo(() => {
        const model = llmConfig?.model || 'gpt-4';

        // Input Calculations
        const coreIdeaTokens = estimateTokens(simpleIdea || '', model);
        const tonesTokens = estimateTokens(selectedTones.join(', '), model);
        const fieldTokens = selectedFramework.fields.map((frameworkField: any) => ({
            label: frameworkField.label,
            value: estimateTokens(fields[frameworkField.id] || '', model)
        }));

        const totalFieldsTokens = fieldTokens.reduce((accumulator: number, field: any) => accumulator + field.value, 0);
        const visibleTokensSum = coreIdeaTokens + tonesTokens + totalFieldsTokens;
        const inputOverheadTokens = Math.max(0, totalInputTokens - visibleTokensSum);

        const inputItems = [
            { label: 'Core Idea', value: coreIdeaTokens },
            { label: 'Tones', value: tonesTokens },
            ...fieldTokens,
            ...(inputOverheadTokens > 0 ? [{ label: 'System & Template', value: inputOverheadTokens }] : []),
        ];

        // Output Calculations
        const generatedContentTokens = estimateTokens(generatedPrompt || '', model);
        const outputOverheadTokens = Math.max(0, totalOutputTokens - generatedContentTokens);

        const outputItems = [
            { label: 'Generated Content', value: generatedContentTokens },
            ...(outputOverheadTokens > 0 ? [{ label: 'Metadata / Other', value: outputOverheadTokens }] : [])
        ];

        return (
            <div className="flex flex-col gap-4 min-w-[420px] p-1">
                <div className="flex gap-6">
                    {/* Left: Input Breakdown */}
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
                            <FileText size={14} className="text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Input Tokens</span>
                        </div>
                        <div className="flex flex-col h-full">
                            <div className="space-y-2 flex-1">
                                {inputItems.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600/90">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                        <div className="flex-1 flex justify-between gap-4">
                                            <span>{item.label}</span>
                                            <span className="font-semibold text-slate-800">{item.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 flex items-start gap-2.5 text-xs pt-1.5 border-t border-dashed border-emerald-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                                <div className="flex-1 flex justify-between gap-4 font-bold text-emerald-800">
                                    <span className="uppercase tracking-wider text-[10px]">Total Input</span>
                                    <span>{totalInputTokens}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Output Breakdown */}
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-amber-100">
                            <Zap size={14} className="text-amber-600" />
                            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Output Tokens</span>
                        </div>
                        <div className="flex flex-col h-full">
                            <div className="space-y-2 flex-1">
                                {outputItems.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600/90">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                        <div className="flex-1 flex justify-between gap-4">
                                            <span>{item.label}</span>
                                            <span className="font-semibold text-slate-800">{item.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 flex items-start gap-2.5 text-xs pt-1.5 border-t border-dashed border-amber-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                                <div className="flex-1 flex justify-between gap-4 font-bold text-amber-800">
                                    <span className="uppercase tracking-wider text-[10px]">Total Output</span>
                                    <span>{totalOutputTokens}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grand Total Footer */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-medium text-xs uppercase tracking-wider">Grand Total Usage</span>
                    <span className="text-indigo-600 text-sm font-extrabold tabular-nums">{totalInputTokens + totalOutputTokens} tokens</span>
                </div>
            </div>
        );
    }, [simpleIdea, selectedTones, fields, selectedFramework, totalInputTokens, totalOutputTokens, llmConfig, generatedPrompt]);

    // Header Actions
    const HeaderButtons = (
        <div className="flex items-center gap-3">
            <Button
                variant="outline"
                onClick={() => {
                    if (confirm('Are you sure you want to reset all fields?')) {
                        resetAll();
                        toast.success('Reset complete');
                    }
                }}
                leftIcon={<RotateCcw size={18} />}
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            >
                Reset
            </Button>
            <Button
                variant="outline"
                onClick={() => setIsTemplateDrawerVisible(true)}
                leftIcon={<Layout size={18} />}
            >
                Templates
            </Button>
        </div>
    );

    return (
        <PageTemplate
            title="Prompt Lab 2.0"
            subtitle="Design, Build, & Generate"
            icon={FlaskConical}
            iconGradient="from-indigo-500 to-violet-600"
            shadowColor="shadow-indigo-500/20"
            rightContent={HeaderButtons}
            isSidebarOpen={isSidebarOpen}
            className="flex flex-col !p-0 !top-[144px] bg-slate-50/50"
            headerClassName="!px-4 bg-slate-50 z-50"
            iconSize={20}
            titleClassName="text-lg"
            subtitleClassName="text-xs"
        >
            <div className="flex h-[calc(100vh-180px)] w-full overflow-hidden">
                {/* --- MAIN BUILDER --- */}
                <div className="w-full h-full flex flex-col relative">



                    {/* Content Grid */}
                    <div className="flex-1 overflow-hidden px-[2px] pb-1 pt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[2px] h-full max-w-[1920px] mx-auto">

                            {/* --- LEFT: CORE IDEA & CONTEXT --- */}
                            <div className="h-full overflow-y-auto [&::-webkit-scrollbar]:hidden pb-20 group/left relative">
                                <div className="space-y-4">
                                    {/* Configuration Grid */}
                                    <section className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide opacity-90">
                                                <div className="p-1 rounded-md bg-indigo-100 text-indigo-600">
                                                    <Settings2 size={14} />
                                                </div>
                                                Configuration
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                            {/* 1. Model Selector */}
                                            <LLMSelector
                                                onOpenSettings={() => toast('Settings placeholder')}
                                                className="w-full"
                                            />

                                            {/* 2. Persona Selector */}
                                            <PersonaSelector
                                                activePersonaId={activePersonaId}
                                                setActivePersonaId={setActivePersonaId}
                                                className="w-full"
                                            />

                                            {/* 3. Framework Selector (Trigger) */}
                                            <div className="relative">
                                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                                                    <BookOpen size={14} /> Framework
                                                </label>
                                                <div
                                                    onClick={() => { setSelectedConfigurationTab('framework'); setIsConfigurationModalVisible(true); }}
                                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer group shadow-sm"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0 text-indigo-600">
                                                            <BookOpen size={20} />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-semibold text-slate-900 truncate">
                                                                {selectedFramework.name}
                                                            </span>
                                                            <span className="text-xs text-slate-500 truncate">
                                                                Click to change
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ChevronDown size={18} className="text-slate-400 group-hover:text-indigo-500 transition-transform duration-200" />
                                                </div>
                                            </div>

                                            {/* 4. Tone Selector (Trigger) */}
                                            <div className="relative">
                                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                                                    <Palette size={14} /> Tone & Style
                                                </label>
                                                <div
                                                    onClick={() => { setSelectedConfigurationTab('tone'); setIsConfigurationModalVisible(true); }}
                                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 hover:border-pink-300 transition-all cursor-pointer group shadow-sm"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center border border-pink-100 shrink-0 text-pink-600">
                                                            <Palette size={20} />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-semibold text-slate-900 truncate">
                                                                {selectedTones.length > 0 ? `${selectedTones.length} Active` : 'Default'}
                                                            </span>
                                                            <span className="text-xs text-slate-500 truncate">
                                                                {selectedTones.length > 0 ? 'Click to edit' : 'Neutral tone'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ChevronDown size={18} className="text-slate-400 group-hover:text-pink-500 transition-transform duration-200" />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* 1. Core Idea Hero Input */}
                                    <section className="relative">
                                        <SimpleIdea isOpen={true} onToggle={() => { }} isSidebarOpen={isSidebarOpen} />
                                    </section>
                                </div>
                            </div>

                            {/* --- RIGHT: CONFIGURATION & FIELDS --- */}
                            <div className="h-full overflow-hidden pb-20">
                                <div className="space-y-1 h-full">


                                    {/* Detailed Fields */}
                                    <section className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
                                        <div className="shrink-0 z-10 bg-white flex items-center justify-between mb-3 px-1 py-1 border-b border-slate-50">
                                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide opacity-90">
                                                <div className="p-1 rounded-md bg-purple-100 text-purple-600">
                                                    <FileText size={14} />
                                                </div>
                                                {selectedFramework.name} Inputs
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    onClick={expandIdea}
                                                    disabled={!simpleIdea.trim() || isExpanding}
                                                    size="sm"
                                                    variant="primary"
                                                    className="h-8 text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/20 rounded-full px-4"
                                                    isLoading={isExpanding}
                                                >
                                                    Auto-Expand
                                                </Button>
                                                <label className="flex items-center gap-2 cursor-pointer select-none group bg-purple-50/50 hover:bg-purple-100 px-3 py-1.5 rounded-full border border-purple-100/50 hover:border-purple-200 transition-all">
                                                    <input type="checkbox" className="peer sr-only" checked={requestChainOfThought} onChange={toggleChainOfThought} />
                                                    <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:bg-purple-600 relative transition-colors duration-300">
                                                        <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-4 shadow-sm"></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">CoT Mode</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1 pb-2">
                                            {selectedFramework.fields.map((field: any, index: number) => (
                                                <div key={field.id} className="transform transition-all duration-500" style={{ animationDelay: `${index * 100} ms` }}>
                                                    <InputField
                                                        id={field.id}
                                                        label={field.label}
                                                        description={field.description}
                                                        placeholder={field.placeholder}
                                                        isReadOnly={activeFramework === 'costar' && field.id === 'tone'}
                                                        compact={true}
                                                        minRows={4}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Action Dock */}
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-fit max-w-[95vw] px-4 z-50">
                        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 text-white p-2 rounded-2xl shadow-2xl flex items-center justify-between gap-4 ring-1 ring-white/20">

                            {/* Stats */}
                            {/* Stats & Context */}
                            <div className="flex items-center gap-3 px-2">
                                <div className="grid grid-cols-2 gap-1.5 shrink-0">
                                    {llmConfig && (
                                        <Tooltip content={llmConfig.model} title="Active Model" position="top">
                                            <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 text-blue-100 overflow-hidden cursor-pointer">
                                                <ProviderIcon providerId={llmConfig.providerId} size={10} className="text-blue-300 shrink-0" />
                                                <span className="capitalize font-bold text-[10px] truncate max-w-[80px] leading-none">{llmConfig.model}</span>
                                            </div>
                                        </Tooltip>
                                    )}

                                    <Tooltip content={activePersonaId.replace(/-/g, ' ')} title="Selected Persona" position="top">
                                        <div className="flex items-center gap-1.5 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 text-indigo-100 overflow-hidden cursor-pointer">
                                            <User size={10} className="text-indigo-300 shrink-0" />
                                            <span className="font-bold capitalize truncate max-w-[80px] text-[10px] leading-none">{activePersonaId.replace(/-/g, ' ')}</span>
                                        </div>
                                    </Tooltip>

                                    <Tooltip content={activeFramework} title="Prompt Framework" position="top">
                                        <div className="flex items-center gap-1.5 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 text-purple-100 overflow-hidden cursor-pointer">
                                            <Layout size={10} className="text-purple-300 shrink-0" />
                                            <span className="font-bold uppercase truncate max-w-[80px] text-[10px] leading-none">{activeFramework}</span>
                                        </div>
                                    </Tooltip>

                                    {selectedTones.length > 0 ? (
                                        <Tooltip content={selectedTones} title="Tones Selected" position="top">
                                            <div className="flex items-center gap-1.5 bg-pink-500/10 px-2 py-1 rounded border border-pink-500/20 text-pink-100 overflow-hidden cursor-pointer">
                                                <Palette size={10} className="text-pink-300 shrink-0" />
                                                <span className="font-bold text-[10px] leading-none">{selectedTones.length} Tones</span>
                                            </div>
                                        </Tooltip>
                                    ) : (
                                        <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded border border-white/5 text-slate-500">
                                            <span className="text-[10px] font-bold leading-none">No Tones</span>
                                        </div>
                                    )}
                                </div>

                                <div className="w-px h-8 bg-white/10 shrink-0"></div>

                                <Tooltip
                                    content={tokenUsageBreakdownDisplay}
                                    title="Token Breakdown"
                                    position="top"
                                >
                                    <div className="flex flex-col bg-slate-950/30 rounded-lg border border-white/10 overflow-hidden shrink-0 self-stretch justify-center min-w-[120px]">
                                        <div className="bg-white/5 px-2 py-0.5 text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">
                                            Token Count
                                        </div>
                                        <div className="flex divide-x divide-white/10">
                                            <div className="px-2 py-0.5 flex items-center justify-center gap-1.5 flex-1">
                                                <span className="text-[8px] text-slate-500 uppercase font-bold">In</span>
                                                <span className="text-[10px] font-bold text-slate-300 tabular-nums">{totalInputTokens}</span>
                                            </div>
                                            <div className="px-2 py-0.5 flex items-center justify-center gap-1.5 bg-indigo-500/10 flex-1">
                                                <span className="text-[8px] text-indigo-400 uppercase font-bold">Out</span>
                                                <span className="text-[10px] font-bold text-indigo-200 tabular-nums">{totalOutputTokens}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Tooltip>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => setIsOutputModalVisible(true)}
                                    className="h-9 px-4 bg-white/8 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all shadow-sm font-medium"
                                >
                                    View Output
                                </Button>
                                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                                <Button
                                    onClick={() => setIsComplexitySelectionVisible(true)}
                                    disabled={isGenerating || !areAllRequiredFieldsFilled}
                                    isLoading={isGenerating}
                                    className="h-10 px-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 border-none"
                                >
                                    {isGenerating ? 'Building...' : generatedPrompt ? (
                                        <span className="flex items-center gap-2">
                                            <RotateCcw size={16} /> Regenerate
                                        </span>
                                    ) : 'Generate'}
                                </Button>
                            </div>
                        </div>
                    </div>

                </div >
            </div >

            <TemplateSelector isOpen={isTemplateDrawerVisible} onClose={() => setIsTemplateDrawerVisible(false)} />
            <SavePromptModal
                isOpen={isSaveModalVisible}
                onClose={() => setIsSaveModalVisible(false)}
                onSave={savePromptWithTitle}
            />

            {/* Output Modal */}
            {isOutputModalVisible && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header with Toolbar */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                                <h2 className="text-lg font-bold text-slate-800">Generated Output</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                {generatedPrompt && (
                                    <ResultToolbar
                                        onExport={exportPromptToFile}
                                        onSave={currentPromptId ? updateExistingPrompt : saveNewPrompt}
                                        onSaveAs={currentPromptId ? saveNewPrompt : undefined}
                                        contentToCopy={generatedPrompt}
                                        className="shadow-none border-none bg-transparent"
                                    />
                                )}
                                <button
                                    onClick={() => setIsOutputModalVisible(false)}
                                    className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden p-3 bg-slate-50/50 flex flex-col gap-3">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
                                {/* Left: Stitched Prompt Preview (Inputs) */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ring-4 ring-slate-50 flex flex-col h-full">
                                    <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                        <Layers size={16} className="text-slate-500" />
                                        <h3 className="font-semibold text-slate-700 text-sm">Stitched Prompt Context</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-md inline-block uppercase tracking-wide">Core Idea</label>
                                            <div className="p-2 bg-slate-50 rounded-lg text-sm text-slate-700 leading-relaxed border border-slate-100">
                                                {simpleIdea || <em className="text-slate-400">No core idea provided.</em>}
                                            </div>
                                        </div>
                                        {selectedFramework.fields.map((field: any) => (
                                            <div key={field.id} className="space-y-1">
                                                <label className="text-xs font-bold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-md inline-block uppercase tracking-wide">{field.label}</label>
                                                <div className="p-2 bg-slate-50 rounded-lg text-sm text-slate-700 leading-relaxed border border-slate-100">
                                                    {fields[field.id] || <em className="text-slate-400">Empty</em>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right: Generated Output (PromptOutput) */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ring-4 ring-slate-50 flex flex-col h-full">
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <PromptOutput hideHeader={true} />
                                    </div>
                                </div>
                            </div>

                            {/* Score at Bottom */}
                            {qualityScore && (
                                <div className="shrink-0 animate-in slide-in-from-bottom-4 fade-in duration-500">
                                    <QualityScore
                                        score={qualityScore}
                                        onImprove={improvePrompt}
                                        isImproving={isImproving}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Complexity Modal */}
            {isComplexitySelectionVisible && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <SlidersHorizontal size={20} className="text-indigo-600" />
                                Select Complexity
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Choose how detailed the generated prompt should be.
                            </p>
                        </div>

                        <div className="p-6 space-y-3">
                            {[
                                { id: 'low', label: 'Basic', icon: Zap, desc: 'Simple, direct structure. Low token usage.', color: 'blue' },
                                { id: 'medium', label: 'Advanced', icon: SlidersHorizontal, desc: 'Balanced detail and context.', color: 'indigo' },
                                { id: 'high', label: 'Expert', icon: Brain, desc: 'Maximum detail, CoT, and extensive constraints.', color: 'purple' }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setComplexity(opt.id as any)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group ${complexity === opt.id
                                        ? `border-${opt.color}-500 bg-${opt.color}-50 ring-1 ring-${opt.color}-500`
                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`p-3 rounded-lg ${complexity === opt.id ? `bg-${opt.color}-100 text-${opt.color}-600` : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                                        <opt.icon size={24} />
                                    </div>
                                    <div>
                                        <div className={`font-bold ${complexity === opt.id ? `text-${opt.color}-900` : 'text-slate-700'}`}>{opt.label}</div>
                                        <div className="text-xs text-slate-500">{opt.desc}</div>
                                    </div>
                                    {complexity === opt.id && (
                                        <div className={`ml-auto text-${opt.color}-600`}>
                                            <Check size={20} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setIsComplexitySelectionVisible(false)}>Cancel</Button>
                            <Button
                                onClick={() => {
                                    setIsComplexitySelectionVisible(false);
                                    generatePrompt();
                                    setIsOutputModalVisible(true);
                                }}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                leftIcon={<RotateCcw size={16} />}
                            >
                                Generate Prompt
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Configuration Modal */}
            {isConfigurationModalVisible && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Settings2 className="text-indigo-600" size={20} />
                                </div>
                                Prompt Configuration
                            </h2>
                            <button
                                onClick={() => setIsConfigurationModalVisible(false)}
                                className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 pt-2">
                            <button
                                onClick={() => setSelectedConfigurationTab('framework')}
                                className={clsx(
                                    "flex-1 justify-center px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
                                    selectedConfigurationTab === 'framework'
                                        ? "border-indigo-500 text-indigo-700 bg-white rounded-t-lg"
                                        : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 rounded-t-lg"
                                )}
                            >
                                <BookOpen size={16} /> Framework
                            </button>
                            <button
                                onClick={() => setSelectedConfigurationTab('tone')}
                                className={clsx(
                                    "flex-1 justify-center px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
                                    selectedConfigurationTab === 'tone'
                                        ? "border-pink-500 text-pink-700 bg-white rounded-t-lg"
                                        : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 rounded-t-lg"
                                )}
                            >
                                <Palette size={16} /> Tone & Style
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6 custom-scrollbar">
                            {selectedConfigurationTab === 'framework' ? (
                                <div className="w-full">
                                    <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-sm">
                                        <p className="font-bold mb-1">Select a Framework</p>
                                        <p className="opacity-80">Choose the structural model for your prompt. This defines the input fields and overall logic.</p>
                                    </div>
                                    <FrameworkSelector isOpen={true} onToggle={() => { }} hideHeader={true} />
                                </div>
                            ) : (
                                <div className="w-full">
                                    <div className="mb-4 p-4 bg-pink-50 border border-pink-100 rounded-xl text-pink-800 text-sm">
                                        <p className="font-bold mb-1">Set the Tone</p>
                                        <p className="opacity-80">Define the personality and communication style of your AI assistant.</p>
                                    </div>
                                    <ToneSelector isOpen={true} onToggle={() => { }} hideHeader={true} />
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
                            <Button onClick={() => setIsConfigurationModalVisible(false)} variant="outline">
                                Close
                            </Button>
                            <Button onClick={() => setIsConfigurationModalVisible(false)} leftIcon={<Check size={16} />}>
                                Done
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </PageTemplate >
    );
};
