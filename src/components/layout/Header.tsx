import React from 'react';

interface HeaderProps {
    onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ }) => {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 shadow-sm">
            <div className="h-full flex items-center justify-between">
                {/* Left: Logo always visible with text */}
                <div className="h-full flex items-center gap-3 pl-4">
                    {/* D Studio Logo 
                        <img
                            src="/d-logo.png"
                            alt="D Studio Logo"
                            className="h-10 w-10 object-contain"
                        />*/}
                    <h1 className="text-2xl font-bold text-slate-900 whitespace-nowrap">
                        D Studios Lab
                    </h1>
                </div>

                {/* Right: Empty for now (or could have other global actions later) */}
                <div className="pr-6">
                </div>
            </div>
        </header>
    );
};
