import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface ContentPanelHeaderProps {
    title: string;
    subtitle?: string;
    icon: LucideIcon;
    iconGradient: string;
    shadowColor?: string;
    rightContent?: React.ReactNode;
    isSidebarOpen?: boolean;
}

export const ContentPanelHeader: React.FC<ContentPanelHeaderProps> = ({
    title,
    subtitle,
    icon: Icon,
    iconGradient,
    shadowColor = "shadow-slate-500/20",
    rightContent,
    isSidebarOpen = false
}) => {
    // Fixed position: below PageHeader (144px), to the right of SecondarySidebar (288px + global sidebar)
    return (
        <div className={clsx(
            "fixed top-[144px] right-0 z-35 h-[88px] bg-white/95 backdrop-blur-md border-b border-slate-200 pl-9 pr-6 flex items-center transition-all duration-300",
            // Left offset: global sidebar (16=64px or 64=256px) + secondary sidebar (288px)
            isSidebarOpen ? "lg:left-[544px]" : "lg:left-[352px]",
            "left-72" // mobile: just secondary sidebar
        )}>
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${iconGradient} flex items-center justify-center text-white shadow-lg ${shadowColor}`}>
                        <Icon size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}

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
