import React, { useState, useMemo, useEffect } from 'react';
import { SimpleIdea } from '@/components/prompt-builder/SimpleIdea';
import { TemplateSelector } from '@/components/prompt-builder/TemplateSelector';
import { FrameworkSelector } from '@/components/prompt-builder/FrameworkSelector';
import { ToneSelector } from '@/components/prompt-builder/ToneSelector';
import { InputField } from '@/components/prompt-builder/InputField';
import { PromptOutput } from '@/components/results/PromptOutput';
import { QualityScore } from '@/components/results/QualityScore';
import { usePrompt } from '@/contexts/PromptContext';
import { FRAMEWORKS, TONES, INDUSTRY_TEMPLATES, ROLE_PRESETS } from '@/constants';
import { Wand2, FlaskConical, Sparkles, FileText, BookOpen, Palette, Layout, RefreshCw, Tag, RotateCcw, Zap, Layers, Brain } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { promptDB } from '@/services/database';
import { SavePromptModal } from '@/components/SavePromptModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageTemplate } from '@/components/ui/PageTemplate';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ResultToolbar } from '@/components/ui/ResultToolbar';
import { ProviderIcon } from '@/components/ui/ProviderIcon';

interface PromptLabProps {
    activeSection: string | null;
    toggleSection: (section: string) => void;
    isSidebarOpen?: boolean;
}

const menuItems = [
    { id: 'quick-start', label: 'Quick Start', icon: Sparkles, color: 'text-amber-600', gradient: 'from-amber-500 to-orange-500' },
    { id: 'frameworks', label: 'Frameworks', icon: BookOpen, color: 'text-blue-600', gradient: 'from-blue-500 to-indigo-500' },
    { id: 'tones', label: 'Tones', icon: Palette, color: 'text-pink-600', gradient: 'from-pink-500 to-rose-500' },
    { id: 'components', label: 'Components', icon: FileText, color: 'text-purple-600', gradient: 'from-purple-500 to-violet-500' },
];

