import { CompletionPayload, JsonPayload, LLMConfig, LLMProviderId } from '@/types';

// Helper to parse JSON from LLM output that might contain markdown blocks
// Helper to parse JSON from LLM output that might contain markdown blocks
export function parseRobustJSON<T = any>(text: string): T {
    try {
        // 1. Try direct parse
        return JSON.parse(text);
    } catch (e) {
        // 2. Try stripping markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                return JSON.parse(jsonMatch[1]);
            } catch (e2) {
                // continue
            }
        }

        // 3. Bruteforce find JSON object or array
        // Find the first { or [
        const firstOpenBrace = text.indexOf('{');
        const firstOpenBracket = text.indexOf('[');
        let start = -1;
        let end = -1;

        if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
            start = firstOpenBrace;
            end = text.lastIndexOf('}');
        } else if (firstOpenBracket !== -1) {
            start = firstOpenBracket;
            end = text.lastIndexOf(']');
        }

        if (start !== -1 && end !== -1 && end > start) {
            try {
                const potentialJson = text.substring(start, end + 1);
                return JSON.parse(potentialJson);
            } catch (e3) {
                // continue
            }
        }

        console.error("Failed to parse JSON:", text);
        throw new Error('No valid JSON found in response. The AI model might be outputting plain text instead of JSON structure.');
    }
}

export abstract class LLMProvider {
    abstract generateCompletion(payload: CompletionPayload): Promise<string>;
    abstract generateJSON<T = any>(payload: JsonPayload): Promise<T>;
    abstract listModels(config: LLMConfig): Promise<string[]>;

    async testConnection(config: LLMConfig): Promise<void> {
        try {
            await this.generateCompletion({
                userPrompt: 'Hi',
                config,
                temperature: 0.1,
            });
        } catch (error: any) {
            throw error;
        }
    }

    protected cleanUrl(url: string): string {
        const cleaned = url.replace(/\/+$/, '');

        // Auto-detect and route through local proxy for known CORS-blocking providers
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            if (cleaned.includes('api.anthropic.com')) return cleaned.replace('https://api.anthropic.com', '/api/anthropic');
            if (cleaned.includes('api.deepseek.com')) return cleaned.replace('https://api.deepseek.com', '/api/deepseek');
            if (cleaned.includes('api.moonshot.cn')) return cleaned.replace('https://api.moonshot.cn', '/api/moonshot');
            if (cleaned.includes('open.bigmodel.cn')) return cleaned.replace('https://open.bigmodel.cn', '/api/glm');
            if (cleaned.includes('api.openai.com')) return cleaned.replace('https://api.openai.com', '/api/openai');
            if (cleaned.includes('generativelanguage.googleapis.com')) return cleaned.replace('https://generativelanguage.googleapis.com', '/api/gemini');
            if (cleaned.includes('api.mistral.ai')) return cleaned.replace('https://api.mistral.ai', '/api/mistral');
            if (cleaned.includes('api.x.ai')) return cleaned.replace('https://api.x.ai', '/api/grok');
        }

        return cleaned;
    }
}

class OpenAICompatibleProvider extends LLMProvider {
    async generateCompletion(payload: CompletionPayload): Promise<string> {
        const { config, systemPrompt, userPrompt, temperature } = payload;

        if (!config.apiKey) throw new Error('API Key is missing. Please check your settings.');
        // Check baseUrl for custom, but allow default OpenAI logic or others

        const baseUrl = config.baseUrl || 'https://api.openai.com/v1'; // Default to OpenAI if empty
        const cleanBase = this.cleanUrl(baseUrl);

        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: userPrompt });

        try {
            const response = await fetch(`${cleanBase}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: config.model,
                    messages,
                    temperature: temperature ?? 0.7,
                    max_tokens: 4096,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error: any) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Network error: Failed to reach the API. Check CORS/connection.');
            }
            throw error;
        }
    }

    async generateJSON<T = any>(payload: JsonPayload): Promise<T> {
        const jsonPrompt = payload.userPrompt + "\n\nIMPORTANT: Respond ONLY with valid JSON.";
        const content = await this.generateCompletion({ ...payload, userPrompt: jsonPrompt });
        return parseRobustJSON<T>(content);
    }

    async listModels(config: LLMConfig): Promise<string[]> {
        const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
        const cleanBase = this.cleanUrl(baseUrl);

        // Some providers might not support listing, but we try standard endpoint
        try {
            const response = await fetch(`${cleanBase}/models`, {
                headers: { 'Authorization': `Bearer ${config.apiKey}` }
            });
            if (!response.ok) return [];
            const data = await response.json();
            return data.data?.map((m: any) => m.id) || [];
        } catch (e) {
            return [];
        }
    }
}

class GeminiProvider extends LLMProvider {
    private getBaseUrl(config: LLMConfig): string {
        let url = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
        url = this.cleanUrl(url);
        if (!url.endsWith('v1beta')) {
            url = `${url}/v1beta`;
        }
        return url;
    }

    async generateCompletion(payload: CompletionPayload): Promise<string> {
        const { config, systemPrompt, userPrompt, temperature } = payload;
        if (!config.apiKey) throw new Error('API Key is missing');

        const cleanBase = this.getBaseUrl(config);
        // Construct URL with API key for Gemini
        const url = `${cleanBase}/models/${config.model}:generateContent?key=${config.apiKey}`;

        // Combine system and user prompt effectively for Gemini
        const parts = [];
        if (systemPrompt) parts.push({ text: `System: ${systemPrompt}` });
        parts.push({ text: userPrompt });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: {
                        temperature: temperature ?? 0.7,
                        maxOutputTokens: 8192
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Gemini Error ${response.status}: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (error: any) {
            if (error.message === 'Failed to fetch') throw new Error('Network error reaching Gemini.');
            throw error;
        }
    }

    async generateJSON<T = any>(payload: JsonPayload): Promise<T> {
        const jsonPrompt = payload.userPrompt + "\n\nOutput strict valid JSON.";
        const content = await this.generateCompletion({ ...payload, userPrompt: jsonPrompt });
        return parseRobustJSON<T>(content);
    }

    async listModels(config: LLMConfig): Promise<string[]> {
        const cleanBase = this.getBaseUrl(config);
        try {
            const response = await fetch(`${cleanBase}/models?key=${config.apiKey}`);
            if (!response.ok) return [];
            const data = await response.json();
            // Gemini returns "name": "models/gemini-pro". We want just "gemini-pro"
            return data.models?.map((m: any) => m.name.replace('models/', '')) || [];
        } catch (e) {
            return [];
        }
    }
}

class AnthropicProvider extends LLMProvider {
    private getBaseUrl(config: LLMConfig): string {
        return this.cleanUrl(config.baseUrl || 'https://api.anthropic.com/v1');
    }

    async generateCompletion(payload: CompletionPayload): Promise<string> {
        const { config, systemPrompt, userPrompt, temperature } = payload;

        if (!config.apiKey) throw new Error('API Key is missing. Please check your settings.');

        try {
            const response = await fetch(`${this.getBaseUrl(config)}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': config.apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: config.model,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: userPrompt }],
                    max_tokens: 4096,
                    temperature: temperature ?? 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Anthropic Error ${response.status}: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.content[0].text;
        } catch (error: any) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Network error: Could not reach Anthropic API. Ensure you are connected to the internet.');
            }
            throw error;
        }
    }

    async generateJSON<T = any>(payload: JsonPayload): Promise<T> {
        const jsonPrompt = payload.userPrompt + "\n\nRespond ONLY with valid JSON. Do not include any explanation.";
        const content = await this.generateCompletion({ ...payload, userPrompt: jsonPrompt });
        return parseRobustJSON<T>(content);
    }

    async listModels(_config: LLMConfig): Promise<string[]> {
        return [
            'claude-3-5-sonnet-20240620',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ];
    }
}

