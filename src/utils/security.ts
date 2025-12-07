/**
 * Security utilities for DStudiosLab
 * Handles API key encryption, validation, and secure storage
 */

import { LLMProviderId } from '@/types';

// Simple encryption using Web Crypto API (browser) or base64 obfuscation (fallback)
// Note: This is obfuscation, not true encryption. For production, use electron-store with encryption
class SecurityManager {
    private static instance: SecurityManager;
    private encryptionKey = 'dstudioslab-v1-key'; // In production, use a proper key management system

    private constructor() { }

    public static getInstance(): SecurityManager {
        if (!SecurityManager.instance) {
            SecurityManager.instance = new SecurityManager();
        }
        return SecurityManager.instance;
    }

    /**
     * Encrypt API key before storing
     * Uses simple XOR cipher for obfuscation (better than plain text)
     */
    encryptApiKey(apiKey: string): string {
        if (!apiKey) return '';

        try {
            // Simple XOR encryption with base64 encoding
            const encrypted = this.xorEncrypt(apiKey, this.encryptionKey);
            return btoa(encrypted); // Base64 encode
        } catch (error) {
            console.error('Encryption failed:', error);
            return apiKey; // Fallback to plain text if encryption fails
        }
    }

    /**
     * Decrypt API key when retrieving
     */
    decryptApiKey(encryptedKey: string): string {
        if (!encryptedKey) return '';

        try {
            const decoded = atob(encryptedKey); // Base64 decode
            return this.xorEncrypt(decoded, this.encryptionKey); // XOR decrypt (same operation)
        } catch (error) {
            console.error('Decryption failed:', error);
            return encryptedKey; // Might be plain text from old version
        }
    }

    /**
     * XOR cipher for simple encryption/decryption
     */
    private xorEncrypt(text: string, key: string): string {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(
                text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
            );
        }
        return result;
    }

    /**
     * Validate API key format based on provider
     */
    validateApiKey(provider: LLMProviderId, apiKey: string): {
        valid: boolean;
        error?: string;
    } {
        if (!apiKey || apiKey.trim() === '') {
            return { valid: false, error: 'API key is required' };
        }

        const patterns: Record<LLMProviderId, { pattern: RegExp; example: string }> = {
            anthropic: {
                pattern: /^sk-ant-api03-[a-zA-Z0-9_-]{95,}$/,
                example: 'sk-ant-api03-...'
            },
            openai: {
                pattern: /^sk-[a-zA-Z0-9]{48,}$/,
                example: 'sk-...'
            },
            gemini: {
                pattern: /^[a-zA-Z0-9_-]{39}$/,
                example: 'AIza...'
            },
            deepseek: {
                pattern: /^sk-[a-zA-Z0-9]{32,}$/,
                example: 'sk-...'
            },
            kimi: {
                pattern: /^sk-[a-zA-Z0-9]{32,}$/,
                example: 'sk-...'
            },
            glm: {
                pattern: /^[a-zA-Z0-9._-]{32,}$/,
                example: 'glm-...'
            },
            mistral: {
                pattern: /^[a-zA-Z0-9]{32,}$/,
                example: 'mistral-...'
            },
            grok: {
                pattern: /^xai-[a-zA-Z0-9-]{32,}$/,
                example: 'xai-...'
            },
            custom: {
                pattern: /.+/, // Accept any non-empty string for custom
                example: 'your-api-key'
            }
        };

        const config = patterns[provider];
        if (!config) {
            return { valid: true }; // Unknown provider, skip validation
        }

        if (!config.pattern.test(apiKey)) {
            return {
                valid: false,
                error: `Invalid API key format for ${provider}. Expected format: ${config.example}`
            };
        }

        return { valid: true };
    }

    /**
     * Check if API key is encrypted (base64 encoded)
     */
    isEncrypted(value: string): boolean {
        if (!value) return false;
        try {
            // Try to decode - if successful and doesn't match original, it's encrypted
            const decoded = atob(value);
            return decoded !== value;
        } catch {
            return false; // Not base64, so not encrypted
        }
    }

    /**
     * Sanitize API key for display (show only last 4 characters)
     */
    sanitizeApiKey(apiKey: string): string {
        if (!apiKey || apiKey.length < 8) return '***';
        return '***' + apiKey.slice(-4);
    }

    /**
     * Get environment variable API key if available
     */
    getEnvApiKey(provider: LLMProviderId): string | undefined {
        const envKeys: Record<LLMProviderId, string | undefined> = {
            anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY,
            openai: import.meta.env.VITE_OPENAI_API_KEY,
            gemini: import.meta.env.VITE_GEMINI_API_KEY,
            deepseek: import.meta.env.VITE_DEEPSEEK_API_KEY,
            kimi: import.meta.env.VITE_KIMI_API_KEY,
            glm: import.meta.env.VITE_GLM_API_KEY,
            mistral: import.meta.env.VITE_MISTRAL_API_KEY,
            grok: import.meta.env.VITE_GROK_API_KEY,
            custom: import.meta.env.VITE_CUSTOM_API_KEY
        };

        return envKeys[provider];
    }

    /**
     * Check if environment variables are being used
     */
    hasEnvApiKeys(): boolean {
        return !!(
            import.meta.env.VITE_ANTHROPIC_API_KEY ||
            import.meta.env.VITE_OPENAI_API_KEY ||
            import.meta.env.VITE_GEMINI_API_KEY ||
            import.meta.env.VITE_DEEPSEEK_API_KEY ||
            import.meta.env.VITE_KIMI_API_KEY ||
            import.meta.env.VITE_GLM_API_KEY ||
            import.meta.env.VITE_MISTRAL_API_KEY ||
            import.meta.env.VITE_GROK_API_KEY ||
            import.meta.env.VITE_CUSTOM_API_KEY
        );
    }
}

export const securityManager = SecurityManager.getInstance();

/**
 * Secure storage wrapper for localStorage
 */
export class SecureStorage {
    /**
     * Save LLM config with encrypted API key
     */
    static saveLLMConfig(config: any): void {
        const configToSave = {
            ...config,
            apiKey: securityManager.encryptApiKey(config.apiKey)
        };
        localStorage.setItem('llmConfig', JSON.stringify(configToSave));
    }

    /**
     * Load LLM config and decrypt API key
     */
    static loadLLMConfig(): any | null {
        const saved = localStorage.getItem('llmConfig');
        if (!saved) return null;

        try {
            const config = JSON.parse(saved);

            // Check if we should use environment variable instead
            const envKey = securityManager.getEnvApiKey(config.providerId);
            if (envKey) {
                config.apiKey = envKey;
                config.isFromEnv = true;
            } else if (config.apiKey) {
                // Decrypt stored API key
                config.apiKey = securityManager.decryptApiKey(config.apiKey);
                config.isFromEnv = false;
            }

            return config;
        } catch (error) {
            console.error('Failed to load LLM config:', error);
            return null;
        }
    }

    /**
     * Clear sensitive data
     */
    static clearSensitiveData(): void {
        localStorage.removeItem('llmConfig');
    }
}
