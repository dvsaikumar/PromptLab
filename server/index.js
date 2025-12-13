import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup
const dbPath = path.join(__dirname, '../local-db/prompts.db');
// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`Using database at: ${dbPath}`);
const db = new Database(dbPath);

// Initialize Tables
db.exec(`
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
        qualityScoreDetails TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        providerId TEXT,
        model TEXT,
        simpleIdea TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        providerId TEXT NOT NULL,
        apiKey TEXT NOT NULL,
        model TEXT NOT NULL,
        baseUrl TEXT,
        isActive BOOLEAN DEFAULT 0,
        testedAt TEXT
    );
`);

// Add columns if they don't exist (migration for existing DBs)
try {
    const columns = db.prepare('PRAGMA table_info(prompts)').all();
    const columnNames = columns.map(c => c.name);

    if (!columnNames.includes('simpleIdea')) {
        db.exec('ALTER TABLE prompts ADD COLUMN simpleIdea TEXT');
    }
    if (!columnNames.includes('qualityScoreDetails')) {
        db.exec('ALTER TABLE prompts ADD COLUMN qualityScoreDetails TEXT');
    }
    if (!columnNames.includes('providerId')) {
        db.exec('ALTER TABLE prompts ADD COLUMN providerId TEXT');
    }
    if (!columnNames.includes('model')) {
        db.exec('ALTER TABLE prompts ADD COLUMN model TEXT');
    }
} catch (err) {
    console.error('Migration error:', err);
}

// Routes

// --- Settings Routes ---
app.get('/api/settings', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM settings ORDER BY testedAt DESC');
        const settings = stmt.all().map(s => ({ ...s, isActive: !!s.isActive }));
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/settings/active', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM settings WHERE isActive = 1 LIMIT 1');
        const setting = stmt.get();
        res.json(setting ? { ...setting, isActive: !!setting.isActive } : null);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/settings', (req, res) => {
    try {
        const { providerId, apiKey, model, baseUrl, isActive, testedAt } = req.body;

        const insert = db.transaction(() => {
            // If setting as active, deactivate others
            if (isActive) {
                db.prepare('UPDATE settings SET isActive = 0').run();
            }

            // Check if exists
            const existing = db.prepare('SELECT id FROM settings WHERE providerId = ? AND model = ?').get(providerId, model);

            let result;
            if (existing) {
                const stmt = db.prepare(`
                    UPDATE settings 
                    SET apiKey = ?, baseUrl = ?, isActive = ?, testedAt = ?
                    WHERE id = ?
                `);
                stmt.run(apiKey, baseUrl || null, isActive ? 1 : 0, testedAt, existing.id);
                result = { id: existing.id };
            } else {
                const stmt = db.prepare(`
                    INSERT INTO settings (providerId, apiKey, model, baseUrl, isActive, testedAt)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                const info = stmt.run(providerId, apiKey, model, baseUrl || null, isActive ? 1 : 0, testedAt);
                result = { id: info.lastInsertRowid };
            }
            return result;
        });

        const result = insert();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/settings/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM settings WHERE id = ?');
        stmt.run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Prompts Routes ---
app.get('/api/prompts', (req, res) => {

    try {
        const stmt = db.prepare('SELECT * FROM prompts ORDER BY createdAt DESC');
        const prompts = stmt.all();
        res.json(prompts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/prompts/:id', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM prompts WHERE id = ?');
        const prompt = stmt.get(req.params.id);
        if (prompt) res.json(prompt);
        else res.status(404).json({ error: 'Prompt not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/prompts', (req, res) => {
    try {
        const { title, framework, prompt, fields, tones, industry, role, qualityScore, qualityScoreDetails, createdAt, updatedAt, providerId, model, simpleIdea } = req.body;

        const stmt = db.prepare(`
            INSERT INTO prompts (title, framework, prompt, fields, tones, industry, role, qualityScore, qualityScoreDetails, createdAt, updatedAt, providerId, model, simpleIdea)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
            title, framework, prompt, fields, tones,
            industry || null, role || null, qualityScore || null, qualityScoreDetails || null,
            createdAt, updatedAt, providerId || null, model || null, simpleIdea || null
        );

        res.status(201).json({ id: info.lastInsertRowid });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/prompts/:id', (req, res) => {
    try {
        const updates = req.body;
        const id = req.params.id;

        const fields = Object.keys(updates).filter(k => k !== 'id');
        const values = fields.map(k => updates[k]);

        const setClause = fields.map(f => `${f} = ?`).join(', ');

        // Always update timestamp
        const finalSetClause = setClause + ', updatedAt = ?';
        const finalValues = [...values, new Date().toISOString(), id];

        const stmt = db.prepare(`UPDATE prompts SET ${finalSetClause} WHERE id = ?`);
        stmt.run(...finalValues);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/prompts/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM prompts WHERE id = ?');
        stmt.run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/prompts/search/query', (req, res) => {
    try {
        const { q } = req.query;
        const stmt = db.prepare(`
            SELECT * FROM prompts 
            WHERE title LIKE ? OR prompt LIKE ? 
            ORDER BY createdAt DESC
        `);
        const searchTerm = `%${q}%`;
        const prompts = stmt.all(searchTerm, searchTerm);
        res.json(prompts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Local Prompt Server running on http://localhost:${PORT}`);
});
