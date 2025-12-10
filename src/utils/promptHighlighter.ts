
export type HighlightType = 'normal' | 'vague' | 'constraint' | 'context';

export interface HighlightSegment {
    text: string;
    type: HighlightType;
    tooltip?: string;
    replacement?: string;
}

const VAGUE_PATTERNS: { regex: RegExp, suggestion: string }[] = [
    { regex: /\b(briefly|short)\b/gi, suggestion: "in 2-3 sentences" },
    { regex: /\b(some|various|multiple)\b/gi, suggestion: "3-5 distinct" },
    { regex: /\b(interesting|engaging|good|bad|nice)\b/gi, suggestion: "compelling and action-oriented" },
    { regex: /\b(maybe|sometime)\b/gi, suggestion: "definitely" },
    { regex: /\b(make it pop|jazz it up)\b/gi, suggestion: "use vivid imagery" },
    { regex: /\b(think about)\b/gi, suggestion: "analyze step-by-step" },
    { regex: /\b(help me)\b/gi, suggestion: "act as an expert to" },
    { regex: /\b(stuff|things)\b/gi, suggestion: "specific components" }
];

const CONSTRAINT_PATTERNS = [
    /\b(DO NOT|ALWAYS|MUST|NEVER|STRICTLY|REQUIRED|CRITICAL|CONSTRAINT|Output format|JSON|Markdown|CSV)\b/g,
    /\b(Max|Min) \d+/gi,
    /\b(Limit to|fewer than|more than)\b/gi,
    /\b(no yapping|no preamble)\b/gi,
    /\b(only)\b/gi
];

const CONTEXT_PATTERNS = [
    /\{\{.*?\}\}/g,
    /\[.*?\]/g,
    /\b(context|input data|attached file|source material)\b/gi,
    /\b(based on the)\b/gi
];

export function analyzePromptHighlights(text: string): HighlightSegment[] {
    if (!text) return [];

    const map = new Array(text.length).fill(null).map(() => ({ type: 'normal' as HighlightType, replacement: undefined as string | undefined }));

    const mark = (regex: RegExp, type: HighlightType, replacement?: string) => {
        regex.lastIndex = 0;
        const matches = text.matchAll(regex);
        for (const m of matches) {
            if (m.index !== undefined) {
                const start = m.index;
                const end = start + m[0].length;
                for (let i = start; i < end; i++) {
                    if (map[i].type === 'normal') {
                        map[i] = { type, replacement };
                    }
                }
            }
        }
    };

    // 1. Context (Blue)
    CONTEXT_PATTERNS.forEach(p => mark(new RegExp(p), 'context'));

    // 2. Constraints (Green)
    CONSTRAINT_PATTERNS.forEach(p => mark(new RegExp(p), 'constraint'));

    // 3. Vague (Red) with suggestions
    VAGUE_PATTERNS.forEach(p => mark(p.regex, 'vague', p.suggestion));

    // Build segments
    const segments: HighlightSegment[] = [];
    if (map.length === 0) return segments;

    let current = map[0];
    let currentText = '';

    for (let i = 0; i < text.length; i++) {
        if (map[i].type !== current.type || map[i].replacement !== current.replacement) {
            segments.push({
                text: currentText,
                type: current.type,
                replacement: current.replacement
            });
            currentText = text[i];
            current = map[i];
        } else {
            currentText += text[i];
        }
    }
    segments.push({
        text: currentText,
        type: current.type,
        replacement: current.replacement
    });

    return segments;
}
