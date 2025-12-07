import React from 'react';
import { BookOpen } from 'lucide-react';
import { usePrompt } from '@/contexts/PromptContext';
import { FRAMEWORKS } from '@/constants';
import { ContentPanelHeader } from '@/components/ui/ContentPanelHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SelectionCard } from '@/components/ui/SelectionCard';

type FrameworkSelectorProps = {
    isOpen: boolean;
    onToggle: () => void;
    isSidebarOpen?: boolean;
};

export const FrameworkSelector: React.FC<FrameworkSelectorProps> = ({ isSidebarOpen = false }) => {
    const { activeFramework, setFramework } = usePrompt();

    return (
        <>
            {/* Fixed Content Panel Header */}
            <ContentPanelHeader
                title="Select Framework"
                subtitle="Choose a prompt engineering framework"
                icon={BookOpen}
                iconGradient="from-blue-500 via-indigo-500 to-violet-500"
                shadowColor="shadow-indigo-500/20"
                isSidebarOpen={isSidebarOpen}
            />

            {/* Content - Fixed position below ContentPanelHeader */}
            <div
                className="fixed top-[232px] bottom-14 right-0 overflow-y-auto pl-10 pr-10 pb-6 pt-4 space-y-6 custom-scrollbar bg-slate-50/50 animate-in fade-in slide-in-from-right-4 duration-300 lg:left-[352px] left-72"
                style={{ left: isSidebarOpen ? '544px' : undefined }}
            >
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
                        <div key={category}>
                            <SectionHeader
                                title={category}
                                className="text-blue-800 bg-blue-100/50 px-3 py-1 rounded-lg inline-block w-auto mb-4"
                            />
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {categoryFrameworks.map((f) => (
                                    <SelectionCard
                                        key={f.id}
                                        title={f.name}
                                        description={f.description}
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
        </>
    );
};
