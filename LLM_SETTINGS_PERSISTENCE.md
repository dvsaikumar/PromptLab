# LLM Settings Persistence

## ✅ Your LLM Settings Are Automatically Saved!

Good news! **DStudiosLab automatically saves your LLM configuration** and restores it every time you start the application. You only need to configure your settings once!

## What Gets Saved

Every time you save your LLM settings, the following information is persisted:

- ✅ **Provider** (Anthropic, OpenAI, Gemini, DeepSeek, Kimi, GLM, Custom)
- ✅ **API Key** (stored securely in localStorage)
- ✅ **Model Name** (e.g., claude-3-5-sonnet-20240620, gpt-4o)
- ✅ **Base URL** (for custom endpoints)

## How It Works

### Automatic Persistence

```typescript
// Settings are loaded on startup
const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => {
    const saved = localStorage.getItem('llmConfig');
    return saved ? JSON.parse(saved) : defaultConfig;
});

// Settings are saved automatically when changed
useEffect(() => {
    localStorage.setItem('llmConfig', JSON.stringify(llmConfig));
}, [llmConfig]);
```

### Storage Location

**Browser Mode:**
- Stored in: `localStorage['llmConfig']`
- Persists: Across browser sessions (until you clear browser data)

**Electron Mode:**
- Stored in: `localStorage['llmConfig']` (managed by Electron)
- Persists: Permanently on disk, survives app restarts

## User Experience

### When You Save Settings:

1. Click "Save Configuration" in Settings Modal
2. ✅ **First Toast**: "✓ [Provider] settings saved!" (green, 4 seconds)
3. 🔄 **Second Toast**: "Settings will be used on next startup" (blue, 3 seconds)
4. Settings are immediately applied to current session
5. Settings are written to localStorage

### When You Restart the App:

1. App loads
2. Checks localStorage for saved config
3. If found: Restores your settings automatically
4. If not found: Uses default settings (Anthropic/Claude)
5. Header shows current LLM provider and model

## Visual Indicators

### Settings Modal Header
```
LLM Settings
🟢 Auto-saved • Persists across sessions
```

### Main Header (Top Right)
```
┌─────────────────┐
│ 🖥️ Anthropic   │
│    3-5-sonnet   │
└─────────────────┘
```
Shows currently active LLM configuration

## Default Configuration

If no saved settings are found, the app uses:

```json
{
  "providerId": "anthropic",
  "apiKey": "",
  "model": "claude-3-5-sonnet-20240620",
  "baseUrl": ""
}
```

## Security Notes

### API Key Storage

- ✅ Stored in browser's localStorage
- ✅ Never sent to external servers (except the LLM provider you configure)
- ✅ Only accessible by your application
- ⚠️ **Not encrypted** - localStorage stores in plain text
- ⚠️ **Recommendation**: Use environment-specific API keys with limited permissions

### Best Practices

1. **Use Read-Only Keys**: If your LLM provider supports it, use API keys with read-only or limited permissions
2. **Rotate Keys**: Periodically rotate your API keys
3. **Don't Share**: Never share your localStorage data or browser profile
4. **Private Browsing**: Settings won't persist in private/incognito mode

## Verification

### Check Saved Settings (Browser)

1. Open **Developer Tools** (F12)
2. Go to **Application** → **Local Storage**
3. Look for `llmConfig` key
4. You should see JSON like:
```json
{
  "providerId": "anthropic",
  "apiKey": "sk-ant-...",
  "model": "claude-3-5-sonnet-20240620",
  "baseUrl": ""
}
```

### Test Persistence

1. **Configure your LLM settings** (Settings → Save Configuration)
2. **Close the application/browser completely**
3. **Reopen the application**
4. **Click the LLM indicator** in the top-right header
5. ✅ Your settings should still be there!

## Troubleshooting

### Settings Not Persisting?

**Browser:**
- Check if you're in private/incognito mode (localStorage doesn't persist)
- Check if browser is set to clear data on exit
- Try a different browser
- Check browser console for errors

**Electron:**
- Check if app has write permissions
- Check browser console in DevTools
- Try clearing localStorage and reconfiguring

### Lost API Key?

If you lose your API key:
1. Go to your LLM provider's dashboard
2. Generate a new API key
3. Update settings in DStudiosLab
4. Save configuration

### Reset to Defaults

To reset to default settings:

**Browser Console:**
```javascript
localStorage.removeItem('llmConfig');
location.reload();
```

**Or:**
1. Open Settings
2. Change provider to "Anthropic"
3. Clear API key
4. Save Configuration

## Multiple Configurations

Currently, DStudiosLab supports **one active configuration** at a time. If you need to switch between multiple providers:

1. Open Settings (click LLM indicator in header)
2. Change provider/model/API key
3. Save Configuration
4. New settings take effect immediately

**Future Enhancement**: Support for multiple saved profiles with quick switching.

## Data Migration

### Exporting Settings

```javascript
// In browser console
const config = localStorage.getItem('llmConfig');
console.log(config); // Copy this
```

### Importing Settings

```javascript
// In browser console
const config = '{"providerId":"anthropic",...}'; // Paste your config
localStorage.setItem('llmConfig', config);
location.reload();
```

## API Reference

### LLMConfig Type

```typescript
interface LLMConfig {
    providerId: LLMProviderId;
    apiKey: string;
    model: string;
    baseUrl?: string;
}

type LLMProviderId = 
    | 'deepseek' 
    | 'kimi' 
    | 'glm' 
    | 'anthropic' 
    | 'openai' 
    | 'gemini' 
    | 'custom';
```

### Supported Providers

| Provider | Default Model | Default Base URL |
|----------|---------------|------------------|
| Anthropic | claude-3-5-sonnet-20240620 | (built-in) |
| OpenAI | gpt-4o | https://api.openai.com/v1 |
| Gemini | gemini-pro | https://generativelanguage.googleapis.com/v1beta |
| DeepSeek | deepseek-chat | https://api.deepseek.com |
| Kimi | moonshot-v1-8k | https://api.moonshot.cn/v1 |
| GLM | glm-4 | https://open.bigmodel.cn/api/paas/v4 |
| Custom | (user-defined) | (user-defined) |

## Summary

✅ **Automatic**: Settings save automatically when you click "Save Configuration"  
✅ **Persistent**: Settings survive app/browser restarts  
✅ **Secure**: Stored locally, never sent to external servers (except your LLM provider)  
✅ **Visual**: Clear indicators show current configuration  
✅ **Flexible**: Easy to change and update anytime  

**You only need to configure your LLM settings once!** 🎉

---

**Last Updated**: 2025-12-06  
**Version**: 1.0.0
