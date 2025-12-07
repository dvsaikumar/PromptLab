import React from 'react';
import { clsx } from 'clsx';

interface DashboardLayoutProps {
    header: React.ReactNode;
    sidebar: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const DashboardLayout = ({ header, sidebar, children, className }: DashboardLayoutProps) => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Top Fixed Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 px-6 flex items-center">
                {header}
            </header>

            <div className="flex flex-1 pt-16 h-screen overflow-hidden">
                {/* Left Fixed Sidebar */}
                <aside className="w-80 flex-none hidden lg:block border-r border-slate-200 bg-white h-full overflow-y-auto">
                    {sidebar}
                </aside>

                {/* Main Content Area */}
                <main className={clsx("flex-1 h-full overflow-hidden relative", className)}>
                    {children}
                </main>
            </div>
        </div>
    );
};
