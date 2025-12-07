# 🔧 macOS App Logo Troubleshooting

## Issue
Logo not showing in the macOS app after rebuild.

## ✅ Verified
- Logo file exists: `public/d-logo.png` ✓
- Logo is included in build: `dist/d-logo.png` ✓
- Logo displays correctly in webapp ✓
- Header code is correct ✓

## 🔍 Troubleshooting Steps

### Step 1: Completely Remove Old App
```bash
# Delete the app
rm -rf /Applications/DStudiosLab.app

# Clear app cache
rm -rf ~/Library/Application\ Support/DStudiosLab
rm -rf ~/Library/Caches/DStudiosLab
rm -rf ~/Library/Preferences/com.dstudioslab.app.plist
```

### Step 2: Install Fresh
1. Open `dist-electron/DStudiosLab-1.0.0-arm64.dmg`
2. Drag DStudiosLab to Applications
3. **Right-click** → Open (first time)
4. Launch the app

### Step 3: Force Refresh
If logo still doesn't show:
1. Open the app
2. Press **Cmd+R** to reload
3. Or press **Cmd+Shift+R** for hard refresh

### Step 4: Check Developer Tools
1. In the app, press **Cmd+Option+I** to open DevTools
2. Go to Console tab
3. Look for any errors about `d-logo.png`
4. Check Network tab to see if the image is loading

## 🎯 Alternative: Use Inline SVG

If the image still doesn't load, we can use an inline SVG instead (no file dependency):

Edit `src/components/layout/Header.tsx` and replace the img tag with:

```tsx
<div className="h-16 w-16 flex items-center justify-center bg-white rounded">
    <svg width="64" height="64" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <text x="50" y="70" fontSize="80" fontWeight="bold" fontFamily="Arial" fill="#000" textAnchor="middle">D</text>
    </svg>
</div>
```

## 📝 Current Logo Settings

**File**: `/d-logo.png`  
**Size**: 679 x 881 pixels  
**Format**: PNG with transparency  
**CSS**: `className="h-16 w-auto object-contain"`

## ✅ Expected Result

The logo should show the full D Studio badge with:
- Hexagonal frame
- "DEVELOPER" text
- Large D with diagonal stripes
- "STUDIO" text
- "TESTER" text

---

**Last Build**: Dec 6, 2025 10:23 AM  
**App Version**: 1.0.0  
**Platform**: macOS ARM64
