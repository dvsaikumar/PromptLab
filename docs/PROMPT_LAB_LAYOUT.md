# Prompt Lab Page - Complete Layout Structure

## Visual Layout Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [1] GLOBAL HEADER (Header.tsx)                                             │
│  fixed top-0 left-0 right-0 h-16 z-50                                       │
│  "D Studios Lab" + Logo + LLM Indicator                                     │
├─────────┬───────────────────────────────────────────────────────────────────┤
│ [2]     │  [3] PAGE HEADER (PageHeader.tsx)                                 │
│ GLOBAL  │  fixed top-16 right-0 z-40 h-20                                   │
│ SIDEBAR │  lg:left-16 (sidebar collapsed) or lg:left-64 (expanded)          │
│         │  "Prompt Lab" + Icon + Templates Button                           │
│ fixed   ├────────────────────┬──────────────────────────────────────────────┤
│ left-0  │ [4] SECONDARY      │  [5] CONTENT PANEL HEADER                    │
│ top-16  │ SIDEBAR            │  (ContentPanelHeader.tsx)                    │
│ w-16    │ (SecondarySidebar) │  fixed top-[144px] right-0 z-35 h-[88px]     │
│  or     │                    │  lg:left-[352px] or lg:left-[544px]          │
│ w-64    │ fixed top-[144px]  │  "Quick Start" / "Components" / etc.         │
│         │ bottom-16          ├──────────────────────────────────────────────┤
│ z-40    │ w-72               │                                              │
│         │ lg:left-16/64      │  [6] SCROLLABLE CONTENT                      │
│         │ z-30               │                                              │
│         │                    │  pt-[100px] (offset for fixed headers)       │
│         │ ┌──────────────┐   │  pb-6 px-6                                   │
│         │ │ Build Steps  │   │  h-full overflow-y-auto                      │
│         │ ├──────────────┤   │                                              │
│         │ │ Quick Start  │   │  ┌──────────────────────────────────────┐   │
│         │ │ Frameworks   │   │  │  Form fields / Selectors / Output    │   │
│         │ │ Tones        │   │  │  (scrolls vertically)                │   │
│         │ │ Components   │   │  │                                      │   │
│         │ │ Output       │   │  │                                      │   │
│         │ ├──────────────┤   │  │                                      │   │
│         │ │ Active Ctx   │   │  │                                      │   │
│         │ │ [Generate]   │   │  └──────────────────────────────────────┘   │
│         │ └──────────────┘   │                                              │
├─────────┴────────────────────┴──────────────────────────────────────────────┤
│  [7] GLOBAL FOOTER (Footer.tsx)                                             │
│  fixed bottom-0 left-0 right-0 h-16 z-30                                    │
│  lg:left-16 (collapsed) or lg:left-64 (expanded)                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete HTML/JSX Structure with CSS Classes

### Level 0: App Root (App.tsx)

```jsx
<div className="min-h-screen bg-slate-50">
    
    {/* [1] Global Header - Always visible at top */}
    <Header />
    
    {/* [2] Global Sidebar - Left navigation */}
    <Sidebar />
    
    {/* Main Content Area - Offset for header/footer/sidebar */}
    <main className={clsx(
        "pt-16 pb-16 min-h-screen transition-all duration-300",
        isSidebarOpen ? "lg:pl-64" : "lg:pl-16"
    )}>
        <div className="px-2 py-8">
            {/* Page content rendered here */}
            <PromptLab isSidebarOpen={isSidebarOpen} />
        </div>
    </main>
    
    {/* [7] Global Footer - Always visible at bottom */}
    <Footer />
    
</div>
```

---

### Level 1: Global Header (Header.tsx)

```jsx
<header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 shadow-sm">
    <div className="h-full px-6 flex items-center justify-between">
        
        {/* Left: Menu Toggle + Logo */}
        <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                {/* Menu/X icon */}
            </button>
            <div className="flex items-center gap-3">
                <img src="/d-logo.png" className="h-12 w-auto object-contain" />
                <h1 className="text-4xl font-bold text-slate-900">D Studios Lab</h1>
            </div>
        </div>
        
        {/* Right: LLM Indicator */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
            {/* Provider + Model info */}
        </div>
        
    </div>
</header>
```

**CSS Breakdown:**
| Property | Value | Purpose |
|----------|-------|---------|
| `fixed` | - | Removes from flow, stays in viewport |
| `top-0 left-0 right-0` | 0px | Stretches across top of viewport |
| `h-16` | 64px | Fixed height |
| `z-50` | 50 | Highest z-index, above everything |

---

### Level 2: Global Sidebar (Sidebar.tsx)

