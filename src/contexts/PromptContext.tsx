import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FrameworkId, LLMConfig, QualityScore, FieldState, HistoryState, HistoryIndex, Framework, Attachment, Template, ComplexityLevel } from '../types';
import { FRAMEWORKS, TONES, INDUSTRY_TEMPLATES, ROLE_PRESETS } from '../constants';
import { LLMService } from '../services/llm';
import toast from 'react-hot-toast';
import { llmConfigDB } from '../services/llmConfigDB';

interface PromptContextType {
    // State
    fields: FieldState;
    activeFramework: FrameworkId;
    selectedTones: string[];
    simpleIdea: string;
    attachments: Attachment[];
    complexity: ComplexityLevel;
    generatedPrompt: string;
    isGenerating: boolean;
    isExpanding: boolean;
    isAnalyzing: boolean;
    isImproving: boolean;
    qualityScore: QualityScore | null;
    llmConfig: LLMConfig;
    fieldHistory: HistoryState;
    historyIndex: HistoryIndex;
    requestChainOfThought: boolean;
    activeIndustry: string | null;
    activeRole: string | null;
    currentPromptId: number | null;

    // Actions
    setField: (fieldId: string, value: string) => void;
    setFields: (fields: FieldState) => void;
    setFramework: (id: FrameworkId) => void;
    toggleTone: (tone: string) => void;
    setComplexity: (level: ComplexityLevel) => void;
    toggleChainOfThought: () => void;
    setSimpleIdea: (idea: string) => void;
    addAttachment: (file: Attachment) => void;
    removeAttachment: (name: string) => void;
    undoField: (fieldId: string) => void;
    redoField: (fieldId: string) => void;
    updateConfig: (config: LLMConfig) => void;
    resetAll: () => void;

    selectIndustry: (template: Template) => void;
    selectRole: (template: Template) => void;
    clearIndustry: () => void;
    clearRole: () => void;

    // LLM Operations
    expandIdea: () => Promise<void>;
    generatePrompt: () => Promise<void>;
    analyzeQuality: (promptText?: string) => Promise<void>;
    improvePrompt: () => Promise<void>;
    generateSuggestions: (fieldId: string) => Promise<string[]>;
    autoFillOutputStopping: () => Promise<void>;
    loadPrompt: (savedPrompt: any) => Promise<void>;
}

export const PromptContext = createContext<PromptContextType | undefined>(undefined);

