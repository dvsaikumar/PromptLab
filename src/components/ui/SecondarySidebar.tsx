import React from 'react';
import { clsx } from 'clsx';

interface SecondarySidebarProps {
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    isSidebarOpen?: boolean;
}

export const SecondarySidebar: React.FC<SecondarySidebarProps> = ({
    title,
    children,
    footer,
    className,
    isSidebarOpen = false
}) => {
    // Global header: 64px (h-16), PageHeader: 80px (h-20), Footer: 64px (h-16)
    // top-[144px] = 64 + 80 = 144px from top
    // bottom-14 = 56px from bottom (footer height)
    return (
        <aside className={clsx(
            "fixed top-[144px] bottom-14 w-72 bg-white border-r border-slate-200 flex flex-col z-30 overflow-hidden transition-all duration-300",
            isSidebarOpen ? "lg:left-64" : "lg:left-16",
            "left-0",
            className
        )}>
            {/* Title - matches ContentPanelHeader height (88px) */}
            <div className="h-[88px] px-6 border-b border-slate-100 flex-shrink-0 flex items-center">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                </div>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 custom-scrollbar">
                {children}
            </div>

            {/* Footer (fixed at bottom of sidebar) */}
            {footer && (
                <div className="p-6 pt-4 border-t border-slate-200 bg-white flex-shrink-0">
                    {footer}
                </div>
            )}
        </aside>
    );
};
