import React, { useState, useEffect, useRef } from 'react';
import { Search, Trash2, Clock, BookOpen, X, FileText, FolderOpen, Edit, Cpu, Download } from 'lucide-react';
import { promptDB, SavedPrompt, IndexedDBPromptStorage } from '@/services/database';
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
    const [isMigrating, setIsMigrating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { loadPrompt } = usePrompt();

    useEffect(() => {
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        const prompts = await promptDB.getAllPrompts();
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
                // Support both single prompt object or array of prompts
                const promptsToImport = Array.isArray(data) ? data : [data];

                let count = 0;
                for (const p of promptsToImport) {
                    if (!p.title || !p.prompt) continue; // Basic validation
                    const { id, ...promptData } = p;
                    // Ensure fields that need to be strings are strings
                    if (typeof promptData.fields === 'object') promptData.fields = JSON.stringify(promptData.fields);
                    if (typeof promptData.tones === 'object') promptData.tones = JSON.stringify(promptData.tones);
                    if (!promptData.createdAt) promptData.createdAt = new Date().toISOString();
                    if (!promptData.updatedAt) promptData.updatedAt = new Date().toISOString();
                    if (!promptData.framework) promptData.framework = 'custom';

                    await promptDB.savePrompt(promptData);
                    count++;
                }
                toast.success(`Imported ${count} prompts from file!`);
                loadPrompts();
            } catch (err) {
                console.error(err);
                toast.error("Failed to parse JSON file");
            }
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    };

    const handleMigrate = async () => {
        // First try to read from Browser Storage (IndexedDB)
        setIsMigrating(true);
        try {
            const browserDB = new IndexedDBPromptStorage();
            const oldPrompts = await browserDB.getAllPrompts();

            if (oldPrompts.length === 0) {
                // If nothing in IndexedDB, ask user for a file
                if (confirm("No data found in browser storage. Would you like to upload a JSON backup file instead?")) {
                    fileInputRef.current?.click();
                }
                setIsMigrating(false);
                return;
            }

            if (!confirm(`Found ${oldPrompts.length} prompts in browser storage. Import them now?`)) {
                setIsMigrating(false);
                return;
            }

            let count = 0;
            const currentPrompts = await promptDB.getAllPrompts();

            for (const p of oldPrompts) {
                // Simple duplicate check by Title
                const exists = currentPrompts.some(cp => cp.title === p.title && cp.createdAt === p.createdAt);
                if (!exists) {
                    // Remove ID to let new DB assign it
                    const { id, ...promptData } = p;
                    await promptDB.savePrompt(promptData);
                    count++;
                }
            }

            if (count > 0) {
                toast.success(`Imported ${count} prompts from storage!`);
                loadPrompts();
            } else {
                toast("All prompts are already imported.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Migration failed");
        } finally {
            setIsMigrating(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        const term = query.toLowerCase().trim();

        if (!term) {
            setSavedPrompts(allPrompts);
            return;
        }

        const filtered = allPrompts.filter(p => {
            const matches = (text?: string) => text?.toLowerCase().includes(term);

            // Lookup labels for better search (so searching "Healthcare" finds the industry even if ID is 'healthcare')
            const frameworkName = FRAMEWORKS.find(f => f.id === p.framework)?.name;
            const industryLabel = INDUSTRY_TEMPLATES.find(t => t.id === p.industry)?.label;
            const roleLabel = ROLE_PRESETS.find(t => t.id === p.role)?.label;

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
                matches(p.model)
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
            console.error(error);
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
            console.error(error);
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
            console.error(error);
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
                title: prompt.title,
                framework: prompt.framework,
                prompt: prompt.prompt,
                fields: JSON.parse(prompt.fields),
                tones: JSON.parse(prompt.tones),
                createdAt: prompt.createdAt
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

    const getProviderColor = (providerId?: string) => {
        switch (providerId) {
            case 'openai': return 'bg-emerald-600 text-white border-emerald-700';
            case 'anthropic': return 'bg-amber-600 text-white border-amber-700';
            case 'gemini': return 'bg-blue-600 text-white border-blue-700';
            case 'deepseek': return 'bg-violet-600 text-white border-violet-700';
            case 'grok': return 'bg-slate-900 text-white border-slate-950';
            case 'local': return 'bg-stone-600 text-white border-stone-700';
            case 'qwen': return 'bg-purple-600 text-white border-purple-700';
            case 'openrouter': return 'bg-fuchsia-600 text-white border-fuchsia-700';
            default: return 'bg-indigo-600 text-white border-indigo-700';
        }
    };

    // Search Bar as right content for header
    const SearchBar = (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={handleExportBackup}
                className="gap-2 text-slate-600 border-slate-300 hover:bg-slate-100"
                title="Export all prompts to JSON"
            >
                <Download size={16} />
                Export
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handleMigrate}
                disabled={isMigrating}
                className="gap-2 text-slate-600 border-slate-300 hover:bg-slate-100"
            >
                <FolderOpen size={16} />
                {isMigrating ? 'Importing...' : 'Import'}
            </Button>
            <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search prompts..."
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-slate-50"
                />
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
                iconGradient="from-emerald-500 to-teal-600"
                shadowColor="shadow-emerald-500/30"
                rightContent={SearchBar}
                isSidebarOpen={isSidebarOpen}
                className="flex flex-col !p-0"
                headerClassName="!px-4"
                iconSize={20}
                titleClassName="text-lg"
                subtitleClassName="text-xs"
            >
                <div className="h-full overflow-y-auto bg-slate-50 p-6">
                    {savedPrompts.length === 0 ? (
                        <Card className="text-center py-16">
                            <FileText size={56} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700 mb-2">No saved prompts yet</h3>
                            <p className="text-slate-500">Generate a prompt and save it from the Output section</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedPrompts.map((savedPrompt) => (
                                <Card
                                    key={savedPrompt.id}
                                    className={`cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 ${selectedPrompt?.id === savedPrompt.id ? 'ring-2 ring-emerald-500 shadow-lg' : ''
                                        }`}
                                    onClick={() => setSelectedPrompt(savedPrompt)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{savedPrompt.title}</h3>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => handleEdit(savedPrompt, e)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Edit prompt"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeletePrompt(savedPrompt.id!);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete prompt"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <Badge variant="purple" className="gap-1">
                                            <BookOpen size={10} />
                                            {getFrameworkName(savedPrompt.framework)}
                                        </Badge>
                                        {savedPrompt.industry && (
                                            <Badge variant="blue" className="gap-1">
                                                {INDUSTRY_TEMPLATES.find(t => t.id === savedPrompt.industry)?.label || savedPrompt.industry}
                                            </Badge>
                                        )}
                                        {savedPrompt.role && (
                                            <Badge variant="pink" className="gap-1">
                                                {ROLE_PRESETS.find(t => t.id === savedPrompt.role)?.label || savedPrompt.role}
                                            </Badge>
                                        )}
                                    </div>

                                    <p className="text-sm text-slate-600 line-clamp-3 mb-4">{savedPrompt.prompt}</p>

                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                                        <div className="flex items-center gap-2">
                                            {savedPrompt.providerId && (
                                                <Badge variant="default" className={`${getProviderColor(savedPrompt.providerId)} h-5 px-1.5 text-[10px] border gap-1`}>
                                                    <Cpu size={10} />
                                                    <span className="font-bold uppercase tracking-wider">{savedPrompt.providerId}</span>
                                                    {savedPrompt.model && (
                                                        <span className="opacity-75 font-normal border-l border-current pl-1 ml-1">
                                                            {savedPrompt.model.replace('claude-', '').replace('gpt-', '').substring(0, 12)}
                                                        </span>
                                                    )}
                                                </Badge>
                                            )}
                                            {savedPrompt.qualityScore && (
                                                <Badge variant="default" className="bg-emerald-500 h-5 px-1.5 text-[10px]">
                                                    {savedPrompt.qualityScore}/100
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <Clock size={12} />
                                            {formatDate(savedPrompt.createdAt)}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </PageTemplate>

            {/* Detail Modal */}
            {selectedPrompt && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={() => setSelectedPrompt(null)}>
                    <Card
                        className="max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
                        noPadding
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">{selectedPrompt.title}</h3>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <Badge variant="purple" className="gap-1">
                                        <BookOpen size={10} />
                                        {getFrameworkName(selectedPrompt.framework)}
                                    </Badge>

                                    {selectedPrompt.industry && (
                                        <Badge variant="blue" className="gap-1">
                                            {INDUSTRY_TEMPLATES.find(t => t.id === selectedPrompt.industry)?.label || selectedPrompt.industry}
                                        </Badge>
                                    )}

                                    {selectedPrompt.role && (
                                        <Badge variant="pink" className="gap-1">
                                            {ROLE_PRESETS.find(t => t.id === selectedPrompt.role)?.label || selectedPrompt.role}
                                        </Badge>
                                    )}

                                    {(() => {
                                        try {
                                            const tones = JSON.parse(selectedPrompt.tones || '[]');
                                            return Array.isArray(tones) && tones.map((tone: string) => {
                                                const toneObj = TONES.find(t => t.value === tone);
                                                return (
                                                    <Badge key={tone} variant="orange" className="opacity-90">
                                                        {toneObj?.label || tone}
                                                    </Badge>
                                                );
                                            });
                                        } catch (e) {
                                            return null;
                                        }
                                    })()}

                                    <span className="text-xs text-slate-400 ml-1">{formatDate(selectedPrompt.createdAt)}</span>
                                </div>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setSelectedPrompt(null)}
                            >
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative bg-slate-50/50">
                            <textarea
                                readOnly
                                value={selectedPrompt.prompt}
                                className="w-full h-full p-5 pb-10 bg-slate-50 rounded-xl border border-slate-100 text-slate-800 text-base leading-relaxed resize-none focus:outline-none shadow-sm custom-scrollbar"
                                style={{ minHeight: '400px' }}
                            />
                            <TextStats text={selectedPrompt.prompt} className="bottom-8 left-8 border-slate-200/50 bg-white/80" />
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-center">
                            <ResultToolbar
                                onExport={(format) => handleExport(selectedPrompt, format)}
                                contentToCopy={selectedPrompt.prompt}
                                className="shadow-none border-0 bg-transparent"
                            />
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
};
