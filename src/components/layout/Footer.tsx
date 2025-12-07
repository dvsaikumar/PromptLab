import React from 'react';
{/* import { Heart } from 'lucide-react';*/ }
import { clsx } from 'clsx';
import dLogo from '@/assets/d-logo.png';

interface FooterProps {
    isSidebarOpen: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isSidebarOpen }) => {
    return (
        <footer className={clsx(
            "fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-30 transition-all duration-300",
            isSidebarOpen ? "lg:left-64" : "lg:left-16"
        )}>
            <div className="h-full px-6 flex items-center justify-between">
                {/* Left: Jai Hanuman */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <h4 className="text-sm font-bold text-slate-900">
                        Jai Sri Ram
                    </h4>
                </div>

                {/* Center: Logo */}
                <div className="absolute left-1/2 transform -translate-x-1/2">
                    <img
                        src={dLogo}
                        alt="D Studio Logo"
                        className="h-10 w-auto object-contain"
                    />
                </div>

                {/* Right: Copyright */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    {/* <span>Made with</span>
                     <Heart size={14} className="text-red-500 fill-red-500" /> */}
                    <h4 className="text-sm font-bold text-slate-900">
                        Jai Hanuman
                    </h4>
                </div>
            </div>
        </footer>
    );
};
