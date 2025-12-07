/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ANTHROPIC_API_KEY?: string
    readonly VITE_OPENAI_API_KEY?: string
    readonly VITE_GEMINI_API_KEY?: string
    readonly VITE_DEEPSEEK_API_KEY?: string
    readonly VITE_KIMI_API_KEY?: string
    readonly VITE_GLM_API_KEY?: string
    readonly VITE_CUSTOM_API_KEY?: string
    readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
