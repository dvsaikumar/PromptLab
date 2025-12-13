import React from 'react';
import { usePrompt } from '@/contexts/PromptContext';
import { FRAMEWORKS } from '@/constants';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SelectionCard } from '@/components/ui/SelectionCard';



export interface FrameworkSelectorProps {
    isOpen: boolean;
    onToggle: () => void;
    isSidebarOpen?: boolean;
    hideHeader?: boolean;
    compact?: boolean;
}

export const FrameworkSelector: React.FC<FrameworkSelectorProps> = ({ hideHeader = false, compact = false }) => {
    const { activeFramework, setFramework } = usePrompt();

    return (
        <div className={`custom-scrollbar bg-slate-50/50 animate-in fade-in slide-in-from-right-4 duration-300 ${compact ? 'grid grid-cols-1 gap-3 p-2' : 'grid grid-cols-1 md:grid-cols-2 gap-6 px-6 pb-6 pt-4'}`}>
            {['Essentials (Simple & Direct)', 'Strategic (Business & Marketing)', 'Analytical (Complex & Detailed)', 'Refinement (Optimization)', 'Technical & Architecture', 'Other'].map(category => {
                const categoryFrameworks = FRAMEWORKS.filter(f => {
                    const id = f.id;
                    if (category === 'Essentials (Simple & Direct)') return ['tag', 'aps', 'rise', 'race'].includes(id);
                    if (category === 'Strategic (Business & Marketing)') return ['costar', 'scoped', 'care', 'create'].includes(id);
                    if (category === 'Analytical (Complex & Detailed)') return ['rtcros', 'roses', 'tracer', 'elicit'].includes(id);
                    if (category === 'Refinement (Optimization)') return ['pare', 'kernel'].includes(id);
                    if (category === 'Technical & Architecture') return ['c4', 'devops', 'ddd'].includes(id);
                    // Catch-all
                    return !['tag', 'aps', 'rise', 'race', 'costar', 'scoped', 'care', 'create', 'rtcros', 'roses', 'tracer', 'elicit', 'pare', 'kernel', 'c4', 'devops', 'ddd'].includes(id) && category === 'Other';
                });

                if (categoryFrameworks.length === 0) return null;

                return (
                    <div key={category} className="space-y-4 border border-slate-200 rounded-xl p-4 bg-white/50">
                        <SectionHeader
                            title={category}
                            className="text-blue-800 bg-blue-100/50 px-3 py-1 rounded-lg inline-block w-auto"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {categoryFrameworks.map((f) => (
                                <SelectionCard
                                    key={f.id}
                                    title={f.name}
                                    description={f.description}
                                    metadata={f.bestFor}
                                    isSelected={activeFramework === f.id}
                                    onClick={() => setFramework(f.id)}
                                    activeColor="blue"
                                    className="h-full"
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
