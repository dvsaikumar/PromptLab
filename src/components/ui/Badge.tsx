import React from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outline' | 'secondary' | 'indigo' | 'purple' | 'pink' | 'blue' | 'orange';
    onRemove?: () => void;
}

export const Badge = ({ className, variant = 'default', children, onRemove, ...props }: BadgeProps) => {
    const variants = {
        default: "bg-slate-900 text-white hover:bg-slate-800 border-transparent",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent",
        outline: "text-slate-950 border-slate-200 hover:bg-slate-100",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100",
        purple: "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100",
        pink: "bg-pink-50 text-pink-700 border-pink-100 hover:bg-pink-100",
        blue: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100",
        orange: "bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100"
    };

    return (
        <div className={clsx(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
            variants[variant],
            className
        )} {...props}>
            {children}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="ml-1 rounded-full p-0.5 hover:bg-black/10 transition-colors"
                >
                    <X size={12} />
                    <span className="sr-only">Remove</span>
                </button>
            )}
        </div>
    );
};
