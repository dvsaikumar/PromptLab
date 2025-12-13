import React, { useState, isValidElement } from 'react';

interface TooltipProps {
    content: React.ReactNode | string | string[] | { label: string; value: string | number; bold?: boolean; separator?: boolean }[];
    children: React.ReactNode;
    title?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, title, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={`absolute z-50 px-3 py-2 text-xs font-bold text-slate-800 bg-white rounded-lg shadow-xl border border-slate-100 opacity-100 min-w-max animate-in fade-in zoom-in-95 duration-75
                    ${isValidElement(content) || Array.isArray(content) ? '' : 'whitespace-nowrap'}
                    ${position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : ''}
                    ${position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' : ''}
                    ${position === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' : ''}
                    ${position === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2' : ''}
                `}>
                    {title && (
                        <div className="mb-2 pb-1 border-b border-slate-100 text-xs text-slate-600 font-extrabold uppercase tracking-wider text-center">
                            {title}
                        </div>
                    )}
                    {isValidElement(content) ? (
                        content
                    ) : Array.isArray(content) ? (
                        <div className="flex flex-col gap-1.5 text-left min-w-[160px]">
                            {content.map((item, i) => {
                                if (typeof item === 'object' && item !== null && !React.isValidElement(item)) {
                                    const isBold = (item as any).bold;
                                    const isSeparator = (item as any).separator;
                                    return (
                                        <div key={i} className={`flex items-center justify-between gap-6 text-[11px] ${isSeparator ? 'border-t border-slate-200 pt-1.5 mt-1' : ''}`}>
                                            <span className={`${isBold ? 'text-slate-700 font-extrabold uppercase tracking-wide text-[10px]' : 'text-slate-500 font-medium'}`}>{item.label}</span>
                                            <span className={`${isBold ? 'text-slate-900 text-xs' : 'text-slate-700'} font-bold tabular-nums`}>{item.value}</span>
                                        </div>
                                    )
                                }
                                return (
                                    <div key={i} className="flex gap-2 capitalize">
                                        <span className="text-slate-400 font-normal min-w-[12px]">{i + 1}.</span>
                                        {/* @ts-ignore */}
                                        <span>{typeof item === 'string' ? item.replace(/_/g, ' ') : item}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <span className="capitalize">{content as string}</span>
                    )}

                    {/* Arrow */}
                    <div className={`absolute w-2 h-2 bg-white transform rotate-45
                        ${position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r border-slate-100' : ''}
                        ${position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-t border-l border-slate-100' : ''}
                        ${position === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r border-slate-100' : ''}
                        ${position === 'right' ? 'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l border-slate-100' : ''}
                    `}></div>
                </div>
            )}
        </div>
    );
};
