import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Brain, ChevronDown, Check } from 'lucide-react';

interface AnalysisMode {
    id: string;
    label: string;
    icon: string;
    description: string;
    tooltip?: string;
    category?: string;
}

interface AnalysisFocusSelectorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    modes: AnalysisMode[];
}

export const AnalysisFocusSelector: React.FC<AnalysisFocusSelectorProps> = ({ value, onChange, className, modes }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [tooltipConfig, setTooltipConfig] = useState<{ y: number, text: string } | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const [animationClass, setAnimationClass] = useState('');

    const activeMode = modes.find(m => m.id === value) || modes[0];

    const handleToggle = () => {
        if (!showDropdown && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;
            const MENU_MAX_HEIGHT = 450;

            let newStyle: React.CSSProperties = {
                position: 'fixed',
                left: rect.left,
                width: rect.width,
                zIndex: 101, // Above backdrop
            };
            let anim = 'slide-in-from-top-2';

            if (spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow) {
                newStyle.bottom = viewportHeight - rect.top + 8;
                newStyle.maxHeight = Math.min(MENU_MAX_HEIGHT, spaceAbove - 24);
                newStyle.top = 'auto';
                anim = 'slide-in-from-bottom-2';
            } else {
                newStyle.top = rect.bottom + 8;
                newStyle.maxHeight = Math.min(MENU_MAX_HEIGHT, spaceBelow - 24);
                newStyle.bottom = 'auto';
                anim = 'slide-in-from-top-2';
            }

            setDropdownStyle(newStyle);
            setAnimationClass(anim);
        }
        setShowDropdown(!showDropdown);
        setTooltipConfig(null);
    };

    const handleSelect = (id: string) => {
        onChange(id);
        setShowDropdown(false);
        setTooltipConfig(null);
    };

    return (
        <div className={`relative ${className}`}>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                <Brain size={14} />
                Analysis Focus
            </label>
            <div
                ref={triggerRef}
                onClick={handleToggle}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer group shadow-sm"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0 text-lg">
                        {activeMode.icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                            {activeMode.label}
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                            {activeMode.description}
                        </span>
                    </div>
                </div>

                <ChevronDown size={18} className={`text-slate-400 group-hover:text-indigo-500 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Menu Portal */}
            {showDropdown && createPortal(
                <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setShowDropdown(false)} />
                    <div
                        className={`bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-200 flex flex-col ${animationClass}`}
                        style={dropdownStyle}
                    >
                        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                            {modes.map((mode, index) => {
                                const isActive = mode.id === value;
                                const showHeader = mode.category && mode.category !== modes[index - 1]?.category;

                                return (
                                    <React.Fragment key={mode.id}>
                                        {showHeader && (
                                            <div className="px-3 py-1.5 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                                {mode.category}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleSelect(mode.id)}
                                            onMouseEnter={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setTooltipConfig({ y: rect.top, text: mode.tooltip || mode.description });
                                            }}
                                            onMouseLeave={() => setTooltipConfig(null)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-50 text-left group/item relative`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-lg ${isActive ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                                                {mode.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm font-medium ${isActive ? 'text-emerald-900' : 'text-slate-800'}`}>
                                                    {mode.label}
                                                </div>
                                                <div className="text-xs text-slate-500 truncate">
                                                    {mode.description}
                                                </div>
                                            </div>
                                            {isActive && <Check size={16} className="text-emerald-600" />}
                                        </button>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Tooltip Portal */}
                    {tooltipConfig && (
                        <div
                            className="fixed z-[105] bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl border border-slate-700 max-w-[300px] animate-in fade-in slide-in-from-left-2 duration-150 pointer-events-none"
                            style={{
                                top: tooltipConfig.y,
                                left: (dropdownStyle.left as number) + (dropdownStyle.width as number) + 12,
                                transform: 'translateY(0)'
                            }}
                        >
                            <div className="font-semibold mb-0.5">Focus Mode</div>
                            {tooltipConfig.text}
                            {/* Little arrow pointing left */}
                            <div className="absolute top-3 -left-1 w-2 h-2 bg-slate-800 border-l border-b border-slate-700 transform rotate-45"></div>
                        </div>
                    )}
                </>,
                document.body
            )}
        </div>
    );
};
