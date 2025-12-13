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
    persona?: string;
    tokenUsage?: string;
}

export interface HistoryRecord {
    id?: number;
    framework: string;
    prompt: string;
    fields: string;
    tones: string;
    industry?: string;
    role?: string;
    simpleIdea?: string;
    createdAt: string;
    providerId?: string;
    model?: string;
}

export interface SavedWorkflow {
    id?: number;
    title: string;
    description?: string;
    nodes: any[];
    edges: any[];
    globalFiles?: any[];
    createdAt: string;
    updatedAt: string;
}

interface ElectronDB {
    savePrompt: (prompt: Omit<SavedPrompt, 'id'>) => Promise<number>;
    getAllPrompts: () => Promise<SavedPrompt[]>;
    getPromptById: (id: number) => Promise<SavedPrompt | undefined>;
    getPromptsByFramework: (framework: string) => Promise<SavedPrompt[]>;
    updatePrompt: (id: number, updates: Partial<SavedPrompt>) => Promise<void>;
    deletePrompt: (id: number) => Promise<void>;
    searchPrompts: (query: string) => Promise<SavedPrompt[]>;
    // New History Method
    addHistory: (record: HistoryRecord) => Promise<number>;
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
    private DB_VERSION = 3; // Bumped version for workflows
    private STORE_NAME = 'savedPrompts';
    private HISTORY_STORE = 'generationHistory';
    private WORKFLOW_STORE = 'workflows';
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
                    store.createIndex('framework', 'framework', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    store.createIndex('title', 'title', { unique: false });
                }

                // History Store (New in v2)
                if (!db.objectStoreNames.contains(this.HISTORY_STORE)) {
                    const hStore = db.createObjectStore(this.HISTORY_STORE, { keyPath: 'id', autoIncrement: true });
                    hStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Workflows Store (New in v3)
                if (!db.objectStoreNames.contains(this.WORKFLOW_STORE)) {
                    const wStore = db.createObjectStore(this.WORKFLOW_STORE, { keyPath: 'id', autoIncrement: true });
                    wStore.createIndex('createdAt', 'createdAt', { unique: false });
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

    async addHistory(record: HistoryRecord): Promise<number> {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.HISTORY_STORE], 'readwrite');
            const store = transaction.objectStore(this.HISTORY_STORE);
            const request = store.add(record);
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

    // --- WORKFLOWS (Chain Reaction) ---
    async saveWorkflow(workflow: Omit<SavedWorkflow, 'id'>): Promise<number> {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.WORKFLOW_STORE], 'readwrite');
            const store = transaction.objectStore(this.WORKFLOW_STORE);
            const request = store.add(workflow);
            request.onsuccess = () => resolve(request.result as number);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllWorkflows(): Promise<SavedWorkflow[]> {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.WORKFLOW_STORE], 'readonly');
            const store = transaction.objectStore(this.WORKFLOW_STORE);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

// Export unified database service
// HTTP Database service for web browser (communicates with local server)
export class HttpPromptStorage {
    private API_URL = 'http://localhost:3001/api';

    async savePrompt(prompt: Omit<SavedPrompt, 'id'>): Promise<number> {
        const response = await fetch(`${this.API_URL}/prompts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prompt)
        });
        if (!response.ok) throw new Error('Failed to save prompt');
        const data = await response.json();
        return data.id;
    }

    async addHistory(record: HistoryRecord): Promise<number> {
        try {
            const response = await fetch(`${this.API_URL}/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });
            if (!response.ok) return -1;
            const data = await response.json();
            return data.id;
        } catch (e) {
            console.warn("History save failed locally", e);
            return -1;
        }
    }

    async getAllPrompts(): Promise<SavedPrompt[]> {
        try {
            const response = await fetch(`${this.API_URL}/prompts`);
            if (!response.ok) return []; // Fallback gracefully if server not running
            return await response.json();
        } catch (e) {
            console.warn('Local server not reachable, prompts might be empty');
            return [];
        }
    }

    async getPromptById(id: number): Promise<SavedPrompt | undefined> {
        const response = await fetch(`${this.API_URL}/prompts/${id}`);
        if (!response.ok) return undefined;
        return await response.json();
    }

    async getPromptsByFramework(framework: string): Promise<SavedPrompt[]> {
        const prompts = await this.getAllPrompts();
        return prompts.filter(p => p.framework === framework);
    }

    async updatePrompt(id: number, updates: Partial<SavedPrompt>): Promise<void> {
        await fetch(`${this.API_URL}/prompts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    }

    async deletePrompt(id: number): Promise<void> {
        await fetch(`${this.API_URL}/prompts/${id}`, {
            method: 'DELETE'
        });
    }

    async searchPrompts(query: string): Promise<SavedPrompt[]> {
        const response = await fetch(`${this.API_URL}/prompts/search/query?q=${encodeURIComponent(query)}`);
        if (!response.ok) return [];
        return await response.json();
    }
}

// Export unified database service
// If Electron, use Electron DB.
// If Web, try Local Server (HttpPromptStorage).
// You can fallback to IndexedDB if you prefer, but to share data across browsers, server is required.
export const promptDB = window.electron?.db || new HttpPromptStorage();

// Detailed Workflow DB (IndexedDB Only for now)
export const workflowDB = new IndexedDBPromptStorage();

