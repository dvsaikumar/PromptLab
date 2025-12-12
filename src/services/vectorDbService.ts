/**
 * Service to interact with LanceDB (running in Electron Main process)
 */

export class VectorDbService {
    private static instance: VectorDbService;

    static getInstance(): VectorDbService {
        if (!VectorDbService.instance) {
            VectorDbService.instance = new VectorDbService();
        }
        return VectorDbService.instance;
    }

    isAvailable(): boolean {
        return !!window.electron?.vectordb;
    }

    async createCollection(name: string, initialData: any[] = []): Promise<boolean> {
        if (!this.isAvailable()) {
            console.warn('VectorDB not available (browser mode)');
            return false;
        }
        try {
            await window.electron!.vectordb.add(name, initialData);
            return true;
        } catch (error) {
            console.error('Failed to create collection', error);
            return false;
        }
    }

    async addDocuments(collection: string, documents: any[]): Promise<boolean> {
        // documents must include 'vector' field as number[]
        if (!this.isAvailable()) return false;
        return await window.electron!.vectordb.add(collection, documents);
    }

    async search(collection: string, vector: number[], limit: number = 5): Promise<any[]> {
        if (!this.isAvailable()) return [];
        return await window.electron!.vectordb.search(collection, vector, limit);
    }

    async listCollections(): Promise<string[]> {
        if (!this.isAvailable()) return [];
        return await window.electron!.vectordb.list();
    }

    generateDummyEmbedding(text: string): number[] {
        // Create a consistent-ish hash-based vector for testing
        // Real implementation would call an embedding API like mxbai-embed-large
        const dim = 384; // Standard small model dimension
        const vector = new Array(dim).fill(0.0);

        // Simple seeded variation to avoid creating identical vectors which strict DBs might dislike
        let sum = 0;
        for (let i = 0; i < text.length; i++) {
            sum += text.charCodeAt(i);
        }

        // Fill with some pattern based on text content
        for (let i = 0; i < dim; i++) {
            vector[i] = (Math.sin(sum + i) + 1) / 2; // Normalize between 0 and 1
        }

        return vector;
    }
}

export const vectorDb = VectorDbService.getInstance();