const outputMenuItem = { id: 'output', label: 'Output', icon: Wand2, color: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-500' };

export const PromptLab: React.FC<PromptLabProps> = ({ isSidebarOpen = false }) => {
    const {
        activeFramework, generatePrompt, isGenerating, fields, qualityScore,
        generatedPrompt, improvePrompt, isImproving, analyzeQuality, isAnalyzing,
        activeIndustry, activeRole, selectedTones, toggleTone, clearIndustry, clearRole,
        requestChainOfThought, toggleChainOfThought, simpleIdea, expandIdea, isExpanding,
        resetAll, complexity, currentPromptId, llmConfig, totalInputTokens, totalOutputTokens,
        assemblePrompt
    } = usePrompt();

    const currentFramework = useMemo(() =>
        FRAMEWORKS.find(f => f.id === activeFramework) || FRAMEWORKS[0],
        [activeFramework]
    );
    const [selectedMenu, setSelectedMenu] = useState('quick-start');
    const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

    // Export Handler
    const handleExport = (format: 'md' | 'txt' | 'json') => {
        if (!generatedPrompt) return;

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `prompt_${activeFramework}_${timestamp}`;
        const charCount = generatedPrompt.length;
        const wordCount = generatedPrompt.trim().split(/\s+/).filter(w => w.length > 0).length;

        let content = '';
        let mime = 'text/plain';

        if (format === 'md') {
            content = `# AI Prompt (${activeFramework.toUpperCase()})\n\n${generatedPrompt}\n\n---\n**Word Count:** ${wordCount}  \n**Character Count:** ${charCount}`;
            mime = 'text/markdown';
        } else if (format === 'json') {
            const data = {
                meta: {
                    framework: activeFramework,
                    tones: selectedTones,
                    created: new Date().toISOString(),
                    stats: {
                        words: wordCount,
                        chars: charCount
                    }
                },
                inputs: fields,
                simpleIdea,
                prompt: generatedPrompt
            };
            content = JSON.stringify(data, null, 2);
            mime = 'application/json';
        } else {
            content = generatedPrompt + `\n\n---\nWord Count: ${wordCount}\nCharacter Count: ${charCount}`;
        }

        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Save As New Handler
    const handleSaveNew = () => {
        if (!generatedPrompt) {
            toast.error('No prompt to save');
            return;
        }
        setIsSaveModalOpen(true);
    };

    // Update Handler
    const handleUpdate = async () => {
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
                updatedAt: new Date().toISOString(),
                providerId: llmConfig?.providerId || 'unknown',
                model: llmConfig?.model || 'unknown'
            });
            toast.success('Changes saved!');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to update prompt.');
            console.error('Update failed:', error);
        }
    };

    const handleSaveWithTitle = async (title: string) => {
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
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                providerId: llmConfig?.providerId || 'unknown',
                model: llmConfig?.model || 'unknown'
            });
            toast.success(`✓ "${title}" saved successfully!`);

            // Reset all fields after saving
            resetAll();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to save prompt.');
            console.error('Save failed:', error);
        }
    };

    // Get labels for active context
    const activeIndustryLabel = useMemo(() =>
        INDUSTRY_TEMPLATES.find(t => t.id === activeIndustry)?.label,
        [activeIndustry]);

    const activeRoleLabel = useMemo(() =>
        ROLE_PRESETS.find(t => t.id === activeRole)?.label,
        [activeRole]);

    const activeToneLabels = useMemo(() =>
        selectedTones.map(t => ({
            value: t,
            label: TONES.find(opt => opt.value === t)?.label || t
        })),
        [selectedTones]);

    // Auto-switch to output menu when prompt is generated
    useEffect(() => {
        if (generatedPrompt) {
            setSelectedMenu('output');
        }
    }, [generatedPrompt]);

    // Listen for manual reset from Sidebar
    useEffect(() => {
        const handleReset = () => {
            setSelectedMenu('quick-start');
        };
        window.addEventListener('reset-prompt-lab', handleReset);
        return () => window.removeEventListener('reset-prompt-lab', handleReset);
    }, []);

    // Auto-switch to components when auto-fill completes
    const wasExpanding = React.useRef(false);
    useEffect(() => {
        if (wasExpanding.current && !isExpanding) {
            setSelectedMenu('components');
        }
        wasExpanding.current = isExpanding;
    }, [isExpanding]);

    // Check if all mandatory fields are filled
    const isFormValid = useMemo(() => {
        const requiredFields = currentFramework.fields.filter(field =>
            field.id !== 'tone'
        );
        return requiredFields.every(field => {
            const value = fields[field.id];
            return value && value.trim().length > 0;
        });
    }, [fields, currentFramework]);

    const displayMenuItems = generatedPrompt
        ? [...menuItems, outputMenuItem]
        : menuItems;

    // Components section header actions
    const ComponentsActions = (
        <div className="flex items-center gap-5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 transition-all hover:bg-purple-100 hover:border-purple-200">
                <div className="relative">
                    <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={requestChainOfThought}
                        onChange={toggleChainOfThought}
                    />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-purple-600 transition-colors shadow-inner"></div>
                    <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                </div>
                <span className="text-xs font-extrabold text-purple-700 uppercase tracking-wide">Chain of Thoughts</span>
            </label>

            <Button
                onClick={expandIdea}
                disabled={!simpleIdea.trim() || isExpanding}
                variant="primary"
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-orange-500/20"
                isLoading={isExpanding}
                leftIcon={isExpanding ? null : <Sparkles size={16} />}
            >
                AUTO-FILL
            </Button>
        </div>
    );



    // Output section header actions
    const OutputActions = generatedPrompt ? (
        <ResultToolbar
            onExport={handleExport}
            onSave={currentPromptId ? handleUpdate : handleSaveNew}
            onSaveAs={currentPromptId ? handleSaveNew : undefined}
            contentToCopy={generatedPrompt}
            className="shadow-none border-none bg-transparent"
        />
    ) : null;

    // Determine Header Info based on active section
    const headerInfo = useMemo(() => {
        switch (selectedMenu) {
            case 'quick-start':
                return { title: 'Quick Start', subtitle: 'Start with a simple idea', rightContent: null };
            case 'frameworks':
                return { title: 'Frameworks', subtitle: 'Select a structural framework', rightContent: null };
            case 'tones':
                return { title: 'Tones', subtitle: 'Adjust the tone of voice', rightContent: null };
            case 'components':
                return { title: 'Prompt Components', subtitle: 'Fill in the framework fields', rightContent: ComponentsActions };
            case 'output':
                return { title: 'Generated Output', subtitle: 'Your AI-crafted prompt is ready', rightContent: OutputActions };
            default:
                return { title: menuItems.find(m => m.id === selectedMenu)?.label || 'Section', subtitle: '', rightContent: null };
        }
    }, [selectedMenu, ComponentsActions, OutputActions]);

    const renderContent = () => {
        switch (selectedMenu) {
            case 'quick-start':
                return <SimpleIdea isOpen={true} onToggle={() => { }} isSidebarOpen={isSidebarOpen} />;
            case 'frameworks':
                return <FrameworkSelector isOpen={true} onToggle={() => { }} isSidebarOpen={isSidebarOpen} />;
            case 'tones':
                return <ToneSelector isOpen={true} onToggle={() => { }} isSidebarOpen={isSidebarOpen} />;
            case 'components':
                return (
                    <div className="px-10 pb-6 pt-4 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        {currentFramework.fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="animate-in fade-in slide-in-from-bottom-2"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <InputField
                                    id={field.id}
                                    label={field.label}
                                    description={field.description}
                                    placeholder={field.placeholder}
                                    isReadOnly={activeFramework === 'costar' && field.id === 'tone'}
                                />
                            </div>
                        ))}
                    </div>
                );
            case 'output':
                return <PromptOutput />;
            default:
                return null;
        }
    };

    // Header buttons: Reset and Templates
    const HeaderButtons = (
        <div className="flex items-center gap-3">
            <Button
                variant="outline"
                onClick={() => {
                    if (fields && Object.keys(fields).length > 0 || simpleIdea || generatedPrompt) {
                        if (confirm('Are you sure you want to reset all fields and content?')) {
                            resetAll();
                            setSelectedMenu('quick-start'); // Reset to Quick Start section
                            toast.success('All fields reset', { icon: '🔄' });
                        }
                    } else {
                        toast('Nothing to reset', { icon: 'ℹ️' });
                    }
                }}
                leftIcon={<RotateCcw size={18} />}
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            >
                Reset
            </Button>
            <Button
                variant="outline"
                onClick={() => setIsTemplateDrawerOpen(true)}
                leftIcon={<Layout size={18} />}
            >
                Templates
            </Button>
        </div>
    );

    // Sidebar footer content
    const SidebarFooter = (
        <div className="space-y-6">
            {/* Active Context */}
            <div>
                <SectionHeader title="Active Context" />
                <div className="flex flex-col gap-3">
                    {/* Level 1: Technical Stats (LLM & Tokens) */}
                    <div className="flex flex-wrap gap-2 items-center w-full pb-3 border-b border-dashed border-slate-200">
                        {llmConfig && (
                            <Badge variant="outline" className="gap-1.5 min-w-max border-slate-200 bg-white text-slate-700 shadow-sm">
                                <ProviderIcon providerId={llmConfig.providerId} size={14} />
                                <span className="font-semibold capitalize">{llmConfig.providerId}</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-xs text-slate-500 max-w-[100px] truncate" title={llmConfig.model}>
                                    {llmConfig.model}
                                </span>
                            </Badge>
                        )}

                        <Badge variant="outline" className="gap-1 min-w-max border-emerald-200 bg-emerald-50 text-emerald-700">
                            <Tag size={12} />
                            In: {totalInputTokens}
                        </Badge>
                        {totalOutputTokens > 0 && (
                            <Badge variant="outline" className="gap-1 min-w-max border-amber-200 bg-amber-50 text-amber-700">
                                <Tag size={12} />
                                Out: {totalOutputTokens}
                            </Badge>
                        )}
                    </div>

                    {/* Level 2: Prompt Context Attributes */}
                    <div className="flex flex-wrap gap-2 items-center w-full">
                        <Badge
                            variant={complexity === 'direct' ? 'indigo' : complexity === 'contextual' ? 'orange' : 'pink'}
                            className="gap-1 capitalize"
                        >
                            {complexity === 'direct' && <Zap size={12} />}
                            {complexity === 'contextual' && <Layers size={12} />}
                            {complexity === 'detailed' && <Brain size={12} />}
                            {complexity}
                        </Badge>

                        <Badge variant="purple" className="gap-1">
                            <BookOpen size={12} />
                            {currentFramework.name}
                        </Badge>

                        {activeIndustryLabel && (
                            <Badge variant="blue" onRemove={clearIndustry} className="gap-1">
                                <Layout size={12} />
                                {activeIndustryLabel}
                            </Badge>
                        )}

                        {activeRoleLabel && (
                            <Badge variant="indigo" onRemove={clearRole} className="gap-1">
                                <Sparkles size={12} />
                                {activeRoleLabel}
                            </Badge>
                        )}
                        {activeToneLabels.map(tone => (
                            <Badge key={tone.value} variant="pink" onRemove={() => toggleTone(tone.value)} className="gap-1">
                                <Tag size={12} />
                                {tone.label}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            {/* Generate Button */}
            <div className="flex flex-col gap-3">
                <Button
                    onClick={generatePrompt}
                    disabled={isGenerating || !isFormValid}
                    isLoading={isGenerating}
                    className="w-full h-12 text-lg shadow-xl shadow-indigo-500/20"
                    leftIcon={!isGenerating && (generatedPrompt ? <RefreshCw size={20} /> : <Wand2 size={20} />)}
                >
                    {generatedPrompt ? 'Regenerate' : 'Generate'}
                </Button>

                <Button
                    onClick={assemblePrompt}
                    disabled={isGenerating || !isFormValid}
                    variant="outline"
                    className="w-full text-slate-500 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 border-dashed"
                    leftIcon={<Zap size={16} />}
                >
                    Instant Assemble
                </Button>
            </div>
        </div>
    );

    return (
        <PageTemplate
            title="Prompt Lab"
            subtitle="Build powerful AI prompts using proven frameworks"
            icon={FlaskConical}
            iconGradient="from-indigo-500 to-purple-600"
            shadowColor="shadow-indigo-500/30"
            rightContent={HeaderButtons}
            isSidebarOpen={isSidebarOpen}
            className="flex flex-col !p-0 !top-[120px]"
            headerClassName="!px-4"
            iconSize={20}
            titleClassName="text-lg"
            subtitleClassName="text-xs"
        >
            <div className="flex h-full">
                {/* Secondary Sidebar */}
                <div className="w-64 h-full flex-shrink-0 flex flex-col bg-white border-r border-slate-200">
                    <div className="p-2 pt-12 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="px-4 mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prompt Builder</span>
                        </div>
                        <nav className="space-y-1">
                            {displayMenuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = selectedMenu === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedMenu(item.id)}
                                        className={clsx(
                                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative text-left mx-auto",
                                            isActive
                                                ? "bg-blue-50 text-blue-700 font-bold"
                                                : "text-slate-600 hover:bg-slate-50 font-medium"
                                        )}
                                        style={{ width: '95%' }}
                                    >
                                        <Icon size={18} className={clsx(
                                            isActive ? "text-blue-600" : item.color
                                        )} />
                                        <span className={clsx(isActive ? "text-sm" : "text-sm")}>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                        {SidebarFooter}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 h-full flex flex-col min-w-0 bg-slate-50 overflow-hidden">
                    {/* Secondary Top Head Bar */}
                    <div className="shrink-0 h-20 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-[24px] z-10">
                        <div className="flex items-center gap-4">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                                {headerInfo.title}
                            </h2>
                            <div className="h-4 w-px bg-slate-200"></div>
                            <p className="text-xs text-slate-400">{headerInfo.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {headerInfo.rightContent}
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-[18px] py-4">
                        <div className="w-full mx-auto space-y-4">
                            {renderContent()}
                        </div>
                    </div>

                    {/* Secondary Fixed Footer - Showcase Prompt Score and Details */}
                    {generatedPrompt && selectedMenu === 'output' && (
                        <div className="shrink-0 bg-white border-t border-slate-200 px-4 py-2">
                            {qualityScore ? (
                                <QualityScore
                                    score={qualityScore}
                                    onImprove={improvePrompt}
                                    isImproving={isImproving}
                                />
                            ) : (
                                <div className="flex items-center justify-between p-2">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl animate-pulse"></div>
                                        <div>
                                            <p className="font-bold text-sm">Analysis Pending...</p>
                                            <p className="text-xs">Generating quality metrics</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => analyzeQuality()}
                                        variant="outline"
                                        size="sm"
                                        isLoading={isAnalyzing}
                                    >
                                        Retry Analysis
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <TemplateSelector isOpen={isTemplateDrawerOpen} onClose={() => setIsTemplateDrawerOpen(false)} />

            <SavePromptModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleSaveWithTitle}
            />
        </PageTemplate>
    );
};