export const PromptProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- State ---
    const [fields, setFields] = useState<FieldState>({});
    const [activeFramework, setActiveFramework] = useState<FrameworkId>('costar');
    const [selectedTones, setSelectedTones] = useState<string[]>([]);
    const [requestChainOfThought, setRequestChainOfThought] = useState(false);
    const [simpleIdea, setSimpleIdea] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [complexity, setComplexity] = useState<ComplexityLevel>('direct');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);

    const [activeIndustry, setActiveIndustry] = useState<string | null>(null);
    const [activeRole, setActiveRole] = useState<string | null>(null);
    const [currentPromptId, setCurrentPromptId] = useState<number | null>(null);

    // Loading States
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExpanding, setIsExpanding] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImproving, setIsImproving] = useState(false);

    // History
    const [fieldHistory, setFieldHistory] = useState<HistoryState>({});
    const [historyIndex, setHistoryIndex] = useState<HistoryIndex>({});

    // Config
    const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => {
        // Default configuration - will be loaded from DB
        return {
            providerId: 'anthropic',
            apiKey: '',
            model: 'claude-3-5-sonnet-20240620',
            baseUrl: ''
        };
    });

    // Load config from IndexedDB on mount
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const saved = await llmConfigDB.getActiveConfig();
                if (saved) {
                    setLlmConfig(saved);
                }
            } catch (error) {
                console.error('Failed to load LLM config from DB:', error);
            }
        };
        loadConfig();
    }, []);

    useEffect(() => {
        // Save to IndexedDB when config changes (happens automatically via SettingsModal)
        // The saving is actually done in SettingsModal after test passes
    }, [llmConfig]);

    // --- Helpers ---
    const getCurrentFramework = (): Framework => {
        return FRAMEWORKS.find(f => f.id === activeFramework) || FRAMEWORKS[0];
    };

    const addToHistory = (fieldId: string, value: string) => {
        setFieldHistory(prev => {
            const history = prev[fieldId] || [];
            const index = historyIndex[fieldId] ?? -1;
            const newHistory = history.slice(0, index + 1);
            newHistory.push(value);
            if (newHistory.length > 50) newHistory.shift();
            return { ...prev, [fieldId]: newHistory };
        });
        setHistoryIndex(prev => ({
            ...prev,
            [fieldId]: (prev[fieldId] ?? -1) + 1
        }));
    };

    // --- Actions ---
    const setField = (fieldId: string, value: string) => {
        if (fields[fieldId] !== value) {
            setFields(prev => ({ ...prev, [fieldId]: value }));
            addToHistory(fieldId, value);
        }
    };

    const setFramework = (id: FrameworkId) => {
        setActiveFramework(id);
        setFields({}); // Clear fields on switch
    };

    const toggleTone = (tone: string) => {
        setSelectedTones(prev =>
            prev.includes(tone) ? prev.filter(t => t !== tone) : [...prev, tone]
        );
    };

    const toggleChainOfThought = () => setRequestChainOfThought(prev => !prev);

    const addAttachment = (file: Attachment) => {
        setAttachments(prev => [...prev, file]);
    };

    const removeAttachment = (name: string) => {
        setAttachments(prev => prev.filter(f => f.name !== name));
    };

    const undoField = (fieldId: string) => {
        const history = fieldHistory[fieldId];
        const index = historyIndex[fieldId];
        if (history && index > 0) {
            const newIndex = index - 1;
            setHistoryIndex(prev => ({ ...prev, [fieldId]: newIndex }));
            setFields(prev => ({ ...prev, [fieldId]: history[newIndex] }));
        }
    };

    const redoField = (fieldId: string) => {
        const history = fieldHistory[fieldId];
        const index = historyIndex[fieldId];
        if (history && index < history.length - 1) {
            const newIndex = index + 1;
            setHistoryIndex(prev => ({ ...prev, [fieldId]: newIndex }));
            setFields(prev => ({ ...prev, [fieldId]: history[newIndex] }));
        }
    };

    const updateConfig = (newConfig: LLMConfig) => {
        setLlmConfig(newConfig);
    };

    const resetAll = () => {
        setFields({});
        setSimpleIdea('');
        setAttachments([]);
        setGeneratedPrompt('');
        setQualityScore(null);
        setSelectedTones([]);
        setFieldHistory({});
        setHistoryIndex({});
        setActiveIndustry(null);
        setActiveRole(null);
        setComplexity('direct');
        setCurrentPromptId(null);
    };

    const selectIndustry = (template: Template) => {
        setActiveIndustry(template.id);
        // Apply visual settings (last one wins context)
        setFramework(template.frameworkId);
        setFields(template.prefill);
        setSelectedTones(prev => Array.from(new Set([...prev, ...template.tones])));
        toast.success(`Industry set to ${template.label}`);
    };

    const selectRole = (template: Template) => {
        setActiveRole(template.id);
        setFramework(template.frameworkId);
        setFields(template.prefill);
        setSelectedTones(prev => Array.from(new Set([...prev, ...template.tones])));
        toast.success(`Role set to ${template.label}`);
    };

    const clearIndustry = () => {
        setActiveIndustry(null);
        toast('Industry cleared');
    };

    const clearRole = () => {
        setActiveRole(null);
        toast('Role cleared');
    };

    // --- LLM Operations ---

    const getLLMService = () => LLMService.getInstance().getProvider(llmConfig.providerId);


    const expandIdea = async () => {
        if (!simpleIdea.trim() && !attachments.length) {
            toast.error('Please enter an idea or upload a file');
            return;
        }

        if (llmConfig.providerId !== 'local' && !llmConfig.apiKey) {
            toast.error('API Key required');
            return;
        }

        setIsExpanding(true);
        try {
            const framework = getCurrentFramework();
            const toneLabels = selectedTones.map(t => TONES.find(opt => opt.value === t)?.label).join(', ');

            // Find active templates
            const industryObj = INDUSTRY_TEMPLATES.find(t => t.id === activeIndustry);
            const roleObj = ROLE_PRESETS.find(t => t.id === activeRole);

            let promptContent = `Simple Idea: "${simpleIdea}"`;

            if (attachments.length > 0) {
                promptContent += `\n\n--- Attached Context ---\n`;
                attachments.forEach(att => {
                    promptContent += `\nFile: ${att.name}\nContent:\n${att.content}\n----------------\n`;
                });
            }

            let roleInstruction = "You are a prompt engineer.";
            let templateContext = "";

            if (industryObj || roleObj) {
                const parts: string[] = [];
                if (roleObj) parts.push(`Role: ${roleObj.label}`);
                if (industryObj) parts.push(`Industry: ${industryObj.label}`);

                roleInstruction = `You are acting as a specialized AI. ${parts.join('. ')}.`;

                templateContext = `\nACTIVE CONTEXT:\n`;
                if (industryObj) {
                    templateContext += `- Industry Context: ${industryObj.description}\n`;
                }
                if (roleObj) {
                    templateContext += `- Role Context: ${roleObj.description}\n`;
                }

                templateContext += `\nINSTRUCTION: You MUST align all generated fields with this specific persona and industry standard.`;
            }

            // Complexity-based constraints for Expansion
            let complexityInstructions = "";
            switch (complexity) {
                case 'direct':
                    complexityInstructions = `
                    CONSTRAINT: Keep each field SHORT and CONCISE. 
                    - Max ~512 tokens per field.
                    - Max ~2048 tokens total output.
                    - Focus on direct, simple, and actionable content. Avoid fluff.`;
                    break;
                case 'contextual':
                    complexityInstructions = `
                    CONSTRAINT: Provide DETAILED and STRUCTURED content.
                    - Allow up to ~2096 tokens per field if needed.
                    - Max ~16k tokens total output.
                    - Focus on comprehensive context, clear logic, and robust structure.`;
                    break;
                case 'detailed':
                    complexityInstructions = `
                    CONSTRAINT: NO RESTRICTION on length. 
                    - Go as deep as possible. 
                    - Provide maximum detail, nuance, and advanced analysis for every field.`;
                    break;
            }

            const prompt = `${roleInstruction} Expand this idea (and context files) into details for the ${framework.name} framework.
      
      ${promptContent}
      ${templateContext}

      Tone: ${toneLabels}
      Complexity Level: ${complexity.toUpperCase()}
      ${complexityInstructions}

      Framework Description: ${framework.description}
      Fields: ${framework.fields.map(f => `${f.label}: ${f.description}`).join(', ')}

      CRITICAL: Respond ONLY with RAW JSON. Do not use Markdown code blocks. Do not add any text before or after the JSON.
      JSON Format: { ${framework.fields.map(f => `"${f.id}": "content"`).join(', ')} }`;

            const result = await getLLMService().generateJSON<FieldState>({
                userPrompt: prompt,
                config: llmConfig,
                temperature: 0.7
            });

            setFields(prev => ({ ...prev, ...result }));
            toast.success('Idea expanded with context!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to expand idea');
            console.error(error);
        } finally {
            setIsExpanding(false);
        }
    };

    const generatePrompt = async () => {
        if (llmConfig.providerId !== 'local' && !llmConfig.apiKey) {
            toast.error('API Key required');
            return;
        }

        setIsGenerating(true);
        setGeneratedPrompt('');

        try {
            const framework = getCurrentFramework();
            const filledFields = framework.fields
                .filter(f => fields[f.id])
                .map(f => `**${f.label}:** ${fields[f.id]}`)
                .join('\n\n');

            const toneLabels = selectedTones.map(t => TONES.find(opt => opt.value === t)?.label).join(', ');

            let systemPrompt = `You are an expert prompt engineer. Create a polished ${framework.name} prompt from user inputs.
      Tone Requirement: ${toneLabels}.`;

            if (requestChainOfThought) {
                systemPrompt += `\nInclude a "Chain of Thought" or "Reasoning" step in the generated prompt, instructing the model to think step-by-step before answering.`;
            }

            // Complexity-based constraints for Output Generation
            let outputConstraints = "";
            switch (complexity) {
                case 'direct':
                    outputConstraints = `
                    OUTPUT CONSTRAINT: The final prompt should encourage the model to be concise. 
                    - Target output range: 0 - 4096 tokens.
                    - Add instructions to the generated prompt forcing brevity and directness.`;
                    break;
                case 'contextual':
                    outputConstraints = `
                    OUTPUT CONSTRAINT: The final prompt should encourage structured and substantial output.
                    - Target output range: 4096 - 16k tokens.
                    - Add instructions to the generated prompt ensuring detailed context and logical flow.`;
                    break;
                case 'detailed':
                    outputConstraints = `
                    OUTPUT CONSTRAINT: NO RESTRICTION on output length.
                    - Encourage maximum detail, comprehensiveness, and depth in the final generated prompt.`;
                    break;
            }

            systemPrompt += `\n${outputConstraints}`;
            systemPrompt += `\nOutput strictly the final prompt. No preamble.`;

            const userPrompt = `Components:\n${filledFields}`;

            const result = await getLLMService().generateCompletion({
                systemPrompt,
                userPrompt,
                config: llmConfig
            });

            setGeneratedPrompt(result);

            // Auto analyze
            await analyzeQuality(result);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const analyzeQuality = async (promptText?: string) => {
        const prompt = promptText || generatedPrompt; // Capture current
        if (!prompt) return;

        setIsAnalyzing(true);
        try {
            const analysisPrompt = `Analyze this prompt quality (0-100).
      Prompt: ${prompt}
      
      Respond JSON:
      {
        "overallScore": number,
        "rating": "Poor"|"Fair"|"Good"|"Excellent"|"Outstanding",
        "clarity": number,
        "specificity": number,
        "structure": number,
        "completeness": number,
        "actionability": number,
        "strengths": string[],
        "improvements": string[]
      }`;

            const result = await getLLMService().generateJSON<QualityScore>({
                userPrompt: analysisPrompt,
                config: llmConfig
            });

            setQualityScore(result);
        } catch (error) {
            console.error('Analysis failed', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const improvePrompt = async () => {
        if (!generatedPrompt) return;
        setIsImproving(true);

        const previousScoreVal = qualityScore?.overallScore || 0;

        try {
            const prompt = `Improve this prompt to score 95+.
        Current Prompt: ${generatedPrompt}
        Weaknesses: ${qualityScore?.improvements.join(', ') || 'General improvements'}
        
        Output ONLY the improved prompt.`;

            const candidatePrompt = await getLLMService().generateCompletion({
                userPrompt: prompt,
                config: llmConfig
            });

            // Analyze the candidate directly
            const analysisPrompt = `Analyze this prompt quality (0-100).
            Prompt: ${candidatePrompt}
            
            Respond JSON:
            {
              "overallScore": number,
              "rating": "Poor"|"Fair"|"Good"|"Excellent"|"Outstanding",
              "clarity": number,
              "specificity": number,
              "structure": number,
              "completeness": number,
              "actionability": number,
              "strengths": string[],
              "improvements": string[]
            }`;

            const candidateScore = await getLLMService().generateJSON<QualityScore>({
                userPrompt: analysisPrompt,
                config: llmConfig
            });

            if (candidateScore.overallScore >= previousScoreVal) {
                setGeneratedPrompt(candidatePrompt);
                setQualityScore(candidateScore);
                toast.success(`Broadened to ${candidateScore.overallScore}/100!`);
            } else {
                toast.error(`Optimization dropped score (${candidateScore.overallScore}). Retaining original.`);
                // We keep the old prompt and score
            }

        } catch (error: any) {
            toast.error('Failed to improve prompt');
        } finally {
            setIsImproving(false);
        }
    };

    const generateSuggestions = async (fieldId: string): Promise<string[]> => {
        if (llmConfig.providerId !== 'local' && !llmConfig.apiKey) return [];

        try {
            const framework = getCurrentFramework();
            const field = framework.fields.find(f => f.id === fieldId);
            const contextFields = framework.fields.slice(0, framework.fields.indexOf(field!));
            const contextStr = contextFields.map(f => `${f.label}: ${fields[f.id] || ''}`).join('\n');

            const prompt = `Provide 3 smart suggestions for the "${field?.label}" field in ${framework.name} framework.
        Context: ${contextStr}
        Current Input: "${fields[fieldId] || ''}"
        Respond JSON: { "suggestions": ["s1", "s2", "s3"] }`;

            const res = await getLLMService().generateJSON<{ suggestions: string[] }>({
                userPrompt: prompt,
                config: llmConfig,
                temperature: 0.7
            });
            return res.suggestions || [];
        } catch (e) {
            console.error(e);
            return [];
        }
    };

    const autoFillOutputStopping = async () => {
        // Specialized for RTCROS or generic
        if (llmConfig.providerId !== 'local' && !llmConfig.apiKey) return;


        const prompt = `Based on inputs: ${JSON.stringify(fields)}, recommend OUTPUT and STOPPING criteria.
      Respond JSON: { "output": "...", "stopping": "..." }`;

        try {
            const res = await getLLMService().generateJSON<{ output: string, stopping: string }>({
                userPrompt: prompt,
                config: llmConfig
            });
            if (res.output) setField('output', res.output);
            if (res.stopping) setField('stopping', res.stopping);
        } catch (e) {
            console.error(e);
        }
    };

    // Load a saved prompt back into the form
    const loadPrompt = async (savedPrompt: any) => {
        try {
            setCurrentPromptId(savedPrompt.id);
            // Set framework
            setActiveFramework(savedPrompt.framework);

            // Set fields
            const parsedFields = JSON.parse(savedPrompt.fields);
            setFields(parsedFields);

            // Set tones
            const parsedTones = JSON.parse(savedPrompt.tones);
            setSelectedTones(parsedTones);

            // Set simple idea
            setSimpleIdea(savedPrompt.simpleIdea || '');

            // Set industry/role if exists
            if (savedPrompt.industry) {
                setActiveIndustry(savedPrompt.industry);
            }
            if (savedPrompt.role) {
                setActiveRole(savedPrompt.role);
            }

            // Set generated prompt
            setGeneratedPrompt(savedPrompt.prompt);

            // Set quality score if exists
            if (savedPrompt.qualityScoreDetails) {
                const parsedQuality = JSON.parse(savedPrompt.qualityScoreDetails);
                setQualityScore(parsedQuality);
            }
        } catch (e) {
            console.error('Failed to load prompt:', e);
        }
    };

    return (
        <PromptContext.Provider value={{
            fields, activeFramework, selectedTones, simpleIdea, attachments, generatedPrompt,
            isGenerating, isExpanding, isAnalyzing, isImproving, qualityScore, llmConfig,
            fieldHistory, historyIndex, requestChainOfThought,
            activeIndustry, activeRole, complexity, currentPromptId,
            setField, setFields, setFramework, toggleTone, setComplexity, toggleChainOfThought, setSimpleIdea,
            addAttachment, removeAttachment,
            undoField, redoField, updateConfig, resetAll,
            selectIndustry, selectRole, clearIndustry, clearRole,
            expandIdea, generatePrompt, analyzeQuality, improvePrompt, loadPrompt,
            generateSuggestions, autoFillOutputStopping
        }}>
            {children}
        </PromptContext.Provider>
    );
};
export const usePrompt = () => {
    const context = useContext(PromptContext);
    if (context === undefined) {
        throw new Error('usePrompt must be used within a PromptProvider');
    }
    return context;
};
