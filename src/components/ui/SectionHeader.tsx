import React from 'react';
import { clsx } from 'clsx';

interface SectionHeaderProps {
    title: string;
    className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, className }) => {
    return (
        <h4 className={clsx("text-xs font-bold text-slate-600 uppercase tracking-wider mb-3", className)}>
            {title}
        </h4>
    );
};
