
export const estimateTokens = (text: string, _model: string): number => {
    if (!text) return 0;
    // Simple estimation: chars / 4
    return Math.ceil(text.length / 4);
};
