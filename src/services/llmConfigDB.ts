import { LLMConfig } from '@/types';
import { securityManager } from '../utils/security';

/**
 * Server-side storage for LLM configurations via API
 * Persists across browser sessions and restarts.
 */

const API_BASE = 'http://localhost:3001/api/settings';

export interface StoredLLMConfig {
    id?: number;
    providerId: string;
    apiKey: string; // Stored as encrypted string
    model: string;
    baseUrl?: string;
    testedAt: string;
    isActive: boolean;
}

class LLMConfigDB {
    /**
     * No-op for API based implementation, but kept for interface compatibility
     */
    async init(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Save a new LLM configuration
     */
    async saveConfig(config: LLMConfig): Promise<number> {
        // Encrypt API key before sending to server
        const encryptedApiKey = securityManager.encryptApiKey(config.apiKey);

        const payload = {
            providerId: config.providerId,
            apiKey: encryptedApiKey,
            model: config.model,
            baseUrl: config.baseUrl,
            isActive: true, // Auto-activate on save usually
            testedAt: new Date().toISOString()
        };

        try {
            const response = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to save config to server');
            }

            const data = await response.json();
            return data.id;
        } catch (error) {
            console.error('Save config error:', error);
            throw error;
        }
    }

    /**
     * Get all saved LLM configurations
     */
    async getAllConfigs(): Promise<LLMConfig[]> {
        try {
            const response = await fetch(API_BASE);
            if (!response.ok) return [];

            const storedConfigs: StoredLLMConfig[] = await response.json();

            return storedConfigs.map(stored => ({
                providerId: stored.providerId as any,
                apiKey: securityManager.decryptApiKey(stored.apiKey),
                model: stored.model,
                baseUrl: stored.baseUrl
            }));
        } catch (error) {
            console.error('Get all configs error:', error);
            return [];
        }
    }

    /**
     * Get the active LLM configuration
     */
    async getActiveConfig(): Promise<LLMConfig | null> {
        try {
            const response = await fetch(`${API_BASE}/active`);
            if (!response.ok) return null;

            const stored: StoredLLMConfig = await response.json();
            if (!stored || !stored.id) return null;

            return {
                providerId: stored.providerId as any,
                apiKey: securityManager.decryptApiKey(stored.apiKey),
                model: stored.model,
                baseUrl: stored.baseUrl
            };
        } catch (error) {
            // Fallback: Try getting all and finding active if the specific endpoint fails
            // (Or just return null)
            console.error("Failed to get active config", error);
            return null;
        }
    }

    /**
     * Delete a configuration
     */
    async deleteConfig(idOrProviderId: number | string, model?: string): Promise<void> {
        // Advanced deletion logic if needed, but for now we might only support ID deletion via API
        // If passed providerId/model, we first need to find the ID.

        let idToDelete: number | undefined;

        if (typeof idOrProviderId === 'number') {
            idToDelete = idOrProviderId;
        } else {
            // Find ID by provider/model
            try {
                const configs = await this.getAllConfigsRaw();
                const match = configs.find(c => c.providerId === idOrProviderId && c.model === model);
                if (match) idToDelete = match.id;
            } catch (e) {
                console.error("Error finding config to delete", e);
            }
        }

        if (idToDelete) {
            await fetch(`${API_BASE}/${idToDelete}`, { method: 'DELETE' });
        }
    }

    // Helper to get raw stored objects for internal use
    private async getAllConfigsRaw(): Promise<StoredLLMConfig[]> {
        const response = await fetch(API_BASE);
        if (!response.ok) return [];
        return await response.json();
    }

    /**
     * Clear all configurations - Not strictly implemented in API yet, 
     * but could be done by deleting all.
     */
    async clearAll(): Promise<void> {
        // Not critical for this requirement
    }
}

// Export singleton instance
export const llmConfigDB = new LLMConfigDB();
