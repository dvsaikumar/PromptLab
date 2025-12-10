# Template Page - Complete Layout Structure

## Visual Layout Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [1] GLOBAL HEADER (Header.tsx)                                             │
│  fixed top-0 left-0 right-0 h-16 z-50                                       │
├─────────┬───────────────────────────────────────────────────────────────────┤
│ [2]     │  [3] PAGE HEADER (PageHeader.tsx)                                 │
│ GLOBAL  │  fixed top-16 right-0 z-40 h-14 (Compact Mode)                    │
│ SIDEBAR │  lg:left-16 (sidebar collapsed) or lg:left-64 (expanded)          │
│         │  "Template Page" + Icon + Pill Menu                               │
│ fixed   ├────────────────────┬──────────────────────────────────────────────┤
│ left-0  │ [4] SECONDARY      │  [5] SECONDARY TOP HEAD BAR                  │
│ top-16  │ SIDEBAR            │  sticky top-0 right-0 z-10 h-16              │
│ w-16    │ (Inline)           │  bg-white border-b border-slate-200          │
│  or     │                    │  px-4 (16px)                                 │
│ w-64    │ fixed top-[120px]  │  "OVERVIEW" + Search + Add Button            │
│         │ bottom-16          ├──────────────────────────────────────────────┤
│ z-40    │ w-64               │                                              │
│         │ lg:left-16/64      │  [6] SCROLLABLE CONTENT                      │
│         │ z-0                │                                              │
│         │                    │  px-1 (4px)                                  │
│         │                    │  h-full overflow-y-auto                      │
│         │ ┌──────────────┐   │                                              │
│         │ │ Dashboard    │   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│         │ ├──────────────┤   │  │ Stat │ │ Stat │ │ Stat │ │ Stat │         │
│         │ │ Analytics    │   │  └──────┘ └──────┘ └──────┘ └──────┘         │
│         │ │ Reports      │   │                                              │
│         │ ├──────────────┤   │  ┌────────────────────────┐ ┌──────────┐     │
│         │ │ User Set.    │   │  │                        │ │ Activity │     │
│         │ └──────────────┘   │  │    Main Content /      │ │ Feed     │     │
│         │                    │  │    Charts              │ │          │     │
│         │                    │  │                        │ │          │     │
│         │                    │  └────────────────────────┘ └──────────┘     │
│         │                    │                                              │
├─────────┴────────────────────┴──────────────────────────────────────────────┤
│  [7] GLOBAL FOOTER (Footer.tsx)                                             │
│  fixed bottom-0 left-0 right-0 h-16 z-30                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete HTML/JSX Structure with CSS Classes

### Level 0: App Root with PageTemplate

```jsx
<div className="min-h-screen bg-slate-50">
    <Header /> {/* [1] */}
    <Sidebar /> {/* [2] */}

    {/* [3] PageTemplate Main Wrapper */}
    <main className={clsx(
        "fixed top-[120px] bottom-16 right-0 overflow-y-auto custom-scrollbar transition-all duration-300",
        "pl-10 pr-10 py-6", // Overridden by !p-0 in implementation
        isSidebarOpen ? "lg:left-64" : "lg:left-16",
        "left-0 flex flex-col !p-0"
    )}>

        {/* Flex Container for Columns */}
        <div className="flex h-full">

            {/* [4] Secondary Sidebar */}
            <div className="w-64 h-full flex-shrink-0 flex flex-col bg-white border-r border-slate-200">
                <div className="p-2 pt-6 space-y-2 flex-1 overflow-y-auto">
                    {/* Navigation Items (Dashboard, Analytics, etc) */}
                </div>
            </div>

            {/* Main Content Column */}
            <div className="flex-1 h-full flex flex-col min-w-0 bg-slate-50 overflow-hidden">

                {/* [5] Secondary Top Head Bar (Sticky) */}
                <div className="shrink-0 h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Overview</h2>
                        {/* Divider & Description */}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Search & Add New Buttons */}
                    </div>
                </div>

                {/* [6] Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto px-1">
                    <div className="max-w-7xl mx-auto space-y-4">
                        {/* 4-Column Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                           {/* Stat Cards */}
                        </div>

                        {/* 3-Column Main Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-2 space-y-4">
                                {/* Main Chart Card */}
                                {/* Detailed List Card */}
                            </div>
                            <div className="space-y-4">
                                {/* Activity Feed Card */}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </main>
    <Footer /> {/* [7] */}
</div>
```

---

## Measurements Summary

### Heights (Vertical)
| Element | Height | Top Position |
|---------|--------|--------------|
| Global Header | 64px (`h-16`) | 0px (`top-0`) |
| Page Header | 56px (`h-14`) | 64px (`top-16`) |
| Secondary Top Bar | 64px (`h-16`) | 0px (relative to content) |
| Content Start | - | 120px (`top-[120px]`) |
| Global Footer | 64px (`h-16`) | `bottom-0` |

### Widths (Horizontal)
| Element | Width |
|---------|-------|
| Global Sidebar | 64px (Collapsed) / 256px (Expanded) |
| Secondary Sidebar | 256px (`w-64`) |
| Main Content | `flex-1` (Remaining Space) |

### Padding & Spacing
| Element | Value | Purpose |
|---------|-------|---------|
| Main Content Area | `p-4` (16px) | Compact internal padding |
| Secondary Top Bar | `px-4` (16px) | Aligned with content padding |
| Grid/Stack Gap | `gap-4` / `space-y-4` | Consistent component spacing |

## Padding & Spacing Levels

This layout uses a strict 4px-grid system (Tailwind defaults).

| Level | Class | Value | Usage |
|-------|-------|-------|-------|
| **Base** | `p-1` / `gap-1` | 4px | Icon/Text grouping, **Main Content Padding (Dense)** |
| **XS** | `p-2` / `gap-2` | 8px | Button internals, secondary sidebar menu items |
| **SM** | `p-3` | 12px | List items, dense card rows |
| **MD** | `p-4` / `gap-4` | 16px | **Primary Layout Spacing**. Used for grid gaps, card padding. |
| **LG** | `p-6` | 24px | *Previously used for main layout, now reserved for spacious standalone pages.* |
| **XL** | `p-8` | 32px | Empty states, hero sections |

**Key Layout Rules:**
- **Content Padding:** `px-1` (4px) - reduced to px-1 (horizontal only) for maximum density.
- **Component Gap:** `gap-4` (16px) - Standard distance between cards and grid columns.
- **Header Padding:** `px-4` (16px) - Aligns precisely with the content below.

## Z-Index Stacking Order

```
z-50  ─── Global Header
z-40  ─── Global Sidebar + Page Header
z-30  ─── Global Footer
z-10  ─── Secondary Top Head Bar (Sticky)
z-0   ─── Main Content Base
```
