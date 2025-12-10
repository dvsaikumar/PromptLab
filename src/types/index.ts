export type FrameworkId = 'rtcros' | 'create' | 'race' | 'rise' | 'costar' | 'kernel' | 'pare' | 'tag' | 'care' | 'aps' | 'elicit' | 'scoped' | 'roses' | 'tracer' | 'c4' | 'devops' | 'ddd';

export type ComplexityLevel = 'direct' | 'contextual' | 'detailed';

export interface FieldDefinition {
    id: string;
    label: string;
    description: string;
    placeholder?: string;
}

export interface Framework {
    id: FrameworkId;
    name: string;
    description: string;
    bestFor?: string;
    fields: FieldDefinition[];
}

export interface Tone {
    value: string;
    label: string;
    description: string;
}

export interface QualityScore {
    overallScore: number;
    maxScore: number; // usually 100
    rating: string;
    clarity: number;
    specificity: number;
    structure: number;
    completeness: number;
    actionability: number;
    strengths: string[];
    improvements: string[];
}

export type LLMProviderId = 'deepseek' | 'kimi' | 'glm' | 'anthropic' | 'openai' | 'gemini' | 'mistral' | 'grok' | 'qwen' | 'openrouter' | 'local' | 'custom';

export interface LLMConfig {
    providerId: LLMProviderId;
    apiKey: string;
    baseUrl?: string;
    model: string;
}

export interface CompletionPayload {
    systemPrompt?: string;
    userPrompt: string;
    config: LLMConfig;
    temperature?: number;
}

export interface JsonPayload extends CompletionPayload {
    schema?: object; // Optional schema hint
}

export interface FieldState {
    [key: string]: string;
}

export interface HistoryState {
    [fieldId: string]: string[];
}


export interface HistoryIndex {
    [fieldId: string]: number;
}

export interface Attachment {
    name: string;
    content: string;
    type: string;
}

export interface Template {
    id: string;
    label: string;
    icon: string;
    description: string;
    frameworkId: FrameworkId;
    tones: string[];
    prefill: FieldState;
}
