import React, { useState, useEffect, useRef } from 'react';
import { Search, Trash2, Clock, BookOpen, X, FileText, FolderOpen, Edit, Download, Brain, Sparkles, PenTool, Zap, Microscope, Link2 } from 'lucide-react';
import { promptDB, SavedPrompt } from '@/services/database';
import { vectorDb } from '@/services/vectorDbService';
import { FRAMEWORKS, TONES, INDUSTRY_TEMPLATES, ROLE_PRESETS } from '@/constants';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageTemplate } from '@/components/ui/PageTemplate';
import { usePrompt } from '@/contexts/PromptContext';
import { ResultToolbar } from '@/components/ui/ResultToolbar';
import { TextStats } from '@/components/ui/TextStats';

interface SavedPromptsLibraryProps {
    isSidebarOpen?: boolean;
}

interface SavedPromptsLibraryPropsExtended extends SavedPromptsLibraryProps {
    onNavigate?: (page: string, section?: string) => void;
}

export const SavedPromptsLibrary: React.FC<SavedPromptsLibraryPropsExtended> = ({ isSidebarOpen = false, onNavigate }) => {
    const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
    const [allPrompts, setAllPrompts] = useState<SavedPrompt[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPrompt, setSelectedPrompt] = useState<SavedPrompt | null>(null);
    const [isSemantic, setIsSemantic] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { loadPrompt } = usePrompt();

    useEffect(() => {
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        const prompts = await promptDB.getAllPrompts();
        // Sort by newest first
        prompts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAllPrompts(prompts);
        setSavedPrompts(prompts);
    };

    const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);
                const promptsToImport = Array.isArray(data) ? data : [data];

                let count = 0;
                for (const p of promptsToImport) {
                    if (!p.title || !p.prompt) continue;
                    const { id, ...promptData } = p;
                    if (typeof promptData.fields === 'object') promptData.fields = JSON.stringify(promptData.fields);
                    if (typeof promptData.tones === 'object') promptData.tones = JSON.stringify(promptData.tones);
                    if (!promptData.createdAt) promptData.createdAt = new Date().toISOString();
                    if (!promptData.updatedAt) promptData.updatedAt = new Date().toISOString();
                    if (!promptData.framework) promptData.framework = 'custom';

                    // Default imported prompts to 'lab' if source missing
                    if (!promptData.source) promptData.source = 'lab';

                    await promptDB.savePrompt(promptData);

                    if (vectorDb.isAvailable()) {
                        try {
                            const vector = vectorDb.generateDummyEmbedding(promptData.prompt);
                            await vectorDb.addDocuments('prompts', [{
                                title: promptData.title,
                                text: promptData.prompt,
                                category: promptData.framework,
                                vector,
                                timestamp: promptData.createdAt
                            }]);
                        } catch (e) {
                            console.warn("Vector index failed for import", e);
                        }
                    }
                    count++;
                }
                toast.success(`Imported ${count} prompts successfully`);
                loadPrompts();
            } catch (err) {
                console.error(err);
                toast.error("Failed to parse JSON file");
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        const term = query.toLowerCase().trim();

        if (!term) {
            setSavedPrompts(allPrompts);
            return;
        }

        if (isSemantic && vectorDb.isAvailable()) {
            setIsSearching(true);
            try {
                const embedding = vectorDb.generateDummyEmbedding(query);
                const results = await vectorDb.search('prompts', embedding, 10);
                if (results && results.length > 0) {
                    const matchedtexts = new Set(results.map((r: any) => r.text));
                    const filtered = allPrompts.filter(p => matchedtexts.has(p.prompt));
                    setSavedPrompts(filtered);
                    setIsSearching(false);
                    return;
                }
            } catch (e) {
                console.error("Vector search failed", e);
            }
            setIsSearching(false);
        }

        const filtered = allPrompts.filter(p => {
            const matches = (text?: string) => text?.toLowerCase().includes(term);
            const frameworkName = FRAMEWORKS.find(f => f.id === p.framework)?.name;
            const industryLabel = INDUSTRY_TEMPLATES.find(t => t.id === p.industry)?.label;
            const roleLabel = ROLE_PRESETS.find(t => t.id === p.role)?.label;
            const sourceLabel = getSourceStyle(p.source).label;

            let toneKeywords = '';
            try {
                const tones = JSON.parse(p.tones || '[]');
                if (Array.isArray(tones)) {
                    toneKeywords = tones.map((t: string) => {
                        const obj = TONES.find(ref => ref.value === t);
                        return (obj?.label || t) + ' ' + (obj?.value || '');
                    }).join(' ');
                }
            } catch (e) { }

            return (
                matches(p.title) ||
                matches(p.prompt) ||
                matches(p.framework) ||
                matches(frameworkName) ||
                matches(p.industry) ||
                matches(industryLabel) ||
                matches(p.role) ||
                matches(roleLabel) ||
                matches(toneKeywords) ||
                matches(p.providerId) ||
                matches(p.model) ||
                matches(sourceLabel)
            );
        });
        setSavedPrompts(filtered);
    };

    const handleDeletePrompt = async (id: number) => {
        if (!confirm('Are you sure you want to delete this prompt?')) return;
        try {
            await promptDB.deletePrompt(id);
            toast.success('Prompt deleted');
            loadPrompts();
            if (selectedPrompt?.id === id) {
                setSelectedPrompt(null);
            }
        } catch (error) {
            toast.error('Failed to delete prompt');
        }
    };

    const handleEdit = async (savedPrompt: SavedPrompt, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await loadPrompt(savedPrompt);
            if (onNavigate) {
                onNavigate('prompt-lab', 'quick-start');
            }
            toast.success('Prompt loaded into editor');
        } catch (error) {
            toast.error('Failed to load prompt');
        }
    };

    const handleExportBackup = async () => {
        try {
            const prompts = await promptDB.getAllPrompts();
            if (prompts.length === 0) {
                toast.error("No prompts to export");
                return;
            }
            const backupData = JSON.stringify(prompts, null, 2);
            const blob = new Blob([backupData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prompt_forge_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(`Exported ${prompts.length} prompts`);
        } catch (error) {
            toast.error("Export failed");
        }
    };

    const handleExport = (prompt: SavedPrompt, format: 'md' | 'txt' | 'json') => {
        let content = '';
        let mime = '';
        let filename = prompt.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        if (format === 'md') {
            content = `# ${prompt.title}\n\n**Framework:** ${getFrameworkName(prompt.framework)}\n\n**Created:** ${formatDate(prompt.createdAt)}\n\n## Prompt\n\n${prompt.prompt}`;
            mime = 'text/markdown';
        } else if (format === 'txt') {
            content = prompt.prompt;
            mime = 'text/plain';
        } else if (format === 'json') {
            content = JSON.stringify({
                ...prompt,
                fields: JSON.parse(prompt.fields || '{}'),
                tones: JSON.parse(prompt.tones || '[]'),
            }, null, 2);
            mime = 'application/json';
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
        toast.success(`Downloaded as ${format.toUpperCase()}`);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getFrameworkName = (frameworkId: string) => {
        return FRAMEWORKS.find(f => f.id === frameworkId)?.name || frameworkId;
    };

    const getSourceStyle = (source?: string) => {
        switch (source) {
            case 'compiler':
                return {
                    label: 'Prompt Compiler',
                    icon: Zap,
                    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
                    border: 'border-amber-200',
                    accent: 'text-amber-600',
                    badge: 'bg-amber-100 text-amber-700 border-amber-200',
                    ring: 'ring-amber-500'
                };
            case 'reverse':
                return {
                    label: 'Reverse Engineering',
                    icon: Microscope,
                    bg: 'bg-gradient-to-br from-violet-50 to-purple-50',
                    border: 'border-violet-200',
                    accent: 'text-violet-600',
                    badge: 'bg-violet-100 text-violet-700 border-violet-200',
                    ring: 'ring-violet-500'
                };
            case 'chain':
                return {
                    label: 'Chain Reaction',
                    icon: Link2,
                    bg: 'bg-gradient-to-br from-fuchsia-50 to-pink-50',
                    border: 'border-fuchsia-200',
                    accent: 'text-fuchsia-600',
                    badge: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
                    ring: 'ring-fuchsia-500'
                };
            case 'lab':
            default:
                return {
                    label: 'Prompt Lab',
                    icon: PenTool,
                    bg: 'bg-gradient-to-br from-slate-50 to-indigo-50/30',
                    border: 'border-indigo-100',
                    accent: 'text-indigo-600',
                    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
                    ring: 'ring-indigo-500'
                };
        }
    };

    const SearchBar = (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 text-slate-600 border-slate-300 hover:bg-slate-100"
            >
                <FolderOpen size={16} />
                Import
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handleExportBackup}
                className="gap-2 text-slate-600 border-slate-300 hover:bg-slate-100"
                title="Backup Library"
            >
                <Download size={16} />
                Backup
            </Button>

            <div className="relative w-96 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isSemantic ? 'text-purple-500' : 'text-slate-400'}`} size={18} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder={isSemantic ? "Semantic Search (Concept)..." : "Search prompts..."}
                        className={`w-full pl-11 pr-4 py-2 text-sm border rounded-xl focus:ring-2 transition-all bg-white shadow-sm ${isSemantic ? 'border-purple-200 focus:ring-purple-500 focus:border-purple-500' : 'border-slate-200 focus:ring-indigo-500 focus:border-indigo-500'}`}
                    />
                    {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Sparkles className="w-4 h-4 text-purple-500 animate-spin" />
                        </div>
                    )}
                </div>
                <button
                    onClick={() => {
                        setIsSemantic(!isSemantic);
                        setSavedPrompts(allPrompts);
                        setSearchQuery('');
                    }}
                    className={`p-2 rounded-xl border transition-all ${isSemantic ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
                    title="Toggle Semantic Search"
                >
                    <Brain size={20} />
                </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json,.txt" onChange={handleImportFile} />
        </div>
    );

    return (
        <>
            <PageTemplate
                title="Saved Prompts"
                subtitle="Manage and export your prompt library"
                icon={FolderOpen}
                iconGradient="from-indigo-500 to-violet-600"
                shadowColor="shadow-indigo-500/30"
                rightContent={SearchBar}
                isSidebarOpen={isSidebarOpen}
                className="flex flex-col !p-0"
                headerClassName="!px-6 !py-4"
                iconSize={24}
            >
                <div className="h-full overflow-y-auto bg-slate-50/50 p-6">
                    {savedPrompts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                <FileText size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No saved prompts yet</h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Generate amazing prompts using the text editor, compiler, or reverse engineering tools and save them here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {savedPrompts.map((savedPrompt) => {
                                const style = getSourceStyle(savedPrompt.source);
                                const SourceIcon = style.icon;

                                return (
                                    <div
                                        key={savedPrompt.id}
                                        onClick={() => setSelectedPrompt(savedPrompt)}
                                        className={`group relative flex flex-col bg-white rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-xl hover:-translate-y-1 ${selectedPrompt?.id === savedPrompt.id ? `ring-2 ${style.ring} shadow-lg` : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        {/* Colored Header Stripe */}
                                        <div className={`h-1.5 w-full ${style.bg.replace('bg-gradient-to-br', 'bg-gradient-to-r')}`} />

                                        <div className="p-5 flex flex-col h-full">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-lg ${style.bg} border-0`}>
                                                        <SourceIcon size={16} className={style.accent} />
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider border px-1.5 py-0.5 rounded-md ${style.badge}`}>
                                                        {style.label}
                                                    </span>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                    <button
                                                        onClick={(e) => handleEdit(savedPrompt, e)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (savedPrompt.id) handleDeletePrompt(savedPrompt.id);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Title & Desc */}
                                            <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                                {savedPrompt.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 line-clamp-3 mb-4 leading-relaxed flex-1">
                                                {savedPrompt.prompt}
                                            </p>

                                            {/* Footer Tags */}
                                            <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-slate-50">
                                                <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200 bg-slate-50/50">
                                                    <BookOpen size={10} className="mr-1" />
                                                    {getFrameworkName(savedPrompt.framework)}
                                                </Badge>

                                                {savedPrompt.role && (
                                                    <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200 bg-slate-50/50">
                                                        {ROLE_PRESETS.find(t => t.id === savedPrompt.role)?.label || savedPrompt.role}
                                                    </Badge>
                                                )}

                                                <div className="ml-auto flex items-center text-[10px] text-slate-400 gap-1">
                                                    <Clock size={10} />
                                                    {new Date(savedPrompt.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </PageTemplate>


            {/* Detailed View Modal */}
            {selectedPrompt && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200" onClick={() => setSelectedPrompt(null)}>
                    <Card
                        className="max-w-4xl w-full h-[85vh] overflow-hidden flex flex-col shadow-2xl border-0 ring-1 ring-white/20"
                        noPadding
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Dynamic Header based on Source */}
                        <div className={`flex items-center justify-between p-6 border-b ${getSourceStyle(selectedPrompt.source).bg}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-white shadow-sm border ${getSourceStyle(selectedPrompt.source).border}`}>
                                    {React.createElement(getSourceStyle(selectedPrompt.source).icon, {
                                        size: 24,
                                        className: getSourceStyle(selectedPrompt.source).accent
                                    })}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-bold text-slate-900">{selectedPrompt.title}</h3>
                                        <Badge className={`text-[10px] font-bold ${getSourceStyle(selectedPrompt.source).badge}`}>
                                            {getSourceStyle(selectedPrompt.source).label}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(selectedPrompt.createdAt)}</span>
                                        <span>•</span>
                                        <span className="font-medium text-slate-700">{getFrameworkName(selectedPrompt.framework)}</span>
                                    </div>
                                </div>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setSelectedPrompt(null)}
                                className="text-slate-500 hover:bg-black/5 rounded-full"
                            >
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex overflow-hidden bg-slate-50">
                            {/* Metadata Sidebar (Left) */}
                            <div className="w-80 bg-white border-r border-slate-200 p-6 overflow-y-auto hidden md:block custom-scrollbar">
                                <div className="space-y-8">

                                    {/* 1. Raw Input / Simple Idea */}
                                    {selectedPrompt.simpleIdea && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-1 h-3 bg-amber-400 rounded-full"></div>
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Raw Input</h4>
                                            </div>
                                            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100 text-sm text-slate-700 italic shadow-sm">
                                                "{selectedPrompt.simpleIdea}"
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Framework Fields (CO-STAR, etc) */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                {getFrameworkName(selectedPrompt.framework)} Parameters
                                            </h4>
                                        </div>
                                        <div className="space-y-3">
                                            {(() => {
                                                try {
                                                    const fields = JSON.parse(selectedPrompt.fields || '{}');
                                                    const entries = Object.entries(fields);

                                                    if (entries.length === 0) {
                                                        return <div className="text-xs text-slate-400 italic">No parameters recorded</div>;
                                                    }

                                                    return entries.map(([key, value]) => {
                                                        if (!value || (typeof value === 'string' && !value.trim())) return null;
                                                        // Beautify keys (e.g. "optimizationMetric" -> "Optimization Metric")
                                                        const label = key
                                                            .replace(/([A-Z])/g, ' $1')
                                                            .replace(/^./, str => str.toUpperCase())
                                                            .replace(/_/g, ' ');

                                                        return (
                                                            <div key={key} className="group/field relative">
                                                                <div className="flex items-baseline justify-between mb-1">
                                                                    <span className="text-[10px] font-bold text-indigo-400 uppercase">{label}</span>
                                                                </div>
                                                                <div className="text-sm text-slate-600 leading-snug bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100 group-hover/field:border-indigo-200 group-hover/field:bg-indigo-50/30 transition-all cursor-text break-words whitespace-pre-wrap">
                                                                    {String(value)}
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                } catch (e) { return <span className="text-xs text-red-400">Error parsing inputs</span>; }
                                            })()}
                                        </div>
                                    </div>

                                    {/* 3. Global Context (Industry/Role) */}
                                    {(selectedPrompt.industry || selectedPrompt.role) && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-1 h-3 bg-teal-500 rounded-full"></div>
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Environment</h4>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {selectedPrompt.industry && (
                                                    <div className="px-3 py-2 rounded-lg bg-teal-50/50 border border-teal-100 flex items-center justify-between">
                                                        <span className="text-xs text-teal-600 font-medium">Industry</span>
                                                        <span className="text-xs font-bold text-teal-800">
                                                            {INDUSTRY_TEMPLATES.find(t => t.id === selectedPrompt.industry)?.label || selectedPrompt.industry}
                                                        </span>
                                                    </div>
                                                )}
                                                {selectedPrompt.role && (
                                                    <div className="px-3 py-2 rounded-lg bg-cyan-50/50 border border-cyan-100 flex items-center justify-between">
                                                        <span className="text-xs text-cyan-600 font-medium">Role</span>
                                                        <span className="text-xs font-bold text-cyan-800">
                                                            {ROLE_PRESETS.find(t => t.id === selectedPrompt.role)?.label || selectedPrompt.role}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. Tones */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1 h-3 bg-pink-500 rounded-full"></div>
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tones</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(() => {
                                                try {
                                                    const tones = JSON.parse(selectedPrompt.tones || '[]');
                                                    if (!Array.isArray(tones) || tones.length === 0) {
                                                        return <span className="text-xs text-slate-400 italic">No tones selected</span>;
                                                    }
                                                    return tones.map((tone: string) => (
                                                        <Badge key={tone} variant="pink" className="text-[10px] px-2 py-0.5">
                                                            {TONES.find(t => t.value === tone)?.label || tone}
                                                        </Badge>
                                                    ));
                                                } catch (e) { return null; }
                                            })()}
                                        </div>
                                    </div>

                                    {/* 5. Metrics */}
                                    {selectedPrompt.qualityScore !== undefined && (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quality Metrics</h4>
                                            </div>
                                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Prompt Score</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-2xl font-black text-emerald-600">{selectedPrompt.qualityScore}</span>
                                                        <span className="text-xs text-emerald-400 font-bold">/100</span>
                                                    </div>
                                                </div>
                                                <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        style={{ width: `${selectedPrompt.qualityScore}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Main Prompt (Right) */}
                            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                                <div className="flex-1 relative rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                                    <div className="absolute top-0 left-0 right-0 h-8 bg-slate-50 border-b border-slate-100 px-4 flex items-center justify-between z-10">
                                        <span className="text-xs font-mono text-slate-400">PROMPT PREVIEW</span>
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                        </div>
                                    </div>
                                    <textarea
                                        readOnly
                                        value={selectedPrompt.prompt}
                                        className="w-full h-full p-6 pt-12 resize-none focus:outline-none text-slate-700 font-mono text-sm leading-relaxed custom-scrollbar"
                                    />
                                    <div className="absolute bottom-4 right-4">
                                        <TextStats text={selectedPrompt.prompt} className="bg-white/80 backdrop-blur border-slate-200 shadow-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 bg-white flex justify-center gap-3">
                            <ResultToolbar
                                onExport={(format) => handleExport(selectedPrompt, format)}
                                contentToCopy={selectedPrompt.prompt}
                                className="shadow-none border-0"
                            />
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
};
