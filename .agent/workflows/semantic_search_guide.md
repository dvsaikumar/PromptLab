# Semantic Search Guide

## What is Semantic Search?
Semantic search goes beyond matching exact keywords. It understands the **intent** and **contextual meaning** of your query.

### The Differences
| Feature | Keyword Search | Semantic Search |
|---------|---------------|-----------------|
| **Mechanism** | Matches exact character strings | Matches vector embeddings (meaning) |
| **Example** | Query "Dog" finds "Dog" | Query "Dog" finds "Puppy", "Canine", "Pet" |
| **Logic** | Text Processing | Mathematical Distance (Cosine Similarity) |

## How it Works in PromptForge
PromptForge uses a **Vector Database** (LanceDB) to store mathematical representations (vectors) of your prompts.

1. **Embedding**: When you save a prompt, we convert it into a vector (a list of numbers) representing its meaning.
2. **Querying**: When you search, we convert your query into a vector.
3. **Matching**: We find prompts whose vectors are geometrically close to your query vector.

### How to Use
1. Go to **Saved Prompts**.
2. Locate the Search Bar.
3. Click the **Brain Icon** (<svg ...>) to toggle Semantic Mode.
4. The search bar will turn **Purple** and placeholder will say "Semantic Search (Concept)...".
5. Type a concept (e.g., "coding helper") to find related prompts (e.g., "Python Generator") even if they don't share keywords.

> **Note**: In the web demo version, this uses simulated embeddings. For full semantic power, the Electron Desktop version with a local LLM is required.
