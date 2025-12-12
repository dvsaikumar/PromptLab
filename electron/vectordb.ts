import * as lancedb from '@lancedb/lancedb';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: lancedb.Connection | null = null;

// Get the path where the database should be stored.
// In development, we might want it in the project root or temp.
// In production, it must be in userData.
const getDbPath = () => {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'lancedb');
    // Ensure directory exists
    if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
    }
    return dbPath;
};

export const initVectorDb = async () => {
    if (db) return db;

    const dbPath = getDbPath();
    console.log('[VectorDB] Initializing LanceDB at:', dbPath);

    try {
        db = await lancedb.connect(dbPath);
        return db;
    } catch (error) {
        console.error('[VectorDB] Failed to connect:', error);
        throw error;
    }
};

export const getVectorDb = async () => {
    if (!db) {
        return await initVectorDb();
    }
    return db;
};

// Generic function to add items to a collection
// vectors should be number[]
export const addVectors = async (collectionName: string, data: any[]) => {
    const db = await getVectorDb();

    // Check if collection exists, if not create it
    // Note: LanceDB requires at least some data or schema to create.
    // We'll trust the first batch defines schema or we check logic.

    try {
        // Try to open, if fail, create
        let table;
        try {
            table = await db.openTable(collectionName);
            await table.add(data);
        } catch (e) {
            // Likely table doesn't exist
            // Create table with data infers schema
            table = await db.createTable(collectionName, data);
        }

        return { success: true, count: data.length };
    } catch (error) {
        console.error(`[VectorDB] Error adding to ${collectionName}:`, error);
        throw error;
    }
};

// Generic search function
export const searchVectors = async (collectionName: string, vector: number[], limit: number = 5) => {
    const db = await getVectorDb();
    try {
        const table = await db.openTable(collectionName);
        const results = await table.vectorSearch(vector).limit(limit).toArray();
        return results;
    } catch (error) {
        // If table doesn't exist, return empty
        console.warn(`[VectorDB] Search failed or table ${collectionName} missing.`, error);
        return [];
    }
};

export const listCollections = async () => {
    const db = await getVectorDb();
    return db.tableNames();
};
