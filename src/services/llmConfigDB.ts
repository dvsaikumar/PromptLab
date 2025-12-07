import { LLMConfig } from '@/types';
import { securityManager } from '../utils/security';

/**
 * IndexedDB storage for LLM configurations
 * Persists across browser sessions and provides better reliability than localStorage
 */

const DB_NAME = 'DStudiosLab';
const DB_VERSION = 1;
const STORE_NAME = 'llmConfigs';

export interface StoredLLMConfig {
    id?: number;
    providerId: string;
    encryptedApiKey: string; // Encrypted API key
    model: string;
    baseUrl?: string;
    testedAt: string; // Timestamp when connection was tested
    isActive: boolean; // Currently active config
}

class LLMConfigDB {
    private db: IDBDatabase | null = null;

    /**
     * Initialize the database
     */
    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });

                    // Create indices for faster lookups
                    store.createIndex('providerId', 'providerId', { unique: false });
                    store.createIndex('isActive', 'isActive', { unique: false });
                }
            };
        });
    }

    /**
     * Ensure database is initialized
     */
    private async ensureDB(): Promise<IDBDatabase> {
        if (!this.db) {
            await this.init();
        }
        return this.db!;
    }

    /**
     * Save a new LLM configuration (after successful test)
     */
    async saveConfig(config: LLMConfig): Promise<number> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // Encrypt API key before storing
            const encryptedApiKey = securityManager.encryptApiKey(config.apiKey);

            // First, set all configs to inactive
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => {
                const allConfigs = getAllRequest.result;

                // Check if config already exists (same provider and model)
                const existing = allConfigs.find(
                    (c: StoredLLMConfig) => c.providerId === config.providerId && c.model === config.model
                );

                if (existing) {
                    // Update existing config
                    const updatedConfig: StoredLLMConfig = {
                        ...existing,
                        encryptedApiKey,
                        baseUrl: config.baseUrl,
                        testedAt: new Date().toISOString(),
                        isActive: true
                    };

                    // Set all others to inactive
                    allConfigs.forEach((c: StoredLLMConfig) => {
                        if (c.id !== existing.id) {
                            store.put({ ...c, isActive: false });
                        }
                    });

                    const updateRequest = store.put(updatedConfig);
                    updateRequest.onsuccess = () => resolve(existing.id!);
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    // Set all configs to inactive
                    allConfigs.forEach((c: StoredLLMConfig) => {
                        store.put({ ...c, isActive: false });
                    });

                    // Add new config as active
                    const newConfig: Omit<StoredLLMConfig, 'id'> = {
                        providerId: config.providerId,
                        encryptedApiKey,
                        model: config.model,
                        baseUrl: config.baseUrl,
                        testedAt: new Date().toISOString(),
                        isActive: true
                    };

                    const addRequest = store.add(newConfig);
                    addRequest.onsuccess = () => resolve(addRequest.result as number);
                    addRequest.onerror = () => reject(addRequest.error);
                }
            };
            getAllRequest.onerror = () => reject(getAllRequest.error);
        });
    }

    /**
     * Get all saved LLM configurations
     */
    async getAllConfigs(): Promise<LLMConfig[]> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const configs = request.result.map((stored: StoredLLMConfig) => ({
                    providerId: stored.providerId as any,
                    apiKey: securityManager.decryptApiKey(stored.encryptedApiKey),
                    model: stored.model,
                    baseUrl: stored.baseUrl
                }));
                resolve(configs);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get the active LLM configuration
     */
    async getActiveConfig(): Promise<LLMConfig | null> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                // Find the active config from all configs
                const activeConfig = request.result.find((c: StoredLLMConfig) => c.isActive);
                if (activeConfig) {
                    const stored: StoredLLMConfig = activeConfig;
                    resolve({
                        providerId: stored.providerId as any,
                        apiKey: securityManager.decryptApiKey(stored.encryptedApiKey),
                        model: stored.model,
                        baseUrl: stored.baseUrl
                    });
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Set a config as active by ID
     */
    async setActiveConfig(id: number): Promise<void> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // Get all configs
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => {
                const configs = getAllRequest.result;

                // Update all configs
                configs.forEach((config: StoredLLMConfig) => {
                    config.isActive = config.id === id;
                    store.put(config);
                });

                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            };

            getAllRequest.onerror = () => reject(getAllRequest.error);
        });
    }

    /**
     * Delete a configuration by ID
     */
    async deleteConfig(id: number): Promise<void>;
    async deleteConfig(providerId: string, model: string): Promise<void>;
    async deleteConfig(idOrProviderId: number | string, model?: string): Promise<void> {
        const db = await this.ensureDB();

        return new Promise(async (resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            if (typeof idOrProviderId === 'number') {
                // Delete by ID
                const request = store.delete(idOrProviderId);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            } else {
                // Delete by providerId and model
                const getAllRequest = store.getAll();
                getAllRequest.onsuccess = () => {
                    const configs = getAllRequest.result;
                    const configToDelete = configs.find(
                        (c: StoredLLMConfig) => c.providerId === idOrProviderId && c.model === model
                    );

                    if (configToDelete && configToDelete.id) {
                        const deleteRequest = store.delete(configToDelete.id);
                        deleteRequest.onsuccess = () => resolve();
                        deleteRequest.onerror = () => reject(deleteRequest.error);
                    } else {
                        resolve(); // Config not found, nothing to delete
                    }
                };
                getAllRequest.onerror = () => reject(getAllRequest.error);
            }
        });
    }

    /**
     * Get config by provider and model
     */
    async getConfigByProviderModel(providerId: string, model: string): Promise<LLMConfig | null> {
        const configs = await this.getAllConfigs();
        const found = configs.find(c => c.providerId === providerId && c.model === model);
        return found || null;
    }

    /**
     * Clear all configurations
     */
    async clearAll(): Promise<void> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Export singleton instance
export const llmConfigDB = new LLMConfigDB();
