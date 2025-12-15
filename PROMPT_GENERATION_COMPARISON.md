# Prompt Generation Strategy Comparison
## `PromptLabNew` vs. `NewTechPage` (DSPy Compiler)

This document outlines the architectural and functional differences between the two prompt generation engines currently implemented in the application.

---

## 1. `PromptLabNew.tsx` (The Builder)

**Core Philosophy:** Structured, Component-Based Construction.
This page is designed as a "Prompt IDE" where users build prompts by filling out specific fields defined by established frameworks (e.g., COSTAR, RISE).

### How it Works:
1.  **Framework Selection:** The user selects a structural framework (e.g., **C.O.S.T.A.R.** - Context, Objective, Style, Tone, Audience, Response).
2.  **Field Inputs:** The UI generates specific input fields for each component of the framework.
3.  **Assembly:** The `PromptContext` stitches these inputs together into a single system prompt.
4.  **Generation:** An LLM processes this assembled context to generate the final result.

### Key Logic (from `PromptContext.tsx`):
```typescript
const framework = getCurrentFramework(); // e.g., COSTAR
const filledFields = framework.fields
    .map(f => `## ${f.label}\n${fields[f.id]}`) // Explicitly formatting each section
    .join('\n\n');

// The System Prompt is constructed by rules
const systemPrompt = `You are an AI assistant... Follow this framework: ... ${filledFields}`;
```

### Pros:
*   **Educational:** Teaches users *how* to write good prompts by forcing them to think about "Context", "Objective", etc., separately.
*   **Granular Control:** Users have direct control over every specific section of the prompt.
*   **Predictable:** The output follows the exact structure defined by the user.
*   **Framework Agnostic:** Can easily switch between different mental models (RISE vs. COSTAR).

### Cons:
*   **High Friction:** Requires significant user effort to fill out multiple fields.
*   **Rigid:** If a task doesn't fit the framework perfectly, it can feel awkward.
*   **Complexity:** The UI is denser with more forms and toggles.

---

## 2. `NewTechPage.tsx` (The DSPy Compiler)

**Core Philosophy:** Intent-Based, "Black Box" Optimization.
This page acts as a "Compiler" or "Optimizer". It takes a raw, potentially messy idea and uses advanced agentic logic to rewrite it into a high-quality prompt automatically.

### How it Works:
1.  **Raw Input:** The user provides a single, unstructured instruction (e.g., "Write a blog post about coffee").
2.  **Analysis Phase (`PromptConfigurationModule`):** An LLM agent analyzes the raw input to determine:
    *   Task Type (e.g., content generation, classification).
    *   Implicit Constraints.
    *   Inferred Intent.
3.  **Compilation Phase:** A second LLM agent (acting as a "DSPy Compiler") takes the analysis and the raw input to construct a "Perfect Prompt".
4.  **Refinement:** It uses Chain-of-Thought (`<DSPY_REASONING>`) to critique and improve its own work before outputting the final result.

### Key Logic (from `NewTechPage.tsx`):
```typescript
// 1. Analyze
const analysis = await analyzer.analyze(rawPrompt);

// 2. Compile with Meta-Prompting
const metaPrompt = `Act as a DSPy Compiler.
    Task: ${analysis.taskType}
    Intent: ${analysis.taskDescription}
    Objective: Maximize for ${optimizationMetric} (e.g., Accuracy).
    
    Output Format: <DSPY_REASONING>... <DSPY_PROMPT>...`;
```

### Pros:
*   **Low Friction:** "One-click" experience. The user just types what they want.
*   **Intelligent:** Infers missing details that the user might have forgotten (e.g., automatically adding "Format as Markdown" if implied).
*   **Higher Quality Ceiling:** Uses "Prompt Engineering" techniques (Few-Shot, CoT) *on behalf* of the user.
*   **Robust:** Can handle vague or poorly written inputs and turn them into gold.

### Cons:
*   **"Black Box":** Users don't necessarily learn *why* the prompt is better; it just "is".
*   **Less Control:** Harder to tweak specific parts of the generation process (e.g., "I want to change just the context").
*   **Token Expensive:** Requires multiple LLM calls (Analysis + Compilation) vs. a single call in the Builder.

---

## Summary Table

| Feature | Prompt Lab (Builder) | New Tech Page (Compiler) |
| :--- | :--- | :--- |
| **Input Style** | Structured Forms (Context, Goal, etc.) | Single Raw Text Input |
| **Primary Mechanism** | String Assembly & Templating | Agentic Analysis & rewriting |
| **User Effort** | High (Think & Fill) | Low (Type & Click) |
| **Control** | High (Fine-grained) | Low (Outcome-based) |
| **Best For...** | Prompt Engineers, Specific Use Cases | Beginners, Quick Ideas, Optimization |
| **Underlying Tech** | `PromptContext` State Machine | `PromptConfigurationModule` + Meta-Prompting |

---

## Recommendation

*   Use **Prompt Lab (`PromptLabNew`)** when you know exactly what you want and need to structure a reusable prompt template for a specific workflow.
*   Use **DSPy Compiler (`NewTechPage`)** when you have a general idea but want the AI to "do the heavy lifting" and apply best practices automatically to get the best possible result.
