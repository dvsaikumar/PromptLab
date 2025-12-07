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
import { PageHeader } from '@/components/ui/PageHeader';
import { SecondarySidebar } from '@/components/ui/SecondarySidebar';
import { ContentPanelHeader } from '@/components/ui/ContentPanelHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';

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
        generatedPrompt, improvePrompt, isImproving,
        activeIndustry, activeRole, selectedTones, toggleTone, clearIndustry, clearRole,
        requestChainOfThought, toggleChainOfThought, simpleIdea, expandIdea, isExpanding,
        resetAll, complexity, currentPromptId
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
                updatedAt: new Date().toISOString()
            });
            toast.success('Changes saved!');
        } catch (error) {
            toast.error('Failed to update prompt.');
            console.error(error);
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
                updatedAt: new Date().toISOString()
            });
            toast.success(`✓ "${title}" saved successfully!`);

            // Reset all fields after saving
            resetAll();
        } catch (error) {
            toast.error('Failed to save prompt.');
            console.error(error);
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
                    <>
                        <ContentPanelHeader
                            title="Prompt Components"
                            subtitle="Fill in the framework fields"
                            icon={FileText}
                            iconGradient="from-violet-500 to-purple-500"
                            shadowColor="shadow-purple-500/20"
                            rightContent={ComponentsActions}
                            isSidebarOpen={isSidebarOpen}
                        />
                        <div className="fixed top-[232px] bottom-14 right-0 overflow-y-auto pl-10 pr-10 pb-6 pt-4 space-y-4 custom-scrollbar bg-slate-50/50 animate-in fade-in slide-in-from-right-4 duration-300 lg:left-[352px] left-72" style={{ left: isSidebarOpen ? '544px' : undefined }}>
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
                                        isReadOnly={activeFramework === 'costar' && field.id === 'tone'}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                );
            case 'output':
                return (
                    <>
                        <ContentPanelHeader
                            title="Generated Output"
                            subtitle="Your AI-crafted prompt is ready"
                            icon={Wand2}
                            iconGradient="from-green-500 to-emerald-500"
                            shadowColor="shadow-emerald-500/20"

                            isSidebarOpen={isSidebarOpen}
                        />
                        <div className="fixed top-[232px] bottom-14 right-0 overflow-y-auto pl-10 pr-10 pb-6 pt-4 custom-scrollbar bg-slate-50/50 animate-in fade-in slide-in-from-right-4 duration-300 lg:left-[352px] left-72" style={{ left: isSidebarOpen ? '544px' : undefined }}>
                            <PromptOutput
                                onExport={handleExport}
                                onSave={currentPromptId ? handleUpdate : handleSaveNew}
                                onSaveAs={currentPromptId ? handleSaveNew : undefined}
                            />
                        </div>
                    </>
                );
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
                <div className="flex flex-wrap gap-2">
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

            {/* Quality Score */}
            {generatedPrompt && qualityScore && (
                <QualityScore
                    score={qualityScore}
                    onImprove={improvePrompt}
                    isImproving={isImproving}
                />
            )}

            {/* Generate Button */}
            <Button
                onClick={generatePrompt}
                disabled={isGenerating || !isFormValid}
                isLoading={isGenerating}
                className="w-full h-12 text-lg shadow-xl shadow-indigo-500/20"
                leftIcon={!isGenerating && (generatedPrompt ? <RefreshCw size={20} /> : <Wand2 size={20} />)}
            >
                {generatedPrompt ? 'Regenerate' : 'Generate'}
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Fixed Page Header */}
            <PageHeader
                title="Prompt Lab"
                subtitle="Build powerful AI prompts using proven frameworks"
                icon={FlaskConical}
                iconGradient="from-indigo-500 to-purple-600"
                shadowColor="shadow-indigo-500/30"
                rightContent={HeaderButtons}
                isSidebarOpen={isSidebarOpen}
            />

            {/* Fixed Secondary Sidebar - Build Steps */}
            <SecondarySidebar title="Build Steps" footer={SidebarFooter} isSidebarOpen={isSidebarOpen}>
                <nav className="space-y-2">
                    {displayMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = selectedMenu === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setSelectedMenu(item.id)}
                                className={clsx(
                                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden text-left",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-md transform scale-[1.02]"
                                        : "text-slate-600 hover:bg-slate-50 hover:translate-x-1"
                                )}
                            >
                                <Icon size={20} className={clsx(
                                    "transition-transform group-hover:scale-110",
                                    isActive ? "text-white" : item.color
                                )} />
                                <span className="font-bold text-[18px]">{item.label}</span>
                                {isActive && (
                                    <div className="absolute right-3 w-2 h-2 bg-white rounded-full animate-pulse" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </SecondarySidebar>

            {/* Main Content Area - renders fixed positioned content */}
            <div>
                {renderContent()}
            </div>

            <TemplateSelector isOpen={isTemplateDrawerOpen} onClose={() => setIsTemplateDrawerOpen(false)} />

            <SavePromptModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleSaveWithTitle}
            />
        </div>
    );
};
