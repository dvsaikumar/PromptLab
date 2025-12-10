import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Cpu, ChevronDown, Check, Trash2, AlertTriangle, Search } from 'lucide-react';
import { usePrompt } from '@/contexts/PromptContext';
import { LLMConfig, LLMProviderId } from '@/types';
import { llmConfigDB } from '@/services/llmConfigDB';
import { ProviderIcon } from './ProviderIcon';
import toast from 'react-hot-toast';

interface LLMSelectorProps {
    onOpenSettings: () => void;
    className?: string;
}

export const LLMSelector: React.FC<LLMSelectorProps> = ({ onOpenSettings, className }) => {
    const { llmConfig, updateConfig } = usePrompt();
    const [showDropdown, setShowDropdown] = useState(false);
    const [savedConfigs, setSavedConfigs] = useState<LLMConfig[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [configToDelete, setConfigToDelete] = useState<LLMConfig | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const triggerRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const [animationClass, setAnimationClass] = useState('');

    const allProviders: LLMProviderId[] = [
        'openai', 'anthropic', 'gemini', 'grok', 'qwen',
        'openrouter', 'deepseek', 'kimi', 'glm', 'mistral',
        'local', 'custom'
    ];

    // Load saved LLM configurations
    useEffect(() => {
        const loadConfigs = async () => {
            try {
                const configs = await llmConfigDB.getAllConfigs();
                setSavedConfigs(configs);
            } catch (error) {
                console.error('Failed to load configs:', error);
            }
        };
        loadConfigs();
    }, [llmConfig]);

    const hasMultipleConfigs = savedConfigs.length > 1;

    const handleToggle = () => {
        if (!hasMultipleConfigs) {
            onOpenSettings();
            return;
        }

        if (!showDropdown && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;
            const MENU_MAX_HEIGHT = 450;

            // Default to downward opening
            let newStyle: React.CSSProperties = {
                position: 'fixed',
                left: rect.left,
                width: rect.width,
                zIndex: 101, // Above backdrop
            };
            let anim = 'slide-in-from-top-2';

            if (spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow) {
                // Open Upwards
                newStyle.bottom = viewportHeight - rect.top + 8; // 8px gap
                newStyle.maxHeight = Math.min(MENU_MAX_HEIGHT, spaceAbove - 24); // buffer
                newStyle.top = 'auto';
                anim = 'slide-in-from-bottom-2';
            } else {
                // Open Downwards
                newStyle.top = rect.bottom + 8;
                newStyle.maxHeight = Math.min(MENU_MAX_HEIGHT, spaceBelow - 24);
                newStyle.bottom = 'auto';
                anim = 'slide-in-from-top-2';
            }

            setDropdownStyle(newStyle);
            setAnimationClass(anim);
        }
        setShowDropdown(!showDropdown);
    };

    // ... (keep helpers) ...
    // Note: I will just re-include them to keep context simple for the tool
    const getProviderDisplay = (providerId: string) => {
        const providers: Record<string, string> = {
            'anthropic': 'Anthropic',
            'openai': 'OpenAI',
            'gemini': 'Gemini',
            'deepseek': 'DeepSeek',
            'kimi': 'Kimi',
            'glm': 'GLM',
            'mistral': 'Mistral AI',
            'grok': 'Grok (xAI)',
            'qwen': 'Qwen (DashScope)',
            'openrouter': 'OpenRouter',
            'local': 'Local LLM',
            'custom': 'Custom'
        };
        return providers[providerId] || providerId;
    };

    const getModelDisplay = (model: string) => {
        if (model.includes('claude')) return model.replace('claude-', '').replace('-20240620', '').replace('-20241022', '');
        if (model.includes('gpt')) return model.replace('gpt-', 'GPT-');
        if (model.includes('gemini')) return model.replace('gemini-', '');
        return model.length > 20 ? model.substring(0, 20) + '...' : model;
    };

    const handleSelectConfig = async (config: LLMConfig) => {
        updateConfig(config);
        setShowDropdown(false);
        try {
            await llmConfigDB.saveConfig(config);
        } catch (error) {
            console.error('Failed to update active config:', error);
        }
    };

    const handleDeleteClick = (config: LLMConfig, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfigToDelete(config);
        setShowDeleteModal(true);
        setShowDropdown(false);
    };

    const handleConfirmDelete = async () => {
        if (!configToDelete) return;
        try {
            const allConfigs = await llmConfigDB.getAllConfigs();
            const configInDb = allConfigs.find(c => c.providerId === configToDelete.providerId && c.model === configToDelete.model);

            if (configInDb) {
                await llmConfigDB.deleteConfig(configInDb.providerId, configInDb.model);
                const updatedConfigs = await llmConfigDB.getAllConfigs();
                setSavedConfigs(updatedConfigs);

                if (llmConfig.providerId === configToDelete.providerId && llmConfig.model === configToDelete.model) {
                    if (updatedConfigs.length > 0) updateConfig(updatedConfigs[0]);
                    else updateConfig({ providerId: 'anthropic', apiKey: '', model: 'claude-3-5-sonnet-20240620', baseUrl: '' });
                }
                toast.success('Configuration deleted', { icon: '🗑️' });
            }
        } catch (error) {
            toast.error('Failed to delete configuration');
        } finally {
            setShowDeleteModal(false);
            setConfigToDelete(null);
        }
    };

    return (
        <div className={`relative ${className}`}>
            <label className="block text-sm font-bold text-slate-700 mb-2">
                Select AI Model
            </label>
            <div
                ref={triggerRef}
                onClick={handleToggle}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer group shadow-sm"
                title={hasMultipleConfigs ? "Switch LLM provider" : "Click to change LLM settings"}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                        <ProviderIcon providerId={llmConfig.providerId} size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                            {getProviderDisplay(llmConfig.providerId)}
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                            {getModelDisplay(llmConfig.model)}
                        </span>
                    </div>
                </div>

                {hasMultipleConfigs ? (
                    <ChevronDown size={18} className={`text-slate-400 group-hover:text-indigo-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                ) : (
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Configure</span>
                )}
            </div>

            {/* Dropdown Menu Portal */}
            {showDropdown && hasMultipleConfigs && createPortal(
                <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setShowDropdown(false)} />
                    <div
                        className={`bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-200 flex flex-col ${animationClass}`}
                        style={dropdownStyle}
                    >
                        <div className="flex-shrink-0 px-3 py-2 border-b border-slate-100 bg-slate-50">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search models..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                            {/* Saved Configs */}
                            {savedConfigs.length > 0 && (
                                <div className="px-3 py-2 text-xs font-bold text-white uppercase tracking-wider bg-indigo-600 border-b border-indigo-700 sticky top-0 z-10 shadow-md">
                                    Active Connections
                                </div>
                            )}
                            {savedConfigs
                                .filter(config =>
                                    getProviderDisplay(config.providerId).toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    config.model.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((config, index) => {
                                    const isActive = config.providerId === llmConfig.providerId && config.model === llmConfig.model;
                                    return (
                                        <div
                                            key={`${config.providerId}-${index}`}
                                            className="group flex items-center gap-1.5 p-1 hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-50"
                                        >
                                            <button
                                                onClick={() => handleSelectConfig(config)}
                                                className={`flex-1 flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all ${isActive ? 'bg-indigo-50/50' : ''}`}
                                            >
                                                <ProviderIcon providerId={config.providerId} size={18} />
                                                <div className="flex-1 text-left">
                                                    <div className={`text-sm font-medium ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                        {getProviderDisplay(config.providerId)}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {getModelDisplay(config.model)}
                                                    </div>
                                                </div>
                                                {isActive && <Check size={16} className="text-indigo-600" />}
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteClick(config, e)}
                                                className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                                                title="Delete"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    );
                                })}

                            {/* Unconfigured Providers */}
                            <div className="px-3 py-2 text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-200 border-y border-slate-300 mt-2 sticky top-0 z-10 shadow-sm">
                                Available Providers
                            </div>
                            {allProviders
                                .filter(pid =>
                                    !savedConfigs.some(config => config.providerId === pid) &&
                                    getProviderDisplay(pid).toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map(pid => (
                                    <button
                                        key={pid}
                                        onClick={() => {
                                            updateConfig({
                                                providerId: pid,
                                                apiKey: '',
                                                model: '',
                                                baseUrl: ''
                                            });
                                            setShowDropdown(false);
                                            onOpenSettings();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 transition-colors text-left group"
                                    >
                                        <ProviderIcon providerId={pid} size={18} className="opacity-70 group-hover:opacity-100" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-slate-600 group-hover:text-slate-900">
                                                {getProviderDisplay(pid)}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                Click to configure
                                            </div>
                                        </div>
                                        <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            Setup
                                        </div>
                                    </button>
                                ))}
                        </div>
                        <div className="flex-shrink-0 p-2 bg-slate-50 border-t border-slate-100 text-center">
                            <span className="text-[10px] text-slate-400">
                                Scroll for more providers
                            </span>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && configToDelete && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-200 bg-red-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 shadow-sm border border-red-200">
                                    <AlertTriangle className="text-red-600" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-extrabold text-slate-900">Delete Configuration</h3>
                                    <p className="text-sm text-slate-500 font-medium">This action cannot be undone</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-6">
                            <p className="text-slate-600 mb-4 text-sm font-medium">
                                You are about to remove the following connection:
                            </p>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                                        <Cpu size={20} className="text-slate-700" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">
                                            {getProviderDisplay(configToDelete.providerId)}
                                        </div>
                                        <div className="text-xs text-slate-500 font-medium font-mono">
                                            {getModelDisplay(configToDelete.model)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setConfigToDelete(null);
                                }}
                                className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 rounded-xl transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                Delete Connection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
