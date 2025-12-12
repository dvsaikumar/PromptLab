import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export const AnalysisLoader = () => {
    const [step, setStep] = useState(0);
    const steps = [
        "Initializing Reverse Prompt Protocols...",
        "Deconstructing DNA...",
        "Running Forensic Audit...",
        "Applying Anti-Hallucination Filters...",
        "Synthesizing Master Prompt..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % steps.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="relative">
                <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full animate-pulse"></div>
                <RotateCcw className="w-16 h-16 text-orange-500 animate-spin relative z-10 duration-3000" />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 animate-pulse">
                    {steps[step]}
                </h3>
                <p className="text-slate-500 text-sm font-mono">Running Deep Analysis...</p>
            </div>
            <div className="w-64 h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 animate-[progress_2s_ease-in-out_infinite] origin-left"></div>
            </div>
        </div>
    );
};
