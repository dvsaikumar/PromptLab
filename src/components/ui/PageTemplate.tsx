import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/ui/PageHeader';

interface PageTemplateProps {
    // Header props
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    iconGradient: string;
    shadowColor?: string;
    rightContent?: React.ReactNode;

    // Layout props
    isSidebarOpen?: boolean;
    children: React.ReactNode;
    className?: string;
}

/**
 * PageTemplate - Reusable page layout component
 * 
 * Provides consistent layout structure:
 * - Fixed PageHeader (below global header at top-16)
 * - Scrollable content area with proper padding
 * - Accounts for global sidebar state
 * 
 * Usage:
 * <PageTemplate
 *     title="Page Title"
 *     subtitle="Page description"
 *     icon={IconComponent}
 *     iconGradient="from-blue-500 to-indigo-600"
 *     isSidebarOpen={isSidebarOpen}
 * >
 *     {content}
 * </PageTemplate>
 */
export const PageTemplate: React.FC<PageTemplateProps> = ({
    title,
    subtitle,
    icon,
    iconGradient,
    shadowColor = "shadow-slate-500/20",
    rightContent,
    isSidebarOpen = false,
    children,
    className
}) => {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Fixed Page Header */}
            <PageHeader
                title={title}
                subtitle={subtitle}
                icon={icon}
                iconGradient={iconGradient}
                shadowColor={shadowColor}
                rightContent={rightContent}
                isSidebarOpen={isSidebarOpen}
            />

            {/* Scrollable Content Area */}
            {/* top-[144px] = Global Header (64px) + PageHeader (80px) */}
            {/* bottom-16 = Footer (64px) */}
            <main
                className={clsx(
                    "fixed top-[144px] bottom-16 right-0 overflow-y-auto custom-scrollbar transition-all duration-300",
                    "pl-10 pr-10 py-6",
                    isSidebarOpen ? "lg:left-64" : "lg:left-16",
                    "left-0",
                    className
                )}
            >
                {children}
            </main>
        </div>
    );
};
