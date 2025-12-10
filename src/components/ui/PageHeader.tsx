import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface PageHeaderProps {
    title: string | React.ReactNode;
    subtitle?: string;
    icon: LucideIcon;
    iconGradient: string;  // e.g., "from-indigo-500 to-purple-600"
    shadowColor?: string;  // e.g., "shadow-indigo-500/30"
    rightContent?: React.ReactNode;
    isSidebarOpen?: boolean;
    className?: string;
    iconSize?: number;
    titleClassName?: string;
    subtitleClassName?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    icon: Icon,
    iconGradient,
    shadowColor = "shadow-slate-500/20",
    rightContent,
    isSidebarOpen = false,
    className,
    iconSize = 28,
    titleClassName,
    subtitleClassName
}) => {
    return (
        <div className={clsx(
            "fixed top-16 right-0 z-40 h-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-8 flex items-center transition-all duration-300",
            isSidebarOpen ? "lg:left-64" : "lg:left-16",
            "left-0",
            className
        )}>
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                    {Icon && (
                        <div className={clsx(
                            "p-2.5 rounded-xl shadow-sm",
                            iconGradient ? `bg-gradient-to-br ${iconGradient} text-white` : "bg-white border border-slate-200 text-slate-700",
                            shadowColor
                        )}>
                            <Icon size={iconSize} />
                        </div>
                    )}
                    {!Icon && (
                        <div className="p-2.5 rounded-xl bg-slate-100/50">
                            <div className="w-7 h-7" />
                        </div>
                    )}
                    <div>
                        {typeof title === 'string' ? (
                            <h1 className={clsx("font-bold text-slate-900 tracking-tight", titleClassName || "text-2xl")}>{title}</h1>
                        ) : (
                            title
                        )}
                        {subtitle && (
                            <p className={clsx("text-slate-600 mt-0.5", subtitleClassName)}>{subtitle}</p>
                        )}
                    </div>
                </div>
                {rightContent && (
                    <div className="flex items-center gap-3">
                        {rightContent}
                    </div>
                )}
            </div>
        </div>
    );
};
