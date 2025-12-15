import { LLMService } from './llm';
import { LLMConfig } from '@/types';

export interface PromptConfiguration {
    taskType: 'classification' | 'generation' | 'qa' | 'summarization' | 'rewrite' | 'extraction' | 'other';
    taskDescription: string;
    instructions: string[];
    rules: string[];
    fewShotExamples: { input: string; output: string }[];
    context: string;
    inputVariables: string[];
    outputFormat: string;
    tools: string[];
    confidenceScore: number; // 0-1 confidence in the analysis
}

const ANALYZER_SYSTEM_PROMPT = `You are an advanced Prompt Configuration Module. 
Your goal is to parse and analyze human input to identify the fundamental nature of the task.

You must handle two types of input:
1. Structured input with markers (e.g., [TASK], [INSTRUCTIONS], [RULES], [FEW_SHOT_EXAMPLES]).
2. Unstructured natural language input (you must infer the structure).

Analyze the input and extract the following into a JSON structure:
- taskType: The category of the task (classification, generation, qa, summarization, rewrite, extraction, or other).
- taskDescription: A clear, concise summary of what needs to be done.
- instructions: A list of specific actionable steps found in the input.
- rules: A list of negative constraints or strict guidelines (e.g., "no markdown", "under 50 words").
- fewShotExamples: Any examples provided in the prompt.
- context: Any background information provided.
- inputVariables: Variables that seem to be dynamic inputs (e.g., {text}, {name}).
- outputFormat: The requested format (e.g., JSON, list, markdown).
- tools: Any specific tools mentioned (e.g., 'calculator', 'search').
- confidenceScore: A number between 0.0 and 1.0 indicating how confident you are in this extraction. 
  * SCORING CALIBRATION:
  * If you can clearly identify a Task Type and at least one Instruction => Score MUST be > 0.85.
  * If the input is clear but lacks specific constraints => Score between 0.70 and 0.85.
  * Only use scores < 0.5 for Gibberish or completely ambiguous input.

STRICT OUTPUT FORMAT:
Return ONLY valid JSON matching the structure above. No markdown code blocks.`;

export class PromptConfigurationModule {
    private static instance: PromptConfigurationModule;

    private constructor() { }

    public static getInstance(): PromptConfigurationModule {
        if (!PromptConfigurationModule.instance) {
            PromptConfigurationModule.instance = new PromptConfigurationModule();
        }
        return PromptConfigurationModule.instance;
    }

    public async analyze(
        rawInput: string,
        config: LLMConfig
    ): Promise<PromptConfiguration> {
        const provider = LLMService.getInstance().getProvider(config.providerId);

        if (!provider) {
            throw new Error(`Provider ${config.providerId} not available for analysis.`);
        }

        const response = await provider.generateCompletion({
            config,
            systemPrompt: ANALYZER_SYSTEM_PROMPT,
            userPrompt: `Analyze this prompt input:\n\n${rawInput}`,
            temperature: 0.1 // Low temperature for deterministic analysis
        });

        try {
            // Clean parsing in case of markdown leakage
            const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(cleanJson);

            // Validate/Fill defaults
            return {
                taskType: result.taskType || 'other',
                taskDescription: result.taskDescription || '',
                instructions: Array.isArray(result.instructions) ? result.instructions : [],
                rules: Array.isArray(result.rules) ? result.rules : [],
                fewShotExamples: Array.isArray(result.fewShotExamples) ? result.fewShotExamples : [],
                context: result.context || '',
                inputVariables: Array.isArray(result.inputVariables) ? result.inputVariables : [],
                outputFormat: result.outputFormat || '',
                tools: Array.isArray(result.tools) ? result.tools : [],
                confidenceScore: typeof result.confidenceScore === 'number' ? result.confidenceScore : 0.5
            };
        } catch (error) {
            console.error("Failed to parse analysis result:", error);
            // Fallback for failed parsing
            return {
                taskType: 'other',
                taskDescription: 'Analysis failed to parse.',
                instructions: [],
                rules: [],
                fewShotExamples: [],
                context: '',
                inputVariables: [],
                outputFormat: '',
                tools: [],
                confidenceScore: 0
            };
        }
    }
}
