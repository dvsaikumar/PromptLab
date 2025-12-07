# 📐 Standard Page Design Specifications

## Overview
All pages in DStudiosLab now follow a consistent, professional design pattern.

## 🎨 Standard Header Design

### Structure
```tsx
<div className="sticky top-16 z-40 bg-slate-50/95 backdrop-blur-sm -mx-4 px-8 pt-4 pb-2 mb-8 border-b border-transparent transition-all">
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[color1] to-[color2] flex items-center justify-center text-white shadow-lg">
                <Icon size={28} />
            </div>
            <div>
                <h1 className="text-4xl font-bold text-slate-900 tracking-tight">[Page Title]</h1>
                <p className="text-slate-600 text-lg">[Page Subtitle]</p>
            </div>
        </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mt-6" />
</div>
```

### Key Specifications

**Container**:
- Position: `sticky top-16` (sticks below main header)
- Background: `bg-slate-50/95 backdrop-blur-sm` (semi-transparent with blur)
- Padding: `px-8 pt-4 pb-2 mb-8`
- Margin: `-mx-4` (negative to extend to edges)
- Z-index: `z-40`

**Icon Container**:
- Size: `w-14 h-14` (56px × 56px)
- Border radius: `rounded-2xl`
- Gradient: `bg-gradient-to-br from-[color1] to-[color2]`
- Shadow: `shadow-lg`
- Text color: `text-white`

**Icon**:
- Size: `28` (Lucide icon size)

**Title (h1)**:
- Font size: `text-4xl` (36px)
- Font weight: `font-bold`
- Color: `text-slate-900`
- Tracking: `tracking-tight`

**Subtitle (p)**:
- Font size: `text-lg` (18px)
- Color: `text-slate-600`

**Divider Line**:
- Position: `absolute bottom-0 left-0 right-0`
- Height: `h-px`
- Gradient: `bg-gradient-to-r from-transparent via-slate-300 to-transparent`
- Margin: `mt-6`

## 📄 Page Layout

### Full Page Structure
```tsx
<div className="h-full flex flex-col">
    {/* Fixed Header */}
    <div className="sticky top-16 z-40 ...">
        {/* Header content */}
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto px-4">
        {/* Page content */}
    </div>
</div>
```

**Outer Container**:
- Layout: `h-full flex flex-col`

**Content Area**:
- Flex: `flex-1` (takes remaining space)
- Overflow: `overflow-y-auto` (scrollable)
- Padding: `px-4` (horizontal padding only)

## 🎨 Page-Specific Colors

### My Hub
- Gradient: `from-blue-500 to-indigo-600`
- Icon: `Sparkles`

### Prompt Lab
- Gradient: `from-indigo-500 to-purple-600`
- Icon: `FlaskConical`

### Saved Prompts
- Gradient: `from-emerald-500 to-teal-500`
- Icon: `FileText`

### Tone Shifter
- Gradient: `from-pink-500 to-rose-600`
- Icon: `Palette`

## ✅ Applied To All Pages

All pages now use this standard design:
- ✅ My Hub
- ✅ Prompt Lab
- ✅ Saved Prompts
- ✅ Tone Shifter

## 📏 Spacing & Sizing Summary

| Element | Value | Pixels |
|---------|-------|--------|
| Header icon | w-14 h-14 | 56×56px |
| Icon size | 28 | 28px |
| Title | text-4xl | 36px |
| Subtitle | text-lg | 18px |
| Header padding X | px-8 | 32px |
| Header padding top | pt-4 | 16px |
| Header padding bottom | pb-2 | 8px |
| Header margin bottom | mb-8 | 32px |
| Content padding X | px-4 | 16px |
| Icon gap | gap-4 | 16px |

## 🎯 Benefits

1. **Consistency**: All pages look and feel the same
2. **Professional**: Clean, modern design
3. **Sticky Headers**: Always visible while scrolling
4. **Responsive**: Works on all screen sizes
5. **Accessible**: Clear hierarchy and contrast
6. **Maintainable**: Easy to update across all pages

---

**Last Updated**: December 6, 2025  
**Version**: 1.0.0