// Concrete Implementations with default configs
export class DeepSeekProvider extends OpenAICompatibleProvider { }
export class KimiProvider extends OpenAICompatibleProvider { }
export class GLMProvider extends OpenAICompatibleProvider { }
export class MistralProvider extends OpenAICompatibleProvider { }
// OpenAI is just standard compatible
export class OpenAIProvider extends OpenAICompatibleProvider { }
export class GrokProvider extends OpenAICompatibleProvider {
    async listModels(config: LLMConfig): Promise<string[]> {
        try {
            const models = await super.listModels(config);
            if (models.length > 0) return models;
        } catch (e) {
            // ignore error and fall back
        }
        return ['grok-beta', 'grok-vision-beta', 'grok-2', 'grok-2-mini'];
    }
}

export class LocalProvider extends OpenAICompatibleProvider {
    async generateCompletion(payload: CompletionPayload): Promise<string> {
        // Relax API key requirement for local LLMs
        const { config, systemPrompt, userPrompt, temperature } = payload;
        const baseUrl = config.baseUrl || 'http://localhost:11434/v1';
        const cleanBase = this.cleanUrl(baseUrl);

        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: userPrompt });

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (config.apiKey) {
                headers['Authorization'] = `Bearer ${config.apiKey}`;
            }

            const response = await fetch(`${cleanBase}/chat/completions`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: config.model,
                    messages,
                    temperature: temperature ?? 0.7,
                    max_tokens: 4096,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Local LLM Error ${response.status}: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error: any) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Network error: Is your Local LLM running? (e.g. Ollama, LM Studio)');
            }
            throw error;
        }
    }

    async listModels(config: LLMConfig): Promise<string[]> {
        const baseUrl = config.baseUrl || 'http://localhost:11434/v1';
        const cleanBase = this.cleanUrl(baseUrl);
        try {
            const headers: Record<string, string> = {};
            if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;

            const response = await fetch(`${cleanBase}/models`, { headers });
            if (!response.ok) return [];
            const data = await response.json();
            // Ollama returns { models: [...] }, OpenAI returns { data: [...] }
            if (data.models) return data.models.map((m: any) => m.name || m.id);
            if (data.data) return data.data.map((m: any) => m.id);
            return [];
        } catch (e) {
            return [];
        }
    }
}

// Factory/Service
export class LLMService {
    private static instance: LLMService;
    private providers: Map<LLMProviderId, LLMProvider> = new Map();

    private constructor() {
        this.providers.set('anthropic', new AnthropicProvider());
        this.providers.set('deepseek', new DeepSeekProvider());
        this.providers.set('kimi', new KimiProvider());
        this.providers.set('glm', new GLMProvider());
        this.providers.set('openai', new OpenAIProvider());
        this.providers.set('gemini', new GeminiProvider());
        this.providers.set('mistral', new MistralProvider());
        this.providers.set('mistral', new MistralProvider());
        this.providers.set('grok', new GrokProvider());
        this.providers.set('local', new LocalProvider());
        this.providers.set('custom', new OpenAICompatibleProvider()); // Generic fallback
    }

    public static getInstance(): LLMService {
        if (!LLMService.instance) {
            LLMService.instance = new LLMService();
        }
        return LLMService.instance;
    }

    public getProvider(id: LLMProviderId): LLMProvider {
        const provider = this.providers.get(id);
        if (!provider) {
            return this.providers.get('custom')!;
        }
        return provider;
    }
}
