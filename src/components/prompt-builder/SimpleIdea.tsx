import React, { useRef, useState } from 'react';
import { Sparkles, Upload, Loader2, FileText, X, Image as ImageIcon, File, Zap, Layers, Brain, BookTemplate, Search, Lightbulb, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { usePrompt } from '@/contexts/PromptContext';
import { processFile } from '@/utils/fileProcessor';
import toast from 'react-hot-toast';
import { TextStats } from '@/components/ui/TextStats';
import { SelectionCard } from '@/components/ui/SelectionCard';
import { estimateTokens } from '@/utils/tokenEstimator';


import { Button } from '@/components/ui/Button';

export interface SimpleIdeaProps {
    isOpen: boolean;
    onToggle: () => void;
    isSidebarOpen?: boolean;
    hideHeader?: boolean;
}

export const SimpleIdea: React.FC<SimpleIdeaProps> = ({ hideHeader = false }) => {
    const {
        simpleIdea, setSimpleIdea, selectedTones, attachments,
        addAttachment, removeAttachment, expandIdea, complexity,
        setComplexity, llmConfig, setActivePersonaId, generateSuggestions
    } = usePrompt();
    const fileRef = useRef<HTMLInputElement>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [templateSearch, setTemplateSearch] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    const handleSuggestion = async () => {
        setIsLoadingSuggestions(true);
        const result = await generateSuggestions('simpleIdea');
        setSuggestions(result);
        setIsLoadingSuggestions(false);
    };

    const applySuggestion = (text: string) => {
        setSimpleIdea(text);
        setSuggestions([]);
    };

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
        <>
            {/* Main Input Area - Styled to match ReversePromptPage and Configuration Grid */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between mb-2">
                    {!hideHeader && (
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide opacity-90">
                            <div className="p-1 rounded-md bg-amber-100 text-amber-600">
                                <Sparkles size={14} />
                            </div>
                            Core Input
                        </h3>
                    )}
                    {/* Make sure we take up space if header is hidden or keep alignment */}
                    {hideHeader && <div></div>}

                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSuggestion}
                            disabled={simpleIdea.length < 5 || isLoadingSuggestions}
                            className="gap-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-bold"
                            leftIcon={isLoadingSuggestions ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        >
                            AI Enhance
                        </Button>
                        <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowTemplates(!showTemplates)}
                                className="gap-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                                rightIcon={<BookTemplate size={14} />}
                            >
                                Starters
                            </Button>

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

                        <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileRef.current?.click()}
                            disabled={isProcessingFile}
                            className="gap-2"
                        >
                            {isProcessingFile ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Attach
                        </Button>
                    </div>
                </div>

                {/* Attachments List (Moved Top) */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {attachments.map((file) => (
                            <div key={file.name} className="flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg shadow-sm group hover:border-indigo-300 transition-colors">
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

                <div className="relative group flex-1 flex flex-col min-h-0">
                    <textarea
                        value={simpleIdea}
                        onChange={(e) => setSimpleIdea(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe your goal... (e.g., 'Create a LinkedIn post about AI safety for CTOs') (Ctrl+Enter to Auto-Expand)"
                        className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono text-sm leading-relaxed p-3 text-slate-700 placeholder:text-slate-400"
                        disabled={isProcessingFile}
                        spellCheck={false}
                    />

                    <TextStats text={simpleIdea} tokenCount={estimateTokens(simpleIdea, llmConfig?.model || '')} className="bottom-3 left-4 border-slate-200/50 bg-slate-50/80 scale-90" />

                    {/* AI Assistant Button (Moved to Header) */}

                    {/* Suggestions Panel */}
                    {suggestions.length > 0 && (
                        <div className="absolute bottom-12 left-0 right-0 z-30 mx-4 mb-2 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-indigo-100 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Sparkles size={12} /> Refine Idea
                                </span>
                                <button onClick={() => setSuggestions([])} className="text-slate-400 hover:text-indigo-500 transition-colors p-1 hover:bg-indigo-50 rounded-lg">
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => applySuggestion(s)}
                                        className="w-full text-left p-2.5 bg-indigo-50/50 hover:bg-indigo-100/50 border border-indigo-100 hover:border-indigo-200 rounded-lg text-sm text-slate-700 transition-all group/item"
                                    >
                                        <div className="flex gap-2">
                                            <span className="text-indigo-400 font-bold text-xs mt-0.5">{i + 1}</span>
                                            <span className="leading-relaxed text-xs">{s}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    ref={fileRef}
                    className="hidden"
                    accept=".txt,.md,.json,.csv,.docx,.pdf,image/*"
                    onChange={handleFileUpload}
                />

                {/* Tip (Inside Container) */}
                {!selectedTones.length && simpleIdea.length > 5 && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100 text-amber-700 animate-in fade-in">
                        <Sparkles size={14} className="text-amber-500" />
                        <p className="text-xs font-semibold">Pro Tip: Select a tone above to enable smart auto-expansion.</p>
                    </div>
                )}
            </div>
        </>
    );
};
