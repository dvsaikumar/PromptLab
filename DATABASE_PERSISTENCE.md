# Database Persistence - DStudiosLab

## Overview
DStudiosLab uses a **dual-storage strategy** to ensure your saved prompts are **permanently stored** and persist across application restarts, browser refreshes, and system reboots.

## Storage Mechanisms

### 1. Electron App (Desktop)
When running as an Electron desktop application:

- **Database**: SQLite database using `better-sqlite3`
- **Location**: `{userData}/prompts.db`
  - **macOS**: `~/Library/Application Support/DStudiosLab/prompts.db`
  - **Windows**: `%APPDATA%/DStudiosLab/prompts.db`
  - **Linux**: `~/.config/DStudiosLab/prompts.db`
- **Persistence**: ✅ **Permanent** - Survives app restarts, system reboots
- **Backup**: File-based, can be backed up manually

### 2. Browser/Web Version
When running in a web browser:

- **Database**: Browser localStorage
- **Location**: Browser's local storage (managed by browser)
- **Persistence**: ✅ **Permanent** - Survives browser restarts, tab closes
- **Limitations**: 
  - Cleared if user clears browser data
  - Limited to ~5-10MB depending on browser
  - Domain-specific (localhost vs production domain)

## Database Schema

```sql
CREATE TABLE prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    framework TEXT NOT NULL,
    prompt TEXT NOT NULL,
    fields TEXT NOT NULL,        -- JSON stringified
    tones TEXT NOT NULL,          -- JSON stringified
    industry TEXT,
    role TEXT,
    qualityScore INTEGER,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_framework ON prompts(framework);
CREATE INDEX idx_createdAt ON prompts(createdAt DESC);
```

## How It Works

### Saving a Prompt
1. User clicks "Save" button in Prompt Output
2. Modal opens to enter a title
3. Prompt data is sent to database service
4. **Electron**: IPC call to main process → SQLite insert → File written to disk
5. **Browser**: Direct localStorage write
6. Success confirmation shown to user

### Loading Prompts
1. User navigates to "Saved Prompts" page
2. Database service fetches all prompts
3. **Electron**: IPC call to main process → SQLite query → Returns data
4. **Browser**: localStorage read → Parse JSON → Returns data
5. Prompts displayed in grid view

### Data Flow

```
┌─────────────────┐
│  React UI       │
│  (SavedPrompts) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database       │
│  Service        │
│  (database.ts)  │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌─────────┐  ┌──────────────┐
│ Electron│  │  Browser     │
│ SQLite  │  │  localStorage│
│ (File)  │  │  (Memory)    │
└─────────┘  └──────────────┘
```

## Verification

### Check if Prompts are Persisting (Electron)

1. **Save a test prompt** in the app
2. **Close the application completely**
3. **Reopen the application**
4. Navigate to "Saved Prompts"
5. ✅ Your prompt should still be there

### Check Database Location (Electron)

**macOS/Linux:**
```bash
# Find the database file
ls -la ~/Library/Application\ Support/DStudiosLab/prompts.db

# View database contents
sqlite3 ~/Library/Application\ Support/DStudiosLab/prompts.db "SELECT * FROM prompts;"
```

**Windows:**
```cmd
# Find the database file
dir %APPDATA%\DStudiosLab\prompts.db

# View database contents (requires sqlite3.exe)
sqlite3 %APPDATA%\DStudiosLab\prompts.db "SELECT * FROM prompts;"
```

### Check if Prompts are Persisting (Browser)

1. **Open Developer Tools** (F12)
2. Go to **Application** tab → **Local Storage**
3. Look for `saved_prompts` key
4. You should see JSON array of your prompts

## Backup & Export

### Manual Backup (Electron)
Simply copy the database file:
```bash
# macOS
cp ~/Library/Application\ Support/DStudiosLab/prompts.db ~/Desktop/prompts-backup.db

# Windows
copy %APPDATA%\DStudiosLab\prompts.db %USERPROFILE%\Desktop\prompts-backup.db
```

### Export Individual Prompts
Each prompt can be exported from the UI in multiple formats:
- **Markdown (.md)** - Human-readable format
- **Plain Text (.txt)** - Just the prompt text
- **JSON (.json)** - Complete data with metadata

## Troubleshooting

### Prompts Not Persisting?

**Electron App:**
1. Check if database file exists at the userData path
2. Check file permissions (should be readable/writable)
3. Check console for database errors
4. Verify `better-sqlite3` is installed: `npm list better-sqlite3`

**Browser:**
1. Check if localStorage is enabled in browser settings
2. Check if you're in private/incognito mode (localStorage may not persist)
3. Check browser console for errors
4. Verify localStorage quota isn't exceeded

### Database Corruption (Electron)

If the database becomes corrupted:
1. Close the app
2. Rename the old database: `prompts.db` → `prompts.db.backup`
3. Restart the app (new database will be created)
4. Try to recover data from backup if needed

## Security

- **Electron**: Database file is stored locally, accessible only to the user
- **Browser**: localStorage is domain-specific, not accessible by other sites
- **No encryption**: Data is stored in plain text (consider encrypting sensitive prompts)
- **No cloud sync**: Data stays on your device (feature can be added)

## Future Enhancements

Potential improvements:
- [ ] Cloud sync across devices
- [ ] Database encryption
- [ ] Automatic backups
- [ ] Import/Export all prompts
- [ ] Database compression for large datasets
- [ ] Search indexing for faster queries

## Technical Details

### Dependencies
- **better-sqlite3**: Fast, synchronous SQLite3 bindings for Node.js
- **electron**: Desktop app framework
- **localStorage API**: Browser storage API

### Database Operations
All operations are **synchronous** in Electron (using better-sqlite3) but exposed as **async** to maintain consistent API with browser version.

### Transaction Safety
- Each save operation is atomic
- Database is properly closed on app quit
- Indexes ensure fast queries even with thousands of prompts

---

**Last Updated**: 2025-12-06
**Version**: 1.0.0
