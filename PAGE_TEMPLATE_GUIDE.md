# 📄 Page Template Guide

## Overview
This guide explains how to use the standard page template to create new pages in DStudiosLab.

## 🎯 Template Location
`src/templates/PageTemplate.tsx`

## 📋 How to Create a New Page

### Step 1: Copy the Template
```bash
cp src/templates/PageTemplate.tsx src/pages/YourNewPage.tsx
```

### Step 2: Customize the Component

#### 1. Rename the Component
```tsx
// Change from:
export const PageTemplate: React.FC = () => {

// To:
export const YourNewPage: React.FC = () => {
```

#### 2. Update the Icon
```tsx
// Import your desired icon from lucide-react
import { YourIcon } from 'lucide-react';

// Update in the JSX
<YourIcon size={24} />
```

#### 3. Change the Gradient Colors
Choose from these preset gradients or create your own:

**Available Gradients**:
- Blue/Indigo: `from-blue-500 to-indigo-600` (My Hub)
- Indigo/Purple: `from-indigo-500 to-purple-600` (Prompt Lab)
- Emerald/Teal: `from-emerald-500 to-teal-500` (Saved Prompts)
- Pink/Rose: `from-pink-500 to-rose-600` (Tone Shifter)
- Orange/Red: `from-orange-500 to-red-600`
- Green/Emerald: `from-green-500 to-emerald-600`
- Violet/Purple: `from-violet-500 to-purple-600`
- Cyan/Blue: `from-cyan-500 to-blue-600`

```tsx
<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[color1] to-[color2] flex items-center justify-center text-white shadow-lg">
```

#### 4. Update Title and Subtitle
```tsx
<h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Page Title</h1>
<p className="text-slate-600 text-lg">Your page description</p>
```

#### 5. Add Your Content
Replace the example content in the content area:

```tsx
<div className="flex-1 overflow-y-auto px-4">
    {/* Your custom content here */}
</div>
```

### Step 3: Add to Navigation

#### Update Sidebar
Edit `src/components/layout/Sidebar.tsx`:

```tsx
const menuItems = [
    // ... existing items
    { id: 'your-page', label: 'Your Page', icon: YourIcon },
];
```

#### Update App.tsx
Edit `src/App.tsx`:

```tsx
import { YourNewPage } from '@/pages/YourNewPage';

// In renderPage function:
case 'your-page':
    return <YourNewPage />;
```

## 🎨 Design Specifications

### Header
- **Position**: `sticky top-16` (sticks below main header)
- **Background**: `bg-slate-50/95 backdrop-blur-sm`
- **Padding**: `px-6 pt-1 pb-2 mb-6`
- **Z-index**: `z-40`

### Icon Container
- **Size**: `w-12 h-12` (48×48px)
- **Border radius**: `rounded-2xl`
- **Shadow**: `shadow-lg`

### Icon
- **Size**: `24` (Lucide icon size)

### Title
- **Font size**: `text-3xl` (30px)
- **Font weight**: `font-bold`
- **Color**: `text-slate-900`
- **Tracking**: `tracking-tight`

### Subtitle
- **Font size**: `text-lg` (18px)
- **Color**: `text-slate-600`

### Content Area
- **Flex**: `flex-1` (takes remaining space)
- **Overflow**: `overflow-y-auto` (scrollable)
- **Padding**: `px-4`

## 📝 Complete Example

Here's a complete example of creating a "Settings" page:

```tsx
import React from 'react';
import { Settings } from 'lucide-react';

export const SettingsPage: React.FC = () => {
    return (
        <div className="h-full flex flex-col">
            {/* Fixed Header - Standard Design */}
            <div className="sticky top-16 z-40 bg-slate-50/95 backdrop-blur-sm -mx-4 px-6 pt-1 pb-2 mb-6 border-b border-transparent transition-all">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                            <Settings size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
                            <p className="text-slate-600 text-lg">Configure your preferences</p>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mt-6" />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-4">
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">General Settings</h2>
                        <p className="text-slate-600">Your settings content...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
```

## ✅ Checklist for New Pages

- [ ] Copy template to `src/pages/YourPage.tsx`
- [ ] Rename component
- [ ] Import and add icon
- [ ] Choose gradient colors
- [ ] Update title and subtitle
- [ ] Add page content
- [ ] Add to sidebar menu items
- [ ] Add route in App.tsx
- [ ] Test the page

## 🎯 Best Practices

1. **Consistent Naming**: Use PascalCase for component names
2. **Icon Choice**: Choose icons that represent the page purpose
3. **Color Harmony**: Pick gradients that complement existing pages
4. **Content Structure**: Use cards and sections for organized content
5. **Responsive Design**: Test on different screen sizes

## 📚 Available Icons

Common Lucide icons you can use:
- `Home`, `Sparkles`, `FileText`, `Palette`, `Settings`
- `Users`, `Database`, `BarChart`, `Calendar`, `Mail`
- `Search`, `Filter`, `Download`, `Upload`, `Share`
- `Bell`, `Heart`, `Star`, `Bookmark`, `Tag`

Browse all icons at: https://lucide.dev/icons/

---

**Template Version**: 1.0.0  
**Last Updated**: December 6, 2025