```jsx
<aside className={clsx(
    "fixed top-16 left-0 bottom-0 bg-white border-r border-slate-200 z-40 transition-all duration-300",
    isOpen ? "w-64 translate-x-0" : "w-16 -translate-x-full lg:translate-x-0"
)}>
    <nav className="p-4 flex flex-col h-full">
        {/* Navigation items */}
        <div className="flex-1 space-y-2">
            {/* My Hub, Prompt Lab, Tone Shifter, Saved Prompts */}
        </div>
        {/* Settings button at bottom */}
    </nav>
</aside>
```

**CSS Breakdown:**
| Property | Value | Purpose |
|----------|-------|---------|
| `fixed` | - | Stays in viewport |
| `top-16` | 64px | Below global header |
| `left-0 bottom-0` | 0px | Left edge to bottom |
| `w-16` / `w-64` | 64px / 256px | Collapsed/Expanded width |
| `z-40` | 40 | Below header, above content |

---

### Level 3: Prompt Lab Page (PromptLab.tsx)

```jsx
<div className="min-h-screen bg-slate-50">
    
    {/* [3] Page Header - Fixed below global header */}
    <PageHeader
        title="Prompt Lab"
        subtitle="Build powerful AI prompts using proven frameworks"
        icon={FlaskConical}
        iconGradient="from-indigo-500 to-purple-600"
        shadowColor="shadow-indigo-500/30"
        rightContent={<Button>Templates</Button>}
        isSidebarOpen={isSidebarOpen}
    />
    
    {/* [4] Secondary Sidebar - Fixed left panel */}
    <SecondarySidebar 
        title="Build Steps" 
        footer={SidebarFooter} 
        isSidebarOpen={isSidebarOpen}
    >
        <nav className="space-y-2">
            {/* Quick Start, Frameworks, Tones, Components, Output buttons */}
        </nav>
    </SecondarySidebar>
    
    {/* Main Content Area */}
    <main className={clsx(
        "pt-[232px] pb-16 transition-all duration-300",
        isSidebarOpen ? "lg:ml-[544px]" : "lg:ml-[352px]",
        "ml-72"
    )}>
        <div className="h-[calc(100vh-312px)] p-6 overflow-hidden">
            <div className="h-full">
                {/* [5] + [6] Content Panel Header + Scrollable Content */}
                {renderContent()}
            </div>
        </div>
    </main>
    
</div>
```

---

### Level 4: Page Header (PageHeader.tsx)

```jsx
<div className={clsx(
    "fixed top-16 right-0 z-40 h-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-8 flex items-center transition-all duration-300",
    isSidebarOpen ? "lg:left-64" : "lg:left-16",
    "left-0"
)}>
    <div className="flex items-center justify-between w-full">
        
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <FlaskConical size={28} />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Prompt Lab</h1>
                <p className="text-slate-500 mt-0.5">Build powerful AI prompts...</p>
            </div>
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-3">
            <Button>Templates</Button>
        </div>
        
    </div>
</div>
```

**CSS Breakdown:**
| Property | Value | Purpose |
|----------|-------|---------|
| `fixed` | - | Stays in viewport |
| `top-16` | 64px | Below global header (64px) |
| `right-0` | 0px | Stretches to right edge |
| `lg:left-16` / `lg:left-64` | 64px/256px | Respects global sidebar |
| `h-20` | 80px | Fixed height |
| `z-40` | 40 | Same level as global sidebar |

---

### Level 5: Secondary Sidebar (SecondarySidebar.tsx)

```jsx
<aside className={clsx(
    "fixed top-[144px] bottom-16 w-72 bg-white border-r border-slate-200 flex flex-col z-30 overflow-hidden transition-all duration-300",
    isSidebarOpen ? "lg:left-64" : "lg:left-16",
    "left-0"
)}>
    
    {/* Title Section - Fixed at top of sidebar */}
    <div className="p-6 pb-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
            <h3 className="font-bold text-xl text-slate-900">Build Steps</h3>
        </div>
    </div>
    
    {/* Scrollable Navigation - Middle */}
    <div className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar">
        <nav className="space-y-2">
            {/* Menu items */}
        </nav>
    </div>
    
    {/* Footer Section - Fixed at bottom of sidebar */}
    <div className="p-6 pt-4 border-t border-slate-200 bg-white flex-shrink-0">
        {/* Active Context badges + Generate button */}
    </div>
    
</aside>
```

**CSS Breakdown:**
| Property | Value | Purpose |
|----------|-------|---------|
| `fixed` | - | Stays in viewport |
| `top-[144px]` | 144px | Below global header (64px) + page header (80px) |
| `bottom-16` | 64px | Above global footer |
| `w-72` | 288px | Fixed width |
| `lg:left-16` / `lg:left-64` | 64px/256px | Respects global sidebar |
| `z-30` | 30 | Below headers, above main content |

---

### Level 6: Content Panel Header (ContentPanelHeader.tsx)

