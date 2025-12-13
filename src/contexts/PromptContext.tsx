import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FrameworkId, LLMConfig, QualityScore, FieldState, HistoryState, HistoryIndex, Framework, Attachment, Template, ComplexityLevel } from '../types';
import { FRAMEWORKS, TONES, INDUSTRY_TEMPLATES, ROLE_PRESETS } from '../constants';
import { LLMService } from '../services/llm';
import { estimateTokens } from '../utils/tokenEstimator';
import toast from 'react-hot-toast';
import { llmConfigDB } from '../services/llmConfigDB';
import { promptDB } from '../services/database';
import { vectorDb } from '../services/vectorDbService';
import { PERSONAS } from '../constants/personas';

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
    executionTime?: number; // In seconds
    totalInputTokens: number;
    totalOutputTokens: number;
    activePersonaId: string;

    // Actions
    setField: (fieldId: string, value: string) => void;
    setFields: (fields: FieldState) => void;
    setFramework: (id: FrameworkId) => void;
    toggleTone: (tone: string) => void;
    setComplexity: (level: ComplexityLevel) => void;
    toggleChainOfThought: () => void;
    setSimpleIdea: (idea: string) => void;
    setGeneratedPrompt: (prompt: string) => void;
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
    setActivePersonaId: (id: string) => void;

    // LLM Operations
    expandIdea: () => Promise<void>;
    generatePrompt: () => Promise<void>;
    analyzeQuality: (promptText?: string) => Promise<void>;
    improvePrompt: () => Promise<void>;
    generateSuggestions: (fieldId: string) => Promise<string[]>;
    autoFillOutputStopping: () => Promise<void>;
    loadPrompt: (savedPrompt: any) => Promise<void>;
    assemblePrompt: () => void;
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
    const [activePersonaId, setActivePersonaId] = useState<string>('prompt-engineer');
    const [currentPromptId, setCurrentPromptId] = useState<number | null>(null);
    const [executionTime, setExecutionTime] = useState<number | undefined>(undefined);
    const [totalInputTokens, setTotalInputTokens] = useState(0);
    const [totalOutputTokens, setTotalOutputTokens] = useState(0);
    const [autoFillTokens, setAutoFillTokens] = useState(0);

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

    // Calculate Input Tokens
    useEffect(() => {
        const model = llmConfig.model;
        let total = 0;

        // 1. Simple Idea
        total += estimateTokens(simpleIdea, model);

        // 2. Attachments
        attachments.forEach(att => {
            total += estimateTokens(att.content, model);
        });

        // 3. Framework Fields
        Object.values(fields).forEach(val => {
            total += estimateTokens(val, model);
        });

        // 4. Tone / Role / Industry (Approx 20 tokens each overhead) + System Prompt Base (~100)
        if (activeIndustry) total += 20;
        if (activeRole) total += 20;
        total += selectedTones.length * 5;
        total += 100; // System prompt + JSON overhead base

        setTotalInputTokens(total);
    }, [simpleIdea, fields, attachments, activeIndustry, activeRole, selectedTones, llmConfig.model]);

    // Calculate Output Tokens
    useEffect(() => {
        const model = llmConfig.model;
        let total = 0;

        // 1. Generated Prompt
        total += estimateTokens(generatedPrompt, model);

        // 2. Quality Score
        if (qualityScore) {
            total += estimateTokens(JSON.stringify(qualityScore), model);
        }

        // 3. Auto-Filled Fields (If present)
        total += autoFillTokens;

        setTotalOutputTokens(total);
    }, [generatedPrompt, qualityScore, autoFillTokens, llmConfig.model]);

    useEffect(() => {
        // Save to IndexedDB when config changes
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
        setActivePersonaId('prompt-engineer');
        setComplexity('direct');
        setCurrentPromptId(null);
        setExecutionTime(undefined);
        setTotalInputTokens(0);
        setTotalOutputTokens(0);
        setAutoFillTokens(0);
    };

    const selectIndustry = (template: Template) => {
        setActiveIndustry(template.id);
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
            toast.error('API Key Required');
            return;
        }

        setIsExpanding(true);
        try {
            const framework = getCurrentFramework();
            const toneLabels = selectedTones.map(t => TONES.find(opt => opt.value === t)?.label).join(', ');

            // Find active templates
            const industryObj = INDUSTRY_TEMPLATES.find(t => t.id === activeIndustry);
            const roleObj = ROLE_PRESETS.find(t => t.id === activeRole);
            const activePersona = PERSONAS.find(p => p.id === activePersonaId) || PERSONAS[0];

            let promptContent = `Simple Idea: "${simpleIdea}"`;

            if (attachments.length > 0) {
                promptContent += `\n\n--- Attached Context ---\n`;
                attachments.forEach(att => {
                    promptContent += `\nFile: ${att.name}\nContent:\n${att.content}\n----------------\n`;
                });
            }

            let roleInstruction = activePersona.prompt;
            let templateContext = "";

            if (industryObj || roleObj) {
                const parts: string[] = [];
                if (roleObj) parts.push(`Role: ${roleObj.label}`);
                if (industryObj) parts.push(`Industry: ${industryObj.label}`);

                roleInstruction += `\nAdditional Context: You are acting as a specialized AI. ${parts.join('. ')}.`;

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

            // Robust Key Normalization
            const normalizedResult: FieldState = {};
            if (result && typeof result === 'object') {
                Object.keys(result).forEach(key => {
                    if (framework.fields.some(f => f.id === key)) {
                        normalizedResult[key] = result[key];
                        return;
                    }
                    const lowerKey = key.toLowerCase();
                    const matchingField = framework.fields.find(f => f.id.toLowerCase() === lowerKey);
                    if (matchingField) {
                        normalizedResult[matchingField.id] = result[key];
                    }
                });
            }

            setFields(prev => ({ ...prev, ...normalizedResult }));

            const tokens = estimateTokens(JSON.stringify(result), llmConfig.model);
            setAutoFillTokens(tokens);

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
            toast.error('API Key Required');
            return;
        }

        setIsGenerating(true);
        setGeneratedPrompt('');
        setExecutionTime(undefined);
        const startTime = Date.now();

        try {
            const framework = getCurrentFramework();
            const filledFields = framework.fields
                .filter(f => fields[f.id])
                .map(f => `## ${f.label}\n${fields[f.id]}`)
                .join('\n\n');

            const toneLabels = selectedTones.map(t => TONES.find(opt => opt.value === t)?.label).join(', ');

            // Dynamic Persona Injection
            const activePersona = PERSONAS.find(p => p.id === activePersonaId) || PERSONAS[0];

            const GOD_MODE_GENERATOR_PROTOCOL = `
<GOD_MODE_GENERATOR_PROTOCOL>
You are acting as a "Meta-Prompt Engineer" with the combined intelligence of Claude Sonnet 4.5 and Gemini Vibe Coder.

**PHASE 1: Deconstruction (Deep Analysis)**
- Identify the User's Core Intent (beyond the literal words).
- Extrapolate implied "Hidden Constraints" (e.g., if they ask for a landing page, they imply *high conversion*).
- Determine the optimal Persona (e.g., "Senior React Architect" vs "Creative Director").

**PHASE 2: Mental Sandbox (Simulation)**
- Run a mental simulation of the prompt's output.
- *Check*: Will it produce hallucinations? -> Add "Strict Evidence" constraints.
- *Check*: Will it be generic? -> Inject "Wow Factor" / "Vibe" instructions.
- *Check*: Is it technically sound? -> Enforce "Type Safety" and "Modern Stack" rules.

**PHASE 3: Construction (The Bible Standard)**
- **Structure**: Use the specific Framework structure chosen (e.g., CO-STAR).
- **Clarity**: Use aggressive Markdown formatting (Headers, Lists).
- **Functionality**: Explicitly forbid "placeholders" or "lazy code".

**PHASE 4: Final Polish (God Mode)**
- Review the generated prompt against the "God Mode" standard.
- Ensure it forces the AI to be **MECE** (Mutually Exclusive, Collectively Exhaustive).
</GOD_MODE_GENERATOR_PROTOCOL>`;

            let systemPrompt = `${activePersona.prompt}

${GOD_MODE_GENERATOR_PROTOCOL}

Your goal is to generate a high-quality, structured AI prompt based on the user's input.
The output must be a **Ready-to-Use Prompt**.
Do not output the thinking process, only the final prompt.

The output must be a single, cohesive System Prompt using the ${framework.name} framework structure.

***CORE PRINCIPLES***
1. **Authoritative Identity**: The prompt must explicitly define the AI's role, mission, and authority.
2. **Modular Structure**: Use Markdown headers (e.g., # Identity, ## Rules, ## Workflow) to organize instructions.
3. **Negative Constraints**: Explicitly state what the AI must NOT do.
4. **Examples as Truth**: Treat examples as canonical references.

**TONE & STYLE**
Tone target: ${toneLabels || 'Professional, Precise, and Direct'}.`;

            if (requestChainOfThought) {
                systemPrompt += `\n**REQUIREMENT**: You MUST include a "Thinking Process" or "Chain of Thought" section in the generated prompt, instructing the model to think step-by-step before executing the task.`;
            }

            // Complexity-based constraints
            let outputConstraints = "";
            switch (complexity) {
                case 'direct':
                    outputConstraints = `
                    **COMPLEXITY: LEAN (Mini-Bible)**
                    - Keep the System Prompt concise and punchy.
                    - Focus on the "One True Path" to the solution.
                    - Maximize content density. Limit to ~1000 tokens of output.
                    - Use bullet points for speed reading.`;
                    break;
                case 'contextual':
                    outputConstraints = `
                    **COMPLEXITY: STANDARD (The Handbook)**
                    - Create a balanced System Prompt suitable for production use.
                    - Include clear "Context" and "Constraint" sections.
                    - Ensure logical flow between the ${framework.name} components.
                    - Target ~2000-4000 tokens of thoughtful instruction.`;
                    break;
                case 'detailed':
                    outputConstraints = `
                    **COMPLEXITY: COMPREHENSIVE (The Bible)**
                    - Leave nothing to interpretation. Define every edge case.
                    - Expand on the "Context" and "Persona" deeply.
                    - Create distinct sections for "Protocols", "Exceptions", and "Format Reference".
                    - The output should feel like a technical specification document.`;
                    break;
            }

            systemPrompt += `\n${outputConstraints}`;
            systemPrompt += `\n\n**FINAL INSTRUCTION**: Output ONLY the generated System Prompt. Do not include introductory text like "Here is your prompt". Start directly with the content.`;

            const userPrompt = `***INPUT DATA***\nThe user has provided the following components for the ${framework.name} framework:\n\n${filledFields}`;

            const result = await getLLMService().generateCompletion({
                systemPrompt,
                userPrompt,
                config: llmConfig
            });

            setGeneratedPrompt(result);
            setExecutionTime((Date.now() - startTime) / 1000);

            // Auto-Save to History
            // Fire-and-Forget: Save to History & Vector DB
            const historyData = {
                framework: activeFramework,
                prompt: result,
                fields: JSON.stringify(fields),
                tones: JSON.stringify(selectedTones),
                industry: activeIndustry || undefined,
                role: activeRole || undefined,
                simpleIdea,
                createdAt: new Date().toISOString(),
                providerId: llmConfig.providerId,
                model: llmConfig.model
            };

            const savePromises: Promise<any>[] = [
                promptDB.addHistory(historyData).catch(e => console.error("History save failed", e))
            ];

            if (vectorDb.isAvailable()) {
                try {
                    const vector = vectorDb.generateDummyEmbedding(result);
                    savePromises.push(
                        vectorDb.addDocuments('prompts', [{
                            title: simpleIdea || "Generated History",
                            text: result,
                            category: 'history',
                            vector,
                            timestamp: new Date().toISOString()
                        }]).catch(e => console.error("Vector history save failed", e))
                    );
                } catch (e) {
                    console.error("Vector generation failed", e);
                }
            }

            // Execute without awaiting (fire-and-forget)
            Promise.all(savePromises);

            await analyzeQuality(result);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const assemblePrompt = () => {
        const startTime = Date.now();
        setGeneratedPrompt('');

        try {
            const framework = getCurrentFramework();
            const toneLabels = selectedTones.map(t => TONES.find(opt => opt.value === t)?.label).join(', ');

            let assembled = `# ${framework.name} Prompt\n\n`;

            if (toneLabels) {
                assembled += `**Tone:** ${toneLabels}\n\n`;
            }

            framework.fields.forEach(field => {
                const value = fields[field.id];
                if (value && value.trim()) {
                    assembled += `### ${field.label}\n${value.trim()}\n\n`;
                }
            });

            assembled += `---\nGenerated with PromptForge`;

            setGeneratedPrompt(assembled);
            setExecutionTime((Date.now() - startTime) / 1000);
            toast.success('Prompt assembled instantly!');

        } catch (error) {
            console.error('Assembly failed', error);
            toast.error('Failed to assemble prompt');
        }
    };

    const analyzeQuality = async (promptText?: string) => {
        const prompt = promptText || generatedPrompt;
        if (!prompt) return;

        setIsAnalyzing(true);
        try {
            const analysisPrompt = `Analyze this prompt quality (0-100).
      Prompt: ${prompt}
      
      Respond with valid JSON only:
      {
        "overallScore": number,
        "rating": "Poor"|"Fair"|"Good"|"Excellent"|"Outstanding",
        "clarity": number,
        "specificity": number,
        "structure": number,
        "completeness": number,
        "actionability": number,
        "strengths": ["string"],
        "improvements": ["string"]
      }`;

            const result = await getLLMService().generateJSON<QualityScore>({
                userPrompt: analysisPrompt,
                config: llmConfig
            });

            if (result && typeof result.overallScore === 'number') {
                setQualityScore({
                    ...result,
                    strengths: result.strengths || [],
                    improvements: result.improvements || []
                });
            } else {
                throw new Error('Invalid analysis format');
            }
        } catch (error) {
            console.error('Analysis failed', error);
            toast.error('Could not generate quality score');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const improvePrompt = async () => {
        if (!generatedPrompt) return;
        setIsImproving(true);

        const previousScoreVal = qualityScore?.overallScore || 0;

        try {
            const prompt = `You are a Principal Prompt Architect.
            
            GOAL: Optimize this System Prompt to achieve a perfect 100/100 quality score.
            
            **CRITICAL INSTRUCTIONS**
            1. **Maintain Structure**: Keep the existing "System Prompt Bible" format (Identity, Rules, Workflow).
            2. **Fix Weaknesses**: Address these specific issues: ${qualityScore?.improvements.join(', ') || 'General refinement'}.
            3. **Elevate Authority**: Ensure the tone is authoritative and precise.
            
            Current Prompt:
            ${generatedPrompt}
        
            Output ONLY the improved System Prompt. No commentary.`;

            const candidatePrompt = await getLLMService().generateCompletion({
                userPrompt: prompt,
                config: llmConfig
            });

            const analysisPrompt = `Analyze this prompt quality (0-100).
            Prompt: ${candidatePrompt}
            
            Respond with valid JSON only:
            {
              "overallScore": number,
              "rating": "Poor"|"Fair"|"Good"|"Excellent"|"Outstanding",
              "clarity": number,
              "specificity": number,
              "structure": number,
              "completeness": number,
              "actionability": number,
              "strengths": ["string"],
              "improvements": ["string"]
            }`;

            const candidateScore = await getLLMService().generateJSON<QualityScore>({
                userPrompt: analysisPrompt,
                config: llmConfig
            });

            if (candidateScore.overallScore >= previousScoreVal) {
                setGeneratedPrompt(candidatePrompt);
                setQualityScore({
                    ...candidateScore,
                    strengths: candidateScore.strengths || [],
                    improvements: candidateScore.improvements || []
                });
                toast.success(`Broadened to ${candidateScore.overallScore}/100!`);
            } else {
                toast.error(`Optimization dropped score (${candidateScore.overallScore}). Retaining original.`);
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
            if (fieldId === 'simpleIdea') {
                const prompt = `Provide 3 concrete, creative refinements or specific examples for this initial prompt idea:
                "${simpleIdea}"
                
                Goal: Make it more specific, actionable, or detailed.
                Respond JSON: { "suggestions": ["s1", "s2", "s3"] }`;

                const res = await getLLMService().generateJSON<{ suggestions: string[] }>({
                    userPrompt: prompt,
                    config: llmConfig,
                    temperature: 0.7
                });
                return res.suggestions || [];
            }

            const framework = getCurrentFramework();
            const field = framework.fields.find(f => f.id === fieldId);
            if (!field) return [];

            const contextFields = framework.fields.slice(0, framework.fields.indexOf(field));
            const contextStr = contextFields.map(f => `${f.label}: ${fields[f.id] || ''}`).join('\n');

            const prompt = `Provide 3 smart suggestions for the "${field.label}" field in ${framework.name} framework.
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

    const loadPrompt = async (savedPrompt: any) => {
        try {
            setCurrentPromptId(savedPrompt.id);
            setActiveFramework(savedPrompt.framework);
            setFields(JSON.parse(savedPrompt.fields));
            setSelectedTones(JSON.parse(savedPrompt.tones));
            setSimpleIdea(savedPrompt.simpleIdea || '');
            if (savedPrompt.industry) setActiveIndustry(savedPrompt.industry);
            if (savedPrompt.role) setActiveRole(savedPrompt.role);
            setGeneratedPrompt(savedPrompt.prompt);

            if (savedPrompt.qualityScoreDetails) {
                try {
                    const parsedQuality = JSON.parse(savedPrompt.qualityScoreDetails);
                    setQualityScore({
                        overallScore: parsedQuality.overallScore ?? savedPrompt.qualityScore ?? 0,
                        rating: parsedQuality.rating ?? 'Good',
                        clarity: parsedQuality.clarity ?? 0,
                        specificity: parsedQuality.specificity ?? 0,
                        structure: parsedQuality.structure ?? 0,
                        completeness: parsedQuality.completeness ?? 0,
                        actionability: parsedQuality.actionability ?? 0,
                        strengths: parsedQuality.strengths ?? [],
                        improvements: parsedQuality.improvements ?? [],
                        maxScore: 100
                    });
                } catch (err) {
                    setQualityScore(null);
                }
            } else if (savedPrompt.qualityScore) {
                setQualityScore({
                    overallScore: savedPrompt.qualityScore,
                    rating: 'Good',
                    clarity: 0,
                    specificity: 0,
                    structure: 0,
                    completeness: 0,
                    actionability: 0,
                    strengths: [],
                    improvements: [],
                    maxScore: 100
                });
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
            activeIndustry, activeRole, complexity, currentPromptId, executionTime,
            setField, setFields, setFramework, toggleTone, setComplexity, toggleChainOfThought, setSimpleIdea,
            addAttachment, removeAttachment, setGeneratedPrompt,
            undoField, redoField, updateConfig, resetAll,
            selectIndustry, selectRole, clearIndustry, clearRole,
            expandIdea, generatePrompt, assemblePrompt, analyzeQuality, improvePrompt, loadPrompt,
            generateSuggestions, autoFillOutputStopping, totalInputTokens, totalOutputTokens,
            activePersonaId, setActivePersonaId
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
