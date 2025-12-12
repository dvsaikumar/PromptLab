import React, { useState, useRef } from 'react';
import { UserCircle2, ChevronDown, Check, Search } from 'lucide-react';
import { createPortal } from 'react-dom';
import { PERSONAS } from '@/constants/personas';

interface PersonaSelectorProps {
    activePersonaId: string;
    setActivePersonaId: (id: string) => void;
    className?: string;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({ activePersonaId, setActivePersonaId, className }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const [animationClass, setAnimationClass] = useState('');
    const triggerRef = useRef<HTMLDivElement>(null);

    const activePersona = PERSONAS.find(p => p.id === activePersonaId) || PERSONAS[0];

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
                // Open Upwards
                newStyle.bottom = viewportHeight - rect.top + 8;
                newStyle.maxHeight = Math.min(MENU_MAX_HEIGHT, spaceAbove - 24);
                newStyle.top = 'auto';
                anim = 'slide-in-from-bottom-2';
            } else {
                // Open Downwards
                newStyle.top = rect.bottom + 8;
                newStyle.maxHeight = Math.min(MENU_MAX_HEIGHT, spaceBelow - 24);
                newStyle.bottom = 'auto';
                anim = 'slide-in-from-top-2';
            }

            setDropdownStyle(newStyle);
            setAnimationClass(anim);
        }
        setShowDropdown(!showDropdown);
    };

    const handleSelectPersona = (id: string) => {
        setActivePersonaId(id);
        setShowDropdown(false);
    };

    return (
        <div className={`relative ${className}`}>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                <UserCircle2 size={14} />
                Expert Persona
            </label>
            <div
                ref={triggerRef}
                onClick={handleToggle}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer group shadow-sm"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0 text-indigo-600">
                        <UserCircle2 size={20} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                            {activePersona.name}
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                            {activePersona.role}
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
                        <div className="flex-shrink-0 px-3 py-2 border-b border-slate-100 bg-slate-50">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search personas..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                            {PERSONAS
                                .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.role.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((persona) => {
                                    const isActive = persona.id === activePersonaId;
                                    return (
                                        <button
                                            key={persona.id}
                                            onClick={() => handleSelectPersona(persona.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-50 text-left`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                                <UserCircle2 size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm font-medium ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                    {persona.name}
                                                </div>
                                                <div className="text-xs text-slate-500 truncate">
                                                    {persona.role}
                                                </div>
                                            </div>
                                            {isActive && <Check size={16} className="text-indigo-600" />}
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};