```jsx
<div className={clsx(
    "fixed top-[144px] right-0 z-35 h-[88px] bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 flex items-center transition-all duration-300",
    isSidebarOpen ? "lg:left-[544px]" : "lg:left-[352px]",
    "left-72"
)}>
    <div className="flex items-center justify-between w-full">
        
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <FileText size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Prompt Components</h2>
                <p className="text-slate-500 text-sm">Fill in the framework fields</p>
            </div>
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-3">
            {/* Chain of Thoughts toggle, AUTO-FILL button, etc. */}
        </div>
        
    </div>
</div>
```

**CSS Breakdown:**
| Property | Value | Purpose |
|----------|-------|---------|
| `fixed` | - | Stays in viewport |
| `top-[144px]` | 144px | Same level as secondary sidebar header |
| `right-0` | 0px | Stretches to right edge |
| `lg:left-[352px]` | 352px | Global sidebar (64px) + secondary sidebar (288px) |
| `lg:left-[544px]` | 544px | Global sidebar expanded (256px) + secondary sidebar (288px) |
| `h-[88px]` | 88px | Fixed height |
| `z-35` | 35 | Between secondary sidebar and content |

---

### Level 7: Scrollable Content Area

```jsx
<div className="h-full overflow-y-auto px-6 pb-6 pt-[100px] custom-scrollbar bg-slate-50/30 animate-in fade-in slide-in-from-right-4 duration-300">
    {/* Actual content - forms, selectors, output, etc. */}
    <div className="space-y-4">
        {currentFramework.fields.map((field) => (
            <InputField key={field.id} {...field} />
        ))}
    </div>
</div>
```

**CSS Breakdown:**
| Property | Value | Purpose |
|----------|-------|---------|
| `h-full` | 100% | Takes full height of parent |
| `overflow-y-auto` | auto | Enables vertical scrolling |
| `pt-[100px]` | 100px | Offset for fixed content panel header |
| `pb-6 px-6` | 24px | Padding for content |

---

### Level 8: Global Footer (Footer.tsx)

```jsx
<footer className={clsx(
    "fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-30 transition-all duration-300",
    isSidebarOpen ? "lg:left-64" : "lg:left-16"
)}>
    <div className="h-full px-6 flex items-center justify-between">
        {/* Left: Copyright */}
        {/* Center: Logo */}
        {/* Right: Social Links */}
    </div>
</footer>
```

**CSS Breakdown:**
| Property | Value | Purpose |
|----------|-------|---------|
| `fixed` | - | Stays in viewport |
| `bottom-0 left-0 right-0` | 0px | Stretches across bottom |
| `h-16` | 64px | Fixed height |
| `lg:left-16` / `lg:left-64` | 64px/256px | Respects global sidebar |
| `z-30` | 30 | Below headers/sidebars |

---

## Complete Measurements Summary

### Heights (Vertical)
| Element | Height | Top Position |
|---------|--------|--------------|
| Global Header | 64px (`h-16`) | 0px (`top-0`) |
| Page Header | 80px (`h-20`) | 64px (`top-16`) |
| Content Panel Header | 88px (`h-[88px]`) | 144px (`top-[144px]`) |
| Scrollable Content | `calc(100vh - 312px)` | 232px (`pt-[232px]`) |
| Global Footer | 64px (`h-16`) | `bottom-0` |

### Widths (Horizontal - Sidebar Collapsed)
| Element | Width | Left Position |
|---------|-------|---------------|
| Global Sidebar | 64px (`w-16`) | 0px (`left-0`) |
| Secondary Sidebar | 288px (`w-72`) | 64px (`lg:left-16`) |
| Content Area | Remaining | 352px (`lg:ml-[352px]`) |

### Widths (Horizontal - Sidebar Expanded)
| Element | Width | Left Position |
|---------|-------|---------------|
| Global Sidebar | 256px (`w-64`) | 0px (`left-0`) |
| Secondary Sidebar | 288px (`w-72`) | 256px (`lg:left-64`) |
| Content Area | Remaining | 544px (`lg:ml-[544px]`) |

---

## Z-Index Stacking Order

```
z-50  ─── Global Header (topmost, always visible)
z-40  ─── Global Sidebar + Page Header
z-35  ─── Content Panel Header
z-30  ─── Secondary Sidebar + Global Footer
z-20  ─── Content (default scrollable area)
z-10  ─── Background elements
```

---

## Responsive Behavior

### Desktop (lg: 1024px+)
- Global sidebar respects `lg:left-16` or `lg:left-64`
- Content panels offset by full sidebar widths
- All fixed elements visible simultaneously

### Mobile (< 1024px)
- Global sidebar hidden by default (`-translate-x-full`)
- Secondary sidebar uses `left-0`
- Content panels use `ml-72` (only secondary sidebar)
