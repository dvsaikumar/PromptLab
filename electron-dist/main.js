import { app, BrowserWindow, shell, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase, closeDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 900,
        titleBarStyle: 'hiddenInset', // Native mac look
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: false // Temporary fix for API calls to external domains if needed
        }
    });

    // In production, load the local file.
    // In development (when argument is passed or env var set), load localhost.
    const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;

    console.log('Loading URL:', startUrl);

    if (startUrl.startsWith('http')) {
        win.loadURL(startUrl);
        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Open external links in browser
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });
}

// Database IPC Handlers
ipcMain.handle('db:savePrompt', async (event, prompt) => {
    const db = getDatabase();
    return db.savePrompt(prompt);
});

ipcMain.handle('db:getAllPrompts', async () => {
    const db = getDatabase();
    return db.getAllPrompts();
});

ipcMain.handle('db:getPromptById', async (event, id) => {
    const db = getDatabase();
    return db.getPromptById(id);
});

ipcMain.handle('db:getPromptsByFramework', async (event, framework) => {
    const db = getDatabase();
    return db.getPromptsByFramework(framework);
});

ipcMain.handle('db:updatePrompt', async (event, id, updates) => {
    const db = getDatabase();
    return db.updatePrompt(id, updates);
});

ipcMain.handle('db:deletePrompt', async (event, id) => {
    const db = getDatabase();
    return db.deletePrompt(id);
});

ipcMain.handle('db:searchPrompts', async (event, query) => {
    const db = getDatabase();
    return db.searchPrompts(query);
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    closeDatabase();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    closeDatabase();
});
