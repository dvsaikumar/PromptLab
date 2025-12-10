import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean;
    glass?: boolean;
    hoverLift?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, children, noPadding = false, glass = false, hoverLift = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={clsx(
                    "rounded-2xl border border-slate-200 shadow-sm transition-all",
                    hoverLift ? "hover-lift" : "hover:shadow-md",
                    glass
                        ? "bg-white/80 backdrop-blur-md"
                        : "bg-white",
                    !noPadding && "p-6",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={clsx("flex flex-col space-y-1.5 p-6 pb-2", className)} {...props}>
        {children}
    </div>
);

export const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={clsx("font-bold text-xl leading-none tracking-tight text-slate-900", className)} {...props}>
        {children}
    </h3>
);

export const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={clsx("p-6 pt-0", className)} {...props}>
        {children}
    </div>
);
