
export const estimateTokens = (text: string, model: string): number => {
    if (!text) return 0;

    // Normalize text: remove markdown artifacts that might not be tokenized 1:1, 
    // but usually raw text is fine.

    const charCount = text.length;

    // Heuristics based on common models
    // GPT-4 and GPT-3.5 ~ 4 characters per token
    // Claude ~ 3.5 - 4 characters per token
    // Gemini ~ 4 characters per token
    // Llama ~ 4 characters per token

    // A more accurate simple estimation is usually words * 1.33 or chars / 4.

    // Let's refine based on specific model families if known behavior differs significantly.
    // For now, the standard approximation is robust enough for UI feedback.

    // GPT Models (OpenAI)
    if (model.includes('gpt') || model.includes('o1')) {
        // ~4 chars/token is standard for cl100k_base
        return Math.ceil(charCount / 4);
    }

    // Claude Models (Anthropic)
    if (model.includes('claude')) {
        // Claude typically has a similar tokenization density
        return Math.ceil(charCount / 3.8); // Slightly denser often
    }

    // Gemini Models (Google)
    if (model.includes('gemini')) {
        // Gemini tokenizer is quite efficient
        return Math.ceil(charCount / 4);
    }

    // Default Fallback
    return Math.ceil(charCount / 4);
};
