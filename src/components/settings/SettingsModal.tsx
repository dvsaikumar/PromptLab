import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, RefreshCw, Check, Activity, Sparkles, Settings, Database, Eye, EyeOff } from 'lucide-react';
import { usePrompt } from '@/contexts/PromptContext';
import { LLMProviderId } from '@/types';
import { LLMService } from '@/services/llm';
import toast from 'react-hot-toast';
import { securityManager } from '@/utils/security';
import { llmConfigDB } from '@/services/llmConfigDB';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { llmConfig, updateConfig } = usePrompt();

    // Local state for form
    const [providerId, setProviderId] = useState<LLMProviderId>(llmConfig.providerId);
    const [apiKey, setApiKey] = useState(llmConfig.apiKey);
    const [model, setModel] = useState(llmConfig.model);
    const [baseUrl, setBaseUrl] = useState(llmConfig.baseUrl || '');

    // Test state
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [fetchedModels, setFetchedModels] = useState<string[]>([]);
    const [showModelList, setShowModelList] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [savedConfigs, setSavedConfigs] = useState<Map<LLMProviderId, any>>(new Map());

    // Load saved configs when opening
    useEffect(() => {
        if (isOpen) {
            setProviderId(llmConfig.providerId);
            setApiKey(llmConfig.apiKey);
            setModel(llmConfig.model);
            setBaseUrl(llmConfig.baseUrl || '');
            setTestStatus('idle');

            // Load all saved configurations
            const loadSavedConfigs = async () => {
                try {
                    const configs = await llmConfigDB.getAllConfigs();
                    const configMap = new Map();
                    configs.forEach(config => {
                        configMap.set(config.providerId, config);
                    });
                    setSavedConfigs(configMap);
                } catch (error) {
                    console.error('Failed to load saved configs:', error);
                }
            };
            loadSavedConfigs();
        }
    }, [isOpen, llmConfig]);

    const handleSave = () => {
        // Validate API key before saving
        if (apiKey && apiKey.trim()) {
            const validation = securityManager.validateApiKey(providerId, apiKey);
            if (!validation.valid) {
                toast.error(validation.error || 'Invalid API key format', {
                    duration: 5000,
                    icon: '⚠️',
                });
                return;
            }
        }

        updateConfig({
            providerId,
            apiKey,
            model,
            baseUrl: baseUrl || undefined
        });

        const providerNames: Record<LLMProviderId, string> = {
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

        toast.success(`✓ ${providerNames[providerId]} settings saved!`, {
            duration: 3000,
            icon: '💾',
        });

        onClose();
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestStatus('idle');
        try {
            const tempConfig = {
                providerId,
                apiKey,
                model,
                baseUrl: baseUrl || undefined
            };

            const provider = LLMService.getInstance().getProvider(providerId);
            await provider.testConnection(tempConfig);

            setTestStatus('success');

            // Auto-save settings after successful test to IndexedDB
            const newConfig = {
                providerId,
                apiKey,
                model,
                baseUrl: baseUrl || undefined
            };

            // Save to IndexedDB - this persists across sessions
            try {
                await llmConfigDB.saveConfig(newConfig);
            } catch (error) {
                console.error('Failed to save to DB:', error);
            }

            // Update context
            updateConfig(newConfig);

            const providerNames: Record<LLMProviderId, string> = {
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

            toast.success(`✓ ${providerNames[providerId]} connected & saved!`, {
                duration: 4000,
                style: {
                    background: '#10b981',
                    color: '#fff',
                    fontWeight: 'bold',
                    padding: '16px',
                    borderRadius: '12px',
                },
                icon: '💾',
            });

            setTimeout(() => setTestStatus('idle'), 3000);
        } catch (error: any) {
            setTestStatus('error');
            toast.error(error.message || 'Connection failed');
        } finally {
            setIsTesting(false);
        }
    };

    // Defaults helpers
    const applyDefaults = (pid: LLMProviderId) => {
        setProviderId(pid);

        // Check if this provider has a saved configuration
        const savedConfig = savedConfigs.get(pid);

        if (savedConfig) {
            // Auto-fill from saved configuration
            setApiKey(savedConfig.apiKey);
            setModel(savedConfig.model);
            setBaseUrl(savedConfig.baseUrl || '');
            toast.success('Loaded saved configuration', { duration: 2000 });
        } else {
            // Clear API key and apply defaults for new provider
            setApiKey('');

            if (pid === 'deepseek') {
                setModel('deepseek-chat');
                setBaseUrl('https://api.deepseek.com');
            } else if (pid === 'kimi') {
                setModel('moonshot-v1-8k');
                setBaseUrl('https://api.moonshot.cn/v1');
            } else if (pid === 'glm') {
                setModel('glm-4');
                setBaseUrl('https://open.bigmodel.cn/api/paas/v4');
            } else if (pid === 'anthropic') {
                setModel('claude-3-5-sonnet-20240620');
                setBaseUrl('');
            } else if (pid === 'openai') {
                setModel('gpt-4o');
                setBaseUrl('https://api.openai.com/v1');
            } else if (pid === 'gemini') {
                setModel('gemini-pro');
                setBaseUrl('https://generativelanguage.googleapis.com/v1beta');
            } else if (pid === 'mistral') {
                setModel('mistral-large-latest');
                setBaseUrl('https://api.mistral.ai/v1');
            } else if (pid === 'grok') {
                setModel('grok-beta');
                setBaseUrl('https://api.x.ai/v1');
            } else if (pid === 'local') {
                setModel('llama3');
                setBaseUrl('http://localhost:11434/v1');
            } else if (pid === 'custom') {
                setModel('');
                setBaseUrl('');
            }
        }
    };

    if (!isOpen) return null;

    const providerLogos: Record<LLMProviderId, string> = {
        'anthropic': '🤖',
        'openai': '🟢',
        'gemini': '💎',
        'deepseek': '🔮',
        'kimi': '🌙',
        'glm': '⚡',
        'mistral': '🌊',
        'grok': '🚀',
        'local': '🏠',
        'custom': '⚙️'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="relative px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                                <Settings className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">LLM Configuration</h2>
                                <p className="text-sm text-slate-600">Configure your AI provider settings</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                        >
                            <X size={24} className="text-slate-600" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold mt-3">
                        <Database size={14} />
                        <span>Auto-saved to IndexedDB • Persists permanently</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    <div className="space-y-6">
                        {/* Provider Selection */}
                        <div className="space-y-4">
                            {/* Configured Providers */}
                            {savedConfigs.size > 0 && (
                                <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200">
                                    <label className="flex items-center gap-2 text-sm font-bold text-emerald-900 mb-4">
                                        <Check size={16} className="text-emerald-600" />
                                        Configured Providers ({savedConfigs.size})
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {(['openai', 'anthropic', 'gemini', 'grok', 'deepseek', 'kimi', 'glm', 'mistral', 'local', 'custom'] as LLMProviderId[])
                                            .filter(pid => savedConfigs.has(pid))
                                            .map((pid) => (
                                                <button
                                                    key={pid}
                                                    onClick={() => applyDefaults(pid)}
                                                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${providerId === pid
                                                        ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-500/20 scale-105'
                                                        : 'border-emerald-300 bg-white hover:border-emerald-400 hover:shadow-md'
                                                        }`}
                                                >
                                                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-lg">
                                                        <Check size={14} />
                                                    </div>
                                                    <div className="text-3xl mb-2">{providerLogos[pid]}</div>
                                                    <div className={`text-sm font-bold ${providerId === pid ? 'text-indigo-900' : 'text-emerald-700'}`}>
                                                        {pid === 'openai' ? 'OpenAI' :
                                                            pid === 'anthropic' ? 'Anthropic' :
                                                                pid === 'gemini' ? 'Gemini' :
                                                                    pid === 'deepseek' ? 'DeepSeek' :
                                                                        pid === 'kimi' ? 'Kimi' :
                                                                            pid === 'glm' ? 'GLM' :
                                                                                pid === 'mistral' ? 'Mistral' :
                                                                                    pid === 'grok' ? 'Grok' :
                                                                                        pid === 'local' ? 'Local' :
                                                                                            'Custom'}
                                                    </div>
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Available Providers */}
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4">
                                    <Sparkles size={16} className="text-indigo-600" />
                                    Available Providers
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {(['openai', 'anthropic', 'gemini', 'grok', 'deepseek', 'kimi', 'glm', 'mistral', 'local', 'custom'] as LLMProviderId[])
                                        .filter(pid => !savedConfigs.has(pid))
                                        .map((pid) => (
                                            <button
                                                key={pid}
                                                onClick={() => applyDefaults(pid)}
                                                className={`p-4 rounded-xl border-2 transition-all duration-200 ${providerId === pid
                                                    ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-500/20 scale-105'
                                                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="text-3xl mb-2">{providerLogos[pid]}</div>
                                                <div className={`text-sm font-bold ${providerId === pid ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                    {pid === 'openai' ? 'OpenAI' :
                                                        pid === 'anthropic' ? 'Anthropic' :
                                                            pid === 'gemini' ? 'Gemini' :
                                                                pid === 'deepseek' ? 'DeepSeek' :
                                                                    pid === 'kimi' ? 'Kimi' :
                                                                        pid === 'glm' ? 'GLM' :
                                                                            pid === 'mistral' ? 'Mistral' :
                                                                                pid === 'grok' ? 'Grok' :
                                                                                    pid === 'local' ? 'Local' :
                                                                                        'Custom'}
                                                </div>
                                            </button>
                                        ))}
                                </div>
                                {savedConfigs.size === 8 && (
                                    <p className="text-sm text-slate-500 mt-4 text-center">All providers configured! 🎉</p>
                                )}
                            </div>
                        </div>

                        {/* API Key */}
                        <div>
                            <label className="block text-sm font-bold text-slate-900 mb-2">
                                API Key
                            </label>
                            <div className="relative">
                                <input
                                    type={showApiKey ? "text" : "password"}
                                    value={showApiKey ? apiKey : (apiKey.length > 4 ? `${apiKey.slice(0, 2)}${'•'.repeat(Math.min(apiKey.length - 4, 20))}${apiKey.slice(-2)}` : apiKey)}
                                    onChange={(e) => {
                                        // Only allow editing when visible
                                        if (showApiKey) {
                                            setApiKey(e.target.value);
                                        }
                                    }}
                                    onFocus={() => setShowApiKey(true)}
                                    placeholder="sk-..."
                                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 pr-12 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    {showApiKey ? <EyeOff size={18} className="text-slate-600" /> : <Eye size={18} className="text-slate-600" />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                <AlertCircle size={12} />
                                {apiKey.length > 4 && !showApiKey
                                    ? `Showing: ${apiKey.slice(0, 2)}••••${apiKey.slice(-2)} • Click eye to view full key`
                                    : 'Encrypted and stored securely in IndexedDB'
                                }
                            </p>
                        </div>

                        {/* Model & Base URL */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-bold text-slate-900">
                                        Model Name
                                    </label>
                                    <button
                                        onClick={async () => {
                                            try {
                                                toast.loading('Fetching models...', { id: 'fetch-models' });
                                                const provider = LLMService.getInstance().getProvider(providerId);
                                                const models = await provider.listModels({ providerId, apiKey, model, baseUrl: baseUrl || undefined });

                                                if (models.length > 0) {
                                                    setFetchedModels(models);
                                                    setShowModelList(true);
                                                    toast.success(`Found ${models.length} models`, { id: 'fetch-models' });
                                                } else {
                                                    toast.error('No models available. This provider may not support listing models.', {
                                                        id: 'fetch-models',
                                                        duration: 5000
                                                    });
                                                }
                                            } catch (error: any) {
                                                console.error('Failed to fetch models:', error);
                                                toast.error(error.message || 'Failed to fetch models. Check API key and connection.', {
                                                    id: 'fetch-models',
                                                    duration: 5000
                                                });
                                            }
                                        }}
                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-bold hover:underline"
                                    >
                                        📋 Fetch List
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                        onFocus={() => { if (fetchedModels.length) setShowModelList(true); }}
                                        onBlur={() => setTimeout(() => setShowModelList(false), 200)}
                                        className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                        placeholder="e.g., gpt-4o"
                                    />
                                    {showModelList && fetchedModels.length > 0 && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-10">
                                            {fetchedModels.map(m => (
                                                <div
                                                    key={m}
                                                    onMouseDown={() => {
                                                        setModel(m);
                                                        setShowModelList(false);
                                                    }}
                                                    className="px-4 py-3 text-sm hover:bg-indigo-50 cursor-pointer text-slate-700 border-b border-slate-100 last:border-0"
                                                >
                                                    {m}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-2">
                                    Base URL <span className="text-slate-400 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                    placeholder="https://api..."
                                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-4 flex-shrink-0">
                    <button
                        onClick={handleTest}
                        disabled={isTesting || (!apiKey && providerId !== 'local')}
                        className={`flex items-center gap-3 px-6 py-3 border-2 rounded-xl text-base font-bold transition-all ${testStatus === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-500/20' :
                            testStatus === 'error'
                                ? 'border-red-200 bg-red-50 text-red-700' :
                                'border-indigo-600 bg-white text-indigo-700 hover:bg-indigo-50 shadow-md'
                            }`}
                    >
                        {isTesting ? <RefreshCw size={20} className="animate-spin" /> :
                            testStatus === 'success' ? <Check size={20} /> :
                                testStatus === 'error' ? <AlertCircle size={20} /> :
                                    <Activity size={20} />}
                        {isTesting ? 'Testing & Saving...' :
                            testStatus === 'success' ? 'Saved ✓' :
                                testStatus === 'error' ? 'Failed' : 'Test & Save'}
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isTesting}
                        className="flex items-center gap-3 px-6 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors font-bold text-base shadow-md disabled:opacity-50"
                    >
                        <Save size={20} />
                        Save Without Test
                    </button>
                </div>
            </div>
        </div>
    );
};
