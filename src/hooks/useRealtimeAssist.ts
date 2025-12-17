import { useState, useEffect, useRef } from 'react';
import { usePrompt } from '@/contexts/PromptContext';
import { LLMService } from '@/services/llm';

interface Suggestion {
    type: 'completion' | 'context' | 'refinement';
    text: string;
}

interface RealtimeAssistOptions {
    isEnabled?: boolean;
    debounceMs?: number;
    minChars?: number;
    context?: string;
    fieldLabel?: string;
}

export const useRealtimeAssist = (
    text: string,
    options: RealtimeAssistOptions = {}
) => {
    // Ultra-fast debounce
    const { isEnabled = true, debounceMs = 300, minChars = 15, context = '', fieldLabel = 'field' } = options;
    const { llmConfig } = usePrompt();

    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track the last processed text to avoid re-fetching identical text
    const lastProcessedText = useRef<string>('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Reset if text is cleared or too short
        if (!text || text.length < minChars) {
            setSuggestions([]);
            return;
        }

        if (!isEnabled) return;
        if (text === lastProcessedText.current) return;

        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new debounce timeout
        timeoutRef.current = setTimeout(async () => {
            // Don't fetch if LLM not configured
            if (llmConfig.providerId !== 'local' && !llmConfig.apiKey) return;

            setIsLoading(true);

            try {
                const provider = LLMService.getInstance().getProvider(llmConfig.providerId);

                // Ultra-Minimal System Prompt
                const systemPrompt = `Role: Fast typing assistant.
Context: "${fieldLabel}". ${context}
Provide 3 brief suggestions used to autocomplete or refine the user's text.
Schema: { "suggestions": [{ "type": "completion", "text": "..." }, { "type": "context", "text": "..." }, { "type": "refinement", "text": "..." }] }`;

                const userPrompt = `INPUT: "${text}"`;

                const response = await provider.generateJSON<{ suggestions: Suggestion[] }>({
                    config: llmConfig,
                    systemPrompt,
                    userPrompt,
                    temperature: 0.3, // High determinism for speed
                    maxTokens: 150    // Hard cap on generation length
                });

                if (response && response.suggestions && Array.isArray(response.suggestions)) {
                    setSuggestions(response.suggestions.slice(0, 3));
                    lastProcessedText.current = text;
                }

            } catch (err) {
                console.warn("Realtime assist failed", err);
                setError("Failed to fetch suggestions");
            } finally {
                setIsLoading(false);
            }

        }, debounceMs);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [text, isEnabled, debounceMs, minChars, llmConfig, context, fieldLabel]);

    const clearSuggestions = () => setSuggestions([]);

    return {
        suggestions,
        isLoading,
        error,
        clearSuggestions
    };
};
