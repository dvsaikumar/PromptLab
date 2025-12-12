# How to Use Chain Reaction Output

The Chain Reaction workflow allows you to build complex, multi-step AI tasks. Once a chain completes, the **Final Result Modal** appears. Here is how to effectively use the output generated.

## 1. The Two Output Modes

The result modal provides two distinct tabs for different use cases.

### Tab 1: Step-by-Step Variables
**Best for:** Debugging, Validation, and Modular Use.

*   **What it shows:** This view breaks down the chain into individual cards. Each card represents one "Node" (step) in your workflow.
*   **How to use:**
    *   **Review Logic:** Check if Step 1 (e.g., "Strategy") produced the right output before Step 2 ("Outline") used it.
    *   **Partial Extraction:** If you only need the *Outline* but not the *Final Draft*, you can copy just that specific card.
    *   **Iterative Refinement:** If Step 2 looks bad, you know exactly where to fix your prompt in the editor.

### Tab 2: Master Prompt Format
**Best for:** Deployment, Archiving, and "Mega-Prompting".

*   **What it shows:** This view concatenates EVERY step's output into a single, structured markdown block. It preserves the "history" of the entire chain.
*   **How to use:**
    *   **Context Injection:** Copy this entire block. Paste it into a fresh chat with ChatGPT, Claude, or Gemini. The AI will now instantly "know" everything that happened in your chain (the Strategy, the Outline, AND the Draft) and can continue working from there without context loss.
    *   **Prompt Templating:** Save this text as a new "Static Prompt" in your library. It serves as a perfect "Few-Shot Example" or "Context" for future tasks.
    *   **Reporting:** This format is excellent for generating reports, as it shows the "Show Your Work" trail of how the final conclusion was reached.

## 2. Practical Workflow Example

**Scenario:** You created a "Blog Post Generator" chain (Strategy -> Outline -> Draft).

1.  **Run the Chain.**
2.  **Open "Step-by-Step" Tab.**
    *   Verify the *Strategy* correctly identified the target audience.
    *   Verify the *Outline* covers all key points.
3.  **Open "Master Prompt Format" Tab.**
    *   Click **"Copy All"**.
4.  **Action:**
    *   Go to ChatGPT.
    *   Type: "Here is the context of a blog post we just generated. Please create 5 social media posts to promote it:"
    *   **Paste** the Master Prompt.
    *   *Result:* ChatGPT writes perfect social posts because it has the full context of the Strategy and Draft.
