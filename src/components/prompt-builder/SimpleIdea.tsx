import React, { useRef, useState } from 'react';
import { Sparkles, Upload, Loader2, FileText, X, Image as ImageIcon, File, Zap, Layers, Brain } from 'lucide-react';
import { usePrompt } from '@/contexts/PromptContext';
import { processFile } from '@/utils/fileProcessor';
import toast from 'react-hot-toast';
import { ContentPanelHeader } from '@/components/ui/ContentPanelHeader';
import { TextStats } from '@/components/ui/TextStats';
import { SelectionCard } from '@/components/ui/SelectionCard';

type SimpleIdeaProps = {
    isOpen: boolean;
    onToggle: () => void;
    isSidebarOpen?: boolean;
};

export const SimpleIdea: React.FC<SimpleIdeaProps> = ({ isSidebarOpen = false }) => {
    const { simpleIdea, setSimpleIdea, selectedTones, attachments, addAttachment, removeAttachment, expandIdea, complexity, setComplexity } = usePrompt();
    const fileRef = useRef<HTMLInputElement>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);



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
                toast.success(`Attached ${file.name}`);
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
            {/* Fixed Content Panel Header */}
            <ContentPanelHeader
                title="Quick Start"
                subtitle="Describe your idea, we'll do the rest"
                icon={Sparkles}
                iconGradient="from-amber-500 to-orange-500"
                shadowColor="shadow-orange-500/20"
                isSidebarOpen={isSidebarOpen}
            />

            {/* Content - Fixed position below ContentPanelHeader */}
            <div
                className="fixed top-[232px] bottom-14 right-0 overflow-y-auto pl-10 pr-10 pb-6 pt-4 custom-scrollbar bg-slate-50/50 animate-in fade-in slide-in-from-right-4 duration-300 lg:left-[352px] left-72"
                style={{ left: isSidebarOpen ? '544px' : undefined }}
            >
                <div className="relative group mb-4">
                    <textarea
                        value={simpleIdea}
                        onChange={(e) => setSimpleIdea(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe your goal... (e.g., 'Create a LinkedIn post about AI safety for CTOs') (Ctrl+Enter to Auto-Expand)"
                        className="w-full h-48 px-5 py-4 pr-14 pb-12 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none transition-all placeholder:text-slate-300 shadow-sm text-base text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isProcessingFile}
                        spellCheck={false}
                    />

                    {/* Character Count Overlay */}
                    <TextStats text={simpleIdea} className="bottom-3 left-5 border-slate-200/50 bg-slate-50/80" />

                    <input
                        type="file"
                        ref={fileRef}
                        className="hidden"
                        accept=".txt,.md,.json,.csv,.docx,.pdf,image/*"
                        onChange={handleFileUpload}
                    />

                    <button
                        onClick={() => fileRef.current?.click()}
                        disabled={isProcessingFile}
                        className="absolute top-3 right-3 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all opacity-70 group-hover:opacity-100 disabled:opacity-50"
                        title="Attach context file"
                    >
                        {isProcessingFile ? <Loader2 size={18} className="animate-spin text-indigo-500" /> : <Upload size={18} />}
                    </button>
                </div>

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

                {/* Complexity Selector */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    <SelectionCard
                        title="Direct & Simple"
                        description="Concise, straight to the point outputs"
                        icon={<Zap size={36} />}
                        activeColor="green"
                        isSelected={complexity === 'direct'}
                        onClick={() => setComplexity('direct')}
                        showActiveIndicator
                    />

                    <SelectionCard
                        title="Contextual & Structured"
                        description="Organized with clear logical flow"
                        icon={<Layers size={36} />}
                        activeColor="orange"
                        isSelected={complexity === 'contextual'}
                        onClick={() => setComplexity('contextual')}
                        showActiveIndicator
                    />

                    <SelectionCard
                        title="Detailed & Advanced"
                        description="Comprehensive, in-depth analysis"
                        icon={<Brain size={36} />}
                        activeColor="red"
                        isSelected={complexity === 'detailed'}
                        onClick={() => setComplexity('detailed')}
                        showActiveIndicator
                    />
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
            </div >
        </>
    );
};
