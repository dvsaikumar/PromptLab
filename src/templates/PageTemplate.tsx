import React from 'react';
import { Sparkles } from 'lucide-react'; // Replace with your icon

export const PageTemplate: React.FC = () => {
    return (
        <div className="h-full flex flex-col">
            {/* Fixed Header - Standard Design */}
            <div className="sticky top-16 z-40 bg-slate-50/95 backdrop-blur-sm -mx-4 px-6 pt-0 pb-2 mb-6 border-b border-transparent transition-all">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Icon - Change gradient colors and icon */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            {/* Page Title - text-3xl, no subtitle */}
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Page Title</h1>
                        </div>
                    </div>
                    {/* Optional: Right side content (buttons, search, etc.) */}
                    <div>
                        {/* Add right-side elements here if needed */}
                    </div>
                </div>
                {/* Gradient divider line */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent mt-6" />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-4">
                {/* Add your page content here */}
                <div className="space-y-6">
                    {/* Example content card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Section Title</h2>
                        <p className="text-slate-600">Your content goes here...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
