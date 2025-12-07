import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

export interface SavedPrompt {
    id?: number;
    title: string;
    framework: string;
    prompt: string;
    fields: string; // JSON stringified
    tones: string; // JSON stringified
    industry?: string;
    role?: string;
    qualityScore?: number;
    createdAt: string;
    updatedAt: string;
}

class PromptDatabase {
    private db: ReturnType<typeof Database>;

    constructor() {
        const userDataPath = app.getPath('userData');
        const dbPath = path.join(userDataPath, 'prompts.db');

        this.db = new Database(dbPath);
        this.initDatabase();
    }

    private initDatabase() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS prompts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                framework TEXT NOT NULL,
                prompt TEXT NOT NULL,
                fields TEXT NOT NULL,
                tones TEXT NOT NULL,
                industry TEXT,
                role TEXT,
                qualityScore INTEGER,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
        `);

        // Create index for faster searches
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_framework ON prompts(framework);
            CREATE INDEX IF NOT EXISTS idx_createdAt ON prompts(createdAt DESC);
        `);
    }

    savePrompt(prompt: Omit<SavedPrompt, 'id'>): number {
        const stmt = this.db.prepare(`
            INSERT INTO prompts (title, framework, prompt, fields, tones, industry, role, qualityScore, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            prompt.title,
            prompt.framework,
            prompt.prompt,
            prompt.fields,
            prompt.tones,
            prompt.industry || null,
            prompt.role || null,
            prompt.qualityScore || null,
            prompt.createdAt,
            prompt.updatedAt
        );

        return result.lastInsertRowid as number;
    }

    getAllPrompts(): SavedPrompt[] {
        const stmt = this.db.prepare('SELECT * FROM prompts ORDER BY createdAt DESC');
        return stmt.all() as SavedPrompt[];
    }

    getPromptById(id: number): SavedPrompt | undefined {
        const stmt = this.db.prepare('SELECT * FROM prompts WHERE id = ?');
        return stmt.get(id) as SavedPrompt | undefined;
    }

    getPromptsByFramework(framework: string): SavedPrompt[] {
        const stmt = this.db.prepare('SELECT * FROM prompts WHERE framework = ? ORDER BY createdAt DESC');
        return stmt.all(framework) as SavedPrompt[];
    }

    updatePrompt(id: number, updates: Partial<SavedPrompt>): void {
        const fields = Object.keys(updates).filter(k => k !== 'id');
        const values = fields.map(k => updates[k as keyof SavedPrompt]);

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const stmt = this.db.prepare(`UPDATE prompts SET ${setClause}, updatedAt = ? WHERE id = ?`);

        stmt.run(...values, new Date().toISOString(), id);
    }

    deletePrompt(id: number): void {
        const stmt = this.db.prepare('DELETE FROM prompts WHERE id = ?');
        stmt.run(id);
    }

    searchPrompts(query: string): SavedPrompt[] {
        const stmt = this.db.prepare(`
            SELECT * FROM prompts 
            WHERE title LIKE ? OR prompt LIKE ? 
            ORDER BY createdAt DESC
        `);
        const searchTerm = `%${query}%`;
        return stmt.all(searchTerm, searchTerm) as SavedPrompt[];
    }

    close() {
        this.db.close();
    }
}

let dbInstance: PromptDatabase | null = null;

export function getDatabase(): PromptDatabase {
    if (!dbInstance) {
        dbInstance = new PromptDatabase();
    }
    return dbInstance;
}

export function closeDatabase() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}
