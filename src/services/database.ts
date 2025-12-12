// Type definitions for window.electron
export interface SavedPrompt {
    id?: number;
    title: string;
    framework: string;
    prompt: string;
    fields: string; // JSON stringified fields
    tones: string; // JSON stringified tones
    industry?: string;
    role?: string;
    simpleIdea?: string;
    qualityScore?: number;
    qualityScoreDetails?: string; // JSON stringified { overallScore, strengths, weaknesses }
    createdAt: string;
    updatedAt: string;
    providerId?: string;
    model?: string;
}

interface ElectronDB {
    savePrompt: (prompt: Omit<SavedPrompt, 'id'>) => Promise<number>;
    getAllPrompts: () => Promise<SavedPrompt[]>;
    getPromptById: (id: number) => Promise<SavedPrompt | undefined>;
    getPromptsByFramework: (framework: string) => Promise<SavedPrompt[]>;
    updatePrompt: (id: number, updates: Partial<SavedPrompt>) => Promise<void>;
    deletePrompt: (id: number) => Promise<void>;
    searchPrompts: (query: string) => Promise<SavedPrompt[]>;
}

interface ElectronVectorDB {
    add: (collection: string, data: any[]) => Promise<any>;
    search: (collection: string, vector: number[], limit?: number) => Promise<any[]>;
    list: () => Promise<string[]>;
}

declare global {
    interface Window {
        electron?: {
            platform: string;
            db: ElectronDB;
            vectordb: ElectronVectorDB;
        };
    }
}

// IndexedDB Database service for browser (permanent storage)
export class IndexedDBPromptStorage {
    private DB_NAME = 'DStudiosPrompts';
    private DB_VERSION = 1;
    private STORE_NAME = 'savedPrompts';
    private db: IDBDatabase | null = null;

    /**
     * Initialize the database
     */
    private async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id', autoIncrement: true });

                    // Create indices for faster lookups
                    store.createIndex('framework', 'framework', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    store.createIndex('title', 'title', { unique: false });
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

    async savePrompt(prompt: Omit<SavedPrompt, 'id'>): Promise<number> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.add(prompt);

            request.onsuccess = () => resolve(request.result as number);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllPrompts(): Promise<SavedPrompt[]> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getPromptById(id: number): Promise<SavedPrompt | undefined> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getPromptsByFramework(framework: string): Promise<SavedPrompt[]> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const index = store.index('framework');
            const request = index.getAll(framework);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updatePrompt(id: number, updates: Partial<SavedPrompt>): Promise<void> {
        const db = await this.ensureDB();

        return new Promise(async (resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);

            // Get existing prompt
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const existing = getRequest.result;
                if (existing) {
                    const updated = {
                        ...existing,
                        ...updates,
                        updatedAt: new Date().toISOString()
                    };
                    const putRequest = store.put(updated);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error('Prompt not found'));
                }
            };

            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async deletePrompt(id: number): Promise<void> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async searchPrompts(query: string): Promise<SavedPrompt[]> {
        const prompts = await this.getAllPrompts();
        const lowerQuery = query.toLowerCase();
        return prompts.filter(p =>
            p.title.toLowerCase().includes(lowerQuery) ||
            p.prompt.toLowerCase().includes(lowerQuery)
        );
    }
}

// Export unified database service
export const promptDB = window.electron?.db || new IndexedDBPromptStorage();
