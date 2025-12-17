# PromptForge v1 (Formerly PromptLab)

A professional, agentic-grade AI prompt engineering platform built with React, TypeScript, and Vite. Designed for prompt engineers, developers, and power users to craft, reverse-engineer, chaining, and compile advanced LLM prompts.

## 🚀 Key Features

### 🧠 Core Philosophy: "The Golden Rules"
The application is architected around 10 proprietary "Golden Rules of Prompting" which are injected into every AI interaction (Generation, Analysis, Compilation). These rules ensure that every output is highly structured, action-oriented, and methodically planned.

### ⚡ Real-Time Smart Assist
A low-latency, "Type-Ahead" AI assistant embedded in all text fields.
- **Speed**: Optimized for <300ms response times using ultra-low specific temperature and token caps.
- **Capabilities**: Provides 3 instant suggestions:
    - `Completion`: Predictive text to finish thoughts.
    - `Context`: Missing angles or details.
    - `Refinement`: Professional polishing of the last sentence.

### 🧪 Prompt Lab (The Builder)
Advanced environment for constructing structured prompts.
- **Frameworks**: Native support for CO-STAR, RTF, ROSES, TAG, and more.
- **Auto-Expansion**: Converts simple one-liners into full-blown prompt specifications.
- **Live Quality Analysis**: Real-time scoring of your prompt's clarity, specificity, and actionability.

### 🔄 Reverse Prompt Engineering
Deconstruct existing content to understand how it was generated.
- **God Mode**: Deep analysis of website structure, intent, and hidden mechanics.
- **Style Analysis**: Design-focused reverse engineering (Sonnet 3.5 Protocol).
- **Code Analysis**: Logical reverse engineering for developers (Cursor Protocol).
- **Vision Support**: Analyze screenshots and images to extract prompt styles.

### 🔗 Chain Reaction
Visual workflow builder for chaining prompts together.
- **Node-Based Interface**: Drag-and-drop to connect prompt outputs to inputs.
- **Sequential Execution**: Run complex multi-step workflows automatically.

### ⚙️ Prompt Compiler
"Compile" raw text into optimized prompt engineering artifacts.
- **DSPy-Inspired Optimization**: Uses an LLM to iteratively refine and "compile" a rough instruction into a high-performance system prompt.
- **Structured Output enforcement**: Guarantees XML/JSON output structures.

### 💾 Local Hub & Persistence
- **Local Database**: SQLite-backed local storage for all prompts and history.
- **Source Tracking**: Automatically tracks where a prompt came from (Lab, Compiler, Reverse, etc.).

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, Lucide Icons, Custom Glassmorphism UI
- **State**: React Context API + Custom Hooks (`useRealtimeAssist`)
- **Backend/Storage**: Node.js/Express (Local Server), `better-sqlite3`
- **AI Orchestration**: Custom `LLMService` supporting:
    - OpenAI, Anthropic, Gemini, DeepSeek, Mistral, Grok, Qwen
    - Local LLMs (Ollama/LM Studio) via `LocalProvider`

## 📦 Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Local Server (Database)**
   The app requires the local backend for saving prompts.
   ```bash
   node server/index.js
   ```

3. **Start Frontend**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## 🧩 Project Structure

```
src/
├── components/
│   ├── prompt-builder/  # SimpleIdea, InputField, FrameworkSelector
│   ├── ui/              # Reusable UI (RealtimeSuggestions, Buttons, etc.)
│   └── ...
├── contexts/            # PromptContext (Global State & Golden Rules)
├── hooks/               # Custom Hooks (useRealtimeAssist)
├── pages/
│   ├── PromptLab.tsx        # Main Builder
│   ├── ReversePromptPage.tsx # Deconstruction Tool
│   ├── ChainReactionPage.tsx # Workflow Builder
│   └── PromptCompiler.tsx    # Optimization Tool
├── services/            # LLMService, Database Integration
└── constants/           # Golden Rules, Protocols, Personas
```

## 🚀 Speed & Performance

- **Debounce Optimization**: Real-time assist tuned to 300ms debounce.
- **Token Efficiency**: System prompts minified for low latency.
- **Local Proxying**: Built-in proxy handling for CORS issues with various LLM providers.

## 📄 License & Credits

**Developed by**: D Studios Lab Team
**License**: Proprietary
**Lead Developer**: Jai Sri Ram
