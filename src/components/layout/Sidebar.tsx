import React from 'react';
import { Home, FlaskConical, Palette, Settings as SettingsIcon, ChevronLeft, ChevronRight, FolderOpen, RotateCcw, Zap, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activeSection: string | null;
    onNavigate: (section: string) => void;
    onOpenSettings: () => void;
    onToggle?: () => void;
}


const menuItems = [ // ... existing items ...
    { id: 'my-hub', label: 'My Hub', icon: Home },
    { id: 'prompt-lab', label: 'Prompt Lab', icon: FlaskConical },
    { id: 'prompt-lab-2', label: 'Prompt Lab 2.0', icon: Sparkles },
    { id: 'reverse-prompt', label: 'Reverse Prompt', icon: RotateCcw },
    { id: 'chain-reaction', label: 'Chain Reaction', icon: Zap },
    { id: 'saved-prompts', label: 'Saved Prompts', icon: FolderOpen },
    { id: 'tone-shifter', label: 'Tone Shifter', icon: Palette },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

import { usePrompt } from '@/contexts/PromptContext';

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeSection, onNavigate, onOpenSettings, onToggle }) => {
    const { resetAll } = usePrompt();

    // Icon container size for consistent alignment
    const iconContainerClass = "w-10 h-10 flex items-center justify-center flex-shrink-0";
    const iconSize = 22;

    const handleItemClick = (itemId: string) => {
        if (itemId === 'settings') {
            onOpenSettings();
        } else {
            if (itemId === 'prompt-lab') {
                resetAll();
                window.dispatchEvent(new Event('reset-prompt-lab'));
            }
            onNavigate(itemId);
        }
        if (window.innerWidth < 1024) onClose();
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed top-16 left-0 bottom-0 bg-white border-r border-slate-200 z-50 transition-all duration-300 overflow-hidden flex flex-col",
                isOpen ? "w-64 translate-x-0" : "w-16 -translate-x-full lg:translate-x-0"
            )}>
                {/* Navigation - includes Settings */}
                <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeSection === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleItemClick(item.id)}
                                className={clsx(
                                    "w-full flex items-center gap-3 py-2 rounded-lg transition-all group",
                                    isOpen ? "px-3" : "justify-center",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-600"
                                        : "text-slate-700 hover:bg-slate-100"
                                )}
                                title={!isOpen ? item.label : undefined}
                            >
                                <div className={clsx(
                                    iconContainerClass,
                                    isActive && "bg-indigo-100 rounded-lg"
                                )}>
                                    <Icon size={iconSize} />
                                </div>
                                {isOpen && (
                                    <span className="font-bold whitespace-nowrap overflow-hidden">
                                        {item.label}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Collapse/Expand Button at Bottom */}
                <div className="p-2 h-16 border-t border-slate-200 bg-white">
                    <button
                        onClick={onToggle}
                        className={clsx(
                            "w-full flex items-center gap-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all",
                            isOpen ? "px-3" : "justify-center"
                        )}
                        title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                        <div className={iconContainerClass}>
                            {isOpen ? <ChevronLeft size={iconSize} /> : <ChevronRight size={iconSize} />}
                        </div>
                        {isOpen && (
                            <span className="font-medium text-sm">Collapse</span>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
};
