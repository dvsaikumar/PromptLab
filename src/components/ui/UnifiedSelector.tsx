import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface SelectorOption {
    value: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
}

interface UnifiedSelectorProps {
    label: string;
    icon: React.ReactNode;
    value: string;
    onChange: (value: string) => void;
    options: SelectorOption[];
    placeholder?: string;
    searchable?: boolean;
    className?: string;
}

export const UnifiedSelector: React.FC<UnifiedSelectorProps> = ({
    label,
    icon,
    value,
    onChange,
    options,
    placeholder = "Select...",
    searchable = false,
    className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLDivElement>(null);

    const activeOption = options.find(o => o.value === value);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const MENU_HEIGHT = 300; // Estimated max height

            let style: React.CSSProperties = {
                position: 'fixed',
                left: rect.left,
                width: rect.width,
                zIndex: 9999, // Very high to sit on top of drawer
            };

            if (spaceBelow < MENU_HEIGHT) {
                // Open upwards
                style.bottom = viewportHeight - rect.top + 5;
                style.top = 'auto';
            } else {
                // Open downwards
                style.top = rect.bottom + 5;
                style.bottom = 'auto';
            }
            setDropdownStyle(style);
        }
        setIsOpen(true);
    };

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearchQuery('');
    };

    const filteredOptions = options.filter(opt => {
        if (!searchQuery) return true;
        return opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase()));
    });

    return (
        <div className={`relative ${className}`}>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                {icon && <span className="w-3.5 h-3.5">{icon}</span>}
                {label}
            </label>
            <div
                ref={triggerRef}
                onClick={handleToggle}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer group shadow-sm"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0 text-indigo-600">
                        {activeOption?.icon || icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className={`text-sm font-semibold truncate ${activeOption ? 'text-slate-900' : 'text-slate-400'}`}>
                            {activeOption ? activeOption.label : placeholder}
                        </span>
                        {activeOption?.description && (
                            <span className="text-xs text-slate-500 truncate">
                                {activeOption.description}
                            </span>
                        )}
                    </div>
                </div>
                <ChevronDown size={18} className={`text-slate-400 group-hover:text-indigo-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && createPortal(
                <>
                    <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
                    <div
                        className="fixed bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
                        style={{ ...dropdownStyle, maxHeight: '300px' }}
                    >
                        {searchable && (
                            <div className="p-2 border-b border-slate-100 bg-slate-50">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleSelect(opt.value)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${opt.value === value ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-700'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${opt.value === value ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {opt.icon || icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{opt.label}</div>
                                            {opt.description && <div className="text-xs text-slate-500 truncate">{opt.description}</div>}
                                        </div>
                                        {opt.value === value && <Check className="w-4 h-4 text-indigo-600" />}
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-slate-500">No results found</div>
                            )}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}
