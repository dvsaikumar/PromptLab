import React from 'react';
import { clsx } from 'clsx';

interface VerticalDividerProps {
    className?: string;
    height?: string;
}

export const VerticalDivider: React.FC<VerticalDividerProps> = ({ className, height = "h-4" }) => {
    return (
        <div className={clsx("w-px bg-slate-200", height, className)} />
    );
};
