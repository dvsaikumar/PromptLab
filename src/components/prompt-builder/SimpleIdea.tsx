import React, { useRef, useState } from 'react';
import { Sparkles, Upload, Loader2, FileText, X, Image as ImageIcon, File, Zap, Layers, Brain, BookTemplate, Search } from 'lucide-react';
import { usePrompt } from '@/contexts/PromptContext';
import { processFile } from '@/utils/fileProcessor';
import toast from 'react-hot-toast';
import { TextStats } from '@/components/ui/TextStats';
import { SelectionCard } from '@/components/ui/SelectionCard';
import { Card } from '@/components/ui/Card';
import { estimateTokens } from '@/utils/tokenEstimator';
import { LLMSelector } from '@/components/ui/LLMSelector';
import { PersonaSelector } from '@/components/ui/PersonaSelector';

type SimpleIdeaProps = {
    isOpen: boolean;
    onToggle: () => void;
    isSidebarOpen?: boolean;
};

export const SimpleIdea: React.FC<SimpleIdeaProps> = () => {
    const {
        simpleIdea, setSimpleIdea, selectedTones, attachments,
        addAttachment, removeAttachment, expandIdea, complexity,
        setComplexity, llmConfig, activePersonaId, setActivePersonaId
    } = usePrompt();
    const fileRef = useRef<HTMLInputElement>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [templateSearch, setTemplateSearch] = useState('');

    const TEMPLATES = [
        {
            label: 'Product Plan',
            icon: '📋',
            personaId: 'product-manager',
            text: "I need a Product Requirements Document (PRD) for [YOUR IDEA HERE].\n\nPlease include:\n1. Executive Summary\n2. Problem Statement\n3. Target Audience (Personas)\n4. User Stories (As a... I want to... So that...)\n5. Acceptance Criteria (Gherkin format)\n6. Technical Constraints\n7. Success Metrics (KPIs)\n\nAct as a Senior Product Manager."
        },
        {
            label: 'Feature List',
            icon: '👤',
            personaId: 'product-manager',
            text: "Generate a list of User Stories for [FEATURE NAME].\n\nFormat:\n- Title\n- As a [role], I want [action], so that [benefit].\n- Acceptance Criteria (Given/When/Then)\n- Priority (MoSCoW)"
        },
        {
            label: 'Fix a Bug',
            icon: '🐞',
            personaId: 'code-analyst',
            text: "Write a detailed Bug Report for the following issue:\n[DESCRIBE ISSUE]\n\nInclude:\n1. Steps to Reproduce\n2. Expected Behavior\n3. Actual Behavior\n4. Environment Details\n5. Severity/Priority Assessment"
        },
        {
            label: 'System Design',
            icon: '⚙️',
            personaId: 'code-analyst',
            text: "Create a Technical Specification for [SYSTEM/FEATURE].\n\nCover:\n1. Architecture Overview (Diagram description)\n2. API Endpoints (OpenAPI style)\n3. Database Schema (ERD description)\n4. Security Considerations\n5. Scalability Strategy"
        },
        {
            label: 'Email Sequence',
            icon: '📧',
            personaId: 'copywriter',
            text: "Draft a 5-email cold outreach sequence for [PRODUCT/SERVICE].\n\nTarget Audience: [TARGET]\nGoal: [GOAL]\n\nStructure:\n1. Hook/Value Prop\n2. Case Study/Social Proof\n3. Handling Objections\n4. Urgency/Offer\n5. Break-up Email\n\nTone: Professional but conversational."
        },
        {
            label: 'Social Post',
            icon: '📱',
            personaId: 'copywriter',
            text: "Write a viral LinkedIn/Twitter post about [TOPIC].\n\nStructure:\n- Hook (Stop scrolling)\n- Body (Value/Insight)\n- Bullets (Actionable tips)\n- Call to Action (Engagement)\n\nInclude engaging emojis and relevant hashtags."
        },
        {
            label: 'Data Query',
            icon: '📊',
            personaId: 'data-scientist',
            text: "I need a SQL query to [DESCRIBE GOAL].\n\nTables:\n- Users (id, email, signup_date...)\n- Orders (id, user_id, amount...)\n\nRequirements:\n- Efficient joins\n- Filter by [CRITERIA]\n- Group/Aggregate results\n\nExplain the logic."
        },
        {
            label: 'Study Roadmap',
            icon: '🎓',
            personaId: 'prompt-engineer',
            text: "Create a 4-week intensive learning roadmap for [TOPIC/SKILL].\n\nWeekly Structure:\n- Key Concepts\n- Practical Exercises\n- Recommended Resources (Docs/Videos)\n- capstone Project Idea\n\nGoal: Go from beginner to intermediate."
        }
    ];

    const filteredTemplates = TEMPLATES.filter(t =>
        t.label.toLowerCase().includes(templateSearch.toLowerCase()) ||
        t.text.toLowerCase().includes(templateSearch.toLowerCase())
    );

    const handleTemplateSelect = (template: typeof TEMPLATES[0]) => {
        setSimpleIdea(template.text);
        if (template.personaId) {
            setActivePersonaId(template.personaId);
        }
        setShowTemplates(false);
        setTemplateSearch('');
        toast.success(`Started with ${template.label}!`);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessingFile(true);
            try {
                const text = await processFile(file);
                addAttachment({
                    name: file.name,
                    content: text,
                    type: file.type
                });
                toast.success(`Attached ${file.name} `);
            } catch (err) {
                console.error("Failed to read file", err);
                toast.error("Failed to process file. Please try text, PDF, or DOCX.");
            } finally {
                setIsProcessingFile(false);
                if (fileRef.current) fileRef.current.value = '';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            expandIdea();
        }
    };

    const getIconForType = (type: string) => {
        if (type.startsWith('image/')) return <ImageIcon size={14} className="text-purple-500" />;
        if (type.includes('pdf')) return <FileText size={14} className="text-red-500" />;
        return <File size={14} className="text-blue-500" />;
    };

    return (
        <div className="px-3 pb-6 pt-4 custom-scrollbar bg-slate-50/50 animate-in fade-in slide-in-from-right-4 duration-300">
            <Card hoverLift className="mb-6 relative group overflow-hidden border-slate-200 shadow-sm transition-all text-slate-700">
                <div className="relative">
                    <textarea
                        value={simpleIdea}
                        onChange={(e) => setSimpleIdea(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe your goal... (e.g., 'Create a LinkedIn post about AI safety for CTOs') (Ctrl+Enter to Auto-Expand)"
                        className="w-full h-[calc(100vh-700px)] min-h-[120px] bg-transparent border-none focus:ring-0 resize-none transition-all placeholder:text-slate-300 text-base text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed outline-none p-4"
                        disabled={isProcessingFile}
                        spellCheck={false}
                    />

                    <TextStats text={simpleIdea} tokenCount={estimateTokens(simpleIdea, llmConfig?.model || '')} className="bottom-0 left-0 border-slate-200/50 bg-slate-50/80" />

                    <input
                        type="file"
                        ref={fileRef}
                        className="hidden"
                        accept=".txt,.md,.json,.csv,.docx,.pdf,image/*"
                        onChange={handleFileUpload}
                    />

                    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                        <div
                            className="relative"
                        >
                            <button
                                onClick={() => setShowTemplates(!showTemplates)}
                                className="flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 rounded-lg transition-all shadow-sm"
                                title="Use a Starter"
                            >
                                <BookTemplate size={16} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                                <span className="text-xs font-semibold ml-2">Idea Starters</span>
                            </button>

                            {showTemplates && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowTemplates(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-1 text-left max-h-[500px] overflow-y-auto custom-scrollbar">
                                        <div className="px-3 py-2 border-b border-slate-50 sticky top-0 bg-white z-10">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input
                                                    type="text"
                                                    value={templateSearch}
                                                    onChange={(e) => setTemplateSearch(e.target.value)}
                                                    placeholder="Search starters..."
                                                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border-none rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-600 placeholder:text-slate-400 transition-all"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        {filteredTemplates.length > 0 ? (
                                            filteredTemplates.map((t) => (
                                                <button
                                                    key={t.label}
                                                    onClick={() => handleTemplateSelect(t)}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2 group"
                                                >
                                                    <span className="text-base group-hover:scale-110 transition-transform">{t.icon}</span>
                                                    <div>
                                                        <div className="font-medium">{t.label}</div>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-6 text-center text-xs text-slate-400">
                                                No templates found.
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={isProcessingFile}
                            className="flex items-center px-3 py-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 rounded-lg transition-all shadow-sm disabled:opacity-50"
                            title="Attach context file"
                        >
                            {isProcessingFile ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <Upload size={16} />}
                            <span className="text-xs font-semibold ml-2">Attach</span>
                        </button>
                    </div>
                </div>
            </Card>

            {/* Attachments List */}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
                    {attachments.map((file) => (
                        <div key={file.name} className="flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm group hover:border-indigo-300 transition-colors">
                            {getIconForType(file.type)}
                            <span className="text-xs font-medium text-slate-700 max-w-[150px] truncate" title={file.name}>
                                {file.name}
                            </span>
                            <button
                                onClick={() => removeAttachment(file.name)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                title="Remove file"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Configuration Helpers */}
            <div className="mb-6 space-y-4">

                {/* Top Row: Engine & Persona */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* AI Model Selector */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1">
                        <LLMSelector
                            onOpenSettings={() => window.dispatchEvent(new Event('open-settings-modal'))}
                            className="bg-transparent border-0 shadow-none !p-0"
                        />
                    </div>

                    {/* Persona Selector */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1">
                        <PersonaSelector
                            activePersonaId={activePersonaId}
                            setActivePersonaId={setActivePersonaId}
                            className="bg-transparent border-0 shadow-none !p-0"
                        />
                    </div>
                </div>

                {/* Complexity Selector */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <SelectionCard
                        title="Direct & Simple"
                        description="Concise outputs"
                        icon={<Zap size={24} />}
                        activeColor="green"
                        isSelected={complexity === 'direct'}
                        onClick={() => setComplexity('direct')}
                        showActiveIndicator
                        className="h-full"
                    />

                    <SelectionCard
                        title="Contextual"
                        description="Organized flow"
                        icon={<Layers size={24} />}
                        activeColor="orange"
                        isSelected={complexity === 'contextual'}
                        onClick={() => setComplexity('contextual')}
                        showActiveIndicator
                        className="h-full"
                    />

                    <SelectionCard
                        title="Detailed"
                        description="In-depth analysis"
                        icon={<Brain size={24} />}
                        activeColor="red"
                        isSelected={complexity === 'detailed'}
                        onClick={() => setComplexity('detailed')}
                        showActiveIndicator
                        className="h-full"
                    />
                </div>
            </div>

            {/* Tip */}
            {
                !selectedTones.length && simpleIdea.length > 5 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100 text-amber-700 animate-in fade-in">
                        <Sparkles size={14} className="text-amber-500" />
                        <p className="text-xs font-semibold">Pro Tip: Select a tone below to enable smart auto-expansion.</p>
                    </div>
                )
            }
        </div>
    );
};
