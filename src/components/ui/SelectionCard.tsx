import React, { ReactNode } from 'react';
import { clsx } from 'clsx';

interface SelectionCardProps {
    onClick: () => void;
    currentId?: string;
    isSelected: boolean;
    title: string;
    description: string;
    icon?: ReactNode;
    activeColor?: 'indigo' | 'green' | 'orange' | 'red' | 'blue' | 'purple' | 'pink'; // Add more as needed
    className?: string;
    showActiveIndicator?: boolean;
    metadata?: string;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
    onClick,
    isSelected,
    title,
    description,
    icon,
    activeColor = 'blue',
    className,
    showActiveIndicator = false,
    metadata
}) => {
    // Map colors to styling. extending typical Tailwind patterns used in project
    const colorStyles = {
        blue: {
            active: 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20 text-blue-900',
            hover: 'hover:border-blue-300',
            text: 'text-blue-900',
            desc: 'text-blue-700',
            indicator: 'bg-blue-500'
        },
        green: {
            active: 'bg-green-50 border-green-500 shadow-sm text-green-900',
            hover: 'hover:border-green-300 hover:bg-slate-50',
            text: 'text-green-900',
            desc: 'text-green-700',
            indicator: 'bg-green-500'
        },
        orange: {
            active: 'bg-orange-50 border-orange-500 shadow-sm text-orange-900',
            hover: 'hover:border-orange-300 hover:bg-slate-50',
            text: 'text-orange-900',
            desc: 'text-orange-700',
            indicator: 'bg-orange-500'
        },
        red: {
            active: 'bg-red-50 border-red-500 shadow-sm text-red-900',
            hover: 'hover:border-red-300 hover:bg-slate-50',
            text: 'text-red-900',
            desc: 'text-red-700',
            indicator: 'bg-red-500'
        },
        indigo: {
            active: 'bg-indigo-50 border-indigo-500 shadow-sm text-indigo-900',
            hover: 'hover:border-indigo-300 hover:bg-slate-50',
            text: 'text-indigo-900',
            desc: 'text-indigo-700',
            indicator: 'bg-indigo-500'
        },
        purple: {
            active: 'bg-purple-50 border-purple-500 shadow-sm text-purple-900',
            hover: 'hover:border-purple-300 hover:bg-slate-50',
            text: 'text-purple-900',
            desc: 'text-purple-700',
            indicator: 'bg-purple-500'
        },
        pink: {
            active: 'bg-pink-50 border-pink-500 shadow-sm text-pink-900',
            hover: 'hover:border-pink-300 hover:bg-slate-50',
            text: 'text-pink-900',
            desc: 'text-pink-700',
            indicator: 'bg-pink-500'
        }
    };

    const styles = colorStyles[activeColor];

    return (
        <button
            onClick={onClick}
            className={clsx(
                "p-3 rounded-xl border text-left transition-all relative overflow-hidden group h-full",
                isSelected
                    ? styles.active
                    : `bg-white border-slate-200 text-slate-700 ${styles.hover}`,
                className
            )}
        >
            <div className="flex items-start gap-3 h-full">
                {icon && (
                    <div className={clsx("mt-0.5", isSelected ? styles.text : "text-slate-400 group-hover:text-slate-600")}>
                        {icon}
                    </div>
                )}
                <div className="flex-1">
                    <div className={clsx("text-md font-bold mb-0.5", isSelected ? styles.text : "text-slate-700")}>
                        {title}
                    </div>
                    <div className={clsx("text-xs leading-tight", isSelected ? styles.desc : "text-slate-500")}>
                        {description}
                    </div>
                    {metadata && (
                        <div className={clsx("mt-2 text-[10px] font-bold uppercase tracking-wider opacity-90", isSelected ? styles.desc : "text-slate-400")}>
                            <span className="opacity-75 block text-[9px]">Best for</span>
                            <span className={clsx(isSelected ? "" : "text-slate-600")}>{metadata}</span>
                        </div>
                    )}
                </div>
            </div>
            {isSelected && showActiveIndicator && (
                <div className={clsx("absolute top-2 right-2 w-3 h-3 rounded-full", styles.indicator)} />
            )}
        </button>
    );
};
