import React, { useState, useEffect } from 'react';
import { Cpu, ChevronDown, Check, Trash2, AlertTriangle } from 'lucide-react';
import { usePrompt } from '@/contexts/PromptContext';
import { LLMConfig } from '@/types';
import { llmConfigDB } from '@/services/llmConfigDB';
import toast from 'react-hot-toast';

interface HeaderProps {
    onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
    const { llmConfig, updateConfig } = usePrompt();
    const [showDropdown, setShowDropdown] = useState(false);
    const [savedConfigs, setSavedConfigs] = useState<LLMConfig[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [configToDelete, setConfigToDelete] = useState<LLMConfig | null>(null);

    // Load saved LLM configurations from IndexedDB
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
    }, [llmConfig]); // Reload when config changes

    const hasMultipleConfigs = savedConfigs.length > 1;

    // Format provider name for display
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
            'local': 'Local LLM',
            'custom': 'Custom'
        };
        return providers[providerId] || providerId;
    };

    // Get short model name
    const getModelDisplay = (model: string) => {
        // Extract key parts of model name for compact display
        if (model.includes('claude')) {
            return model.replace('claude-', '').replace('-20240620', '').replace('-20241022', '');
        }
        if (model.includes('gpt')) {
            return model.replace('gpt-', 'GPT-');
        }
        if (model.includes('gemini')) {
            return model.replace('gemini-', '');
        }
        return model.length > 20 ? model.substring(0, 20) + '...' : model;
    };

    const handleSelectConfig = async (config: LLMConfig) => {
        // Switch to this config
        updateConfig(config);
        setShowDropdown(false);

        // Set as active in DB
        try {
            await llmConfigDB.saveConfig(config);
        } catch (error) {
            console.error('Failed to update active config:', error);
        }
    };

    const handleDeleteClick = (config: LLMConfig, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent selecting the config
        setConfigToDelete(config);
        setShowDeleteModal(true);
        setShowDropdown(false);
    };

    const handleConfirmDelete = async () => {
        if (!configToDelete) return;

        try {
            // Find the config in database to get its ID
            const allConfigs = await llmConfigDB.getAllConfigs();
            const configInDb = allConfigs.find(c =>
                c.providerId === configToDelete.providerId &&
                c.model === configToDelete.model
            );

            if (configInDb) {
                // Delete from database
                await llmConfigDB.deleteConfig(configInDb.providerId, configInDb.model);

                // Reload configs
                const updatedConfigs = await llmConfigDB.getAllConfigs();
                setSavedConfigs(updatedConfigs);

                // If we deleted the active config, switch to another one or clear
                if (llmConfig.providerId === configToDelete.providerId && llmConfig.model === configToDelete.model) {
                    if (updatedConfigs.length > 0) {
                        updateConfig(updatedConfigs[0]);
                    } else {
                        // No configs left, set to default empty state
                        updateConfig({
                            providerId: 'anthropic',
                            apiKey: '',
                            model: 'claude-3-5-sonnet-20240620',
                            baseUrl: ''
                        });
                    }
                }

                toast.success(`${getProviderDisplay(configToDelete.providerId)} configuration deleted`, {
                    icon: '🗑️',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Failed to delete config:', error);
            toast.error('Failed to delete configuration');
        } finally {
            setShowDeleteModal(false);
            setConfigToDelete(null);
        }
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 shadow-sm">
                <div className="h-full flex items-center justify-between">
                    {/* Left: Logo always visible with text */}
                    <div className="h-full flex items-center gap-3 pl-4">
                        {/* D Studio Logo 
                        <img
                            src="/d-logo.png"
                            alt="D Studio Logo"
                            className="h-10 w-10 object-contain"
                        />*/}
                        <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap">
                            D Studios Lab
                        </h1>
                    </div>

                    {/* Right: LLM Selector Dropdown */}
                    <div className="pr-6 relative">
                        <div
                            onClick={() => hasMultipleConfigs ? setShowDropdown(!showDropdown) : onOpenSettings()}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 rounded-xl border border-indigo-200 transition-all cursor-pointer group"
                            title={hasMultipleConfigs ? "Switch LLM provider" : "Click to change LLM settings"}
                        >
                            <Cpu size={18} className="text-indigo-600 group-hover:text-indigo-700 flex-shrink-0" />
                            <div className="flex flex-col items-start justify-center">
                                <span className="text-xs font-semibold text-indigo-900 leading-tight">
                                    {getProviderDisplay(llmConfig.providerId)}
                                </span>
                                <span className="text-[10px] text-indigo-600 leading-tight">
                                    {getModelDisplay(llmConfig.model)}
                                </span>
                            </div>
                            {hasMultipleConfigs && (
                                <ChevronDown size={16} className={`text-indigo-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                            )}
                        </div>

                        {/* Dropdown Menu */}
                        {showDropdown && hasMultipleConfigs && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowDropdown(false)}
                                />

                                {/* Dropdown Panel */}
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select LLM Provider</h3>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                        {savedConfigs.map((config, index) => {
                                            const isActive = config.providerId === llmConfig.providerId && config.model === llmConfig.model;
                                            return (
                                                <div
                                                    key={index}
                                                    className={`group flex items-center gap-3 transition-colors ${isActive
                                                        ? 'bg-indigo-50 border-l-4 border-l-indigo-600'
                                                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                                                        }`}
                                                >
                                                    <button
                                                        onClick={() => handleSelectConfig(config)}
                                                        className="flex-1 px-4 py-3 flex items-center gap-3"
                                                    >
                                                        <Cpu size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                                        <div className="flex-1 text-left">
                                                            <div className={`text-sm font-semibold ${isActive ? 'text-indigo-900' : 'text-slate-900'}`}>
                                                                {getProviderDisplay(config.providerId)}
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {getModelDisplay(config.model)}
                                                            </div>
                                                        </div>
                                                        {isActive && (
                                                            <Check size={16} className="text-indigo-600" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDeleteClick(config, e)}
                                                        className="px-3 py-3 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                                                        title="Delete configuration"
                                                    >
                                                        <Trash2 size={16} className="text-red-500" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
                                        <button
                                            onClick={() => {
                                                setShowDropdown(false);
                                                onOpenSettings();
                                            }}
                                            className="w-full px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            + Add New Provider
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && configToDelete && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-200 bg-red-50">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                    <AlertTriangle className="text-red-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Delete Configuration</h3>
                                    <p className="text-sm text-slate-600">This action cannot be undone</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-5">
                            <p className="text-slate-700 mb-4">
                                Are you sure you want to delete the configuration for:
                            </p>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <Cpu size={20} className="text-slate-600" />
                                    <div>
                                        <div className="text-sm font-bold text-slate-900">
                                            {getProviderDisplay(configToDelete.providerId)}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {getModelDisplay(configToDelete.model)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 mt-4">
                                The provider will be moved back to the "Available Providers" list and you'll need to reconfigure it.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setConfigToDelete(null);
                                }}
                                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
