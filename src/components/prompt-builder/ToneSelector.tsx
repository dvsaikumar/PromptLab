import React from 'react';
import { Check } from 'lucide-react';
import { usePrompt } from '@/contexts/PromptContext';
import { TONES } from '@/constants';

type ToneSelectorProps = {
    isOpen: boolean;
    onToggle: () => void;
    isSidebarOpen?: boolean;
};

export const ToneSelector: React.FC<ToneSelectorProps> = () => {
    const { selectedTones, toggleTone } = usePrompt();

    return (
        <div className="px-3 pb-6 pt-4 custom-scrollbar bg-slate-50/50 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-6">
                {['Professional & Academic', 'Direct & Concise', 'Creative & Expressive', 'Analytical & Deep', 'Instructional & Social', 'Technical & Operational', 'Other'].map(category => {
                    const categoryTones = TONES.filter(t => {
                        const id = t.value;
                        if (category === 'Professional & Academic') return ['formal', 'academic', 'journalistic', 'diplomatic', 'authoritative'].includes(id);
                        if (category === 'Direct & Concise') return ['direct', 'concise', 'minimalist', 'pragmatic'].includes(id);
                        if (category === 'Creative & Expressive') return ['creative', 'storytelling', 'witty', 'enthusiastic', 'casual', 'provocative'].includes(id);
                        if (category === 'Analytical & Deep') return ['analytical', 'philosophical', 'nuanced', 'holistic', 'debate'].includes(id);
                        if (category === 'Instructional & Social') return ['instructional', 'coaching', 'empathetic', 'persuasive', 'socratic'].includes(id);
                        if (category === 'Technical & Operational') return ['technical', 'architectural', 'scalable', 'operational', 'security-first'].includes(id);
                        return false;
                    });

                    if (categoryTones.length === 0) return null;

                    return (
                        <div key={category} className="space-y-3 border border-slate-200 rounded-xl p-4 bg-white/50">
                            <h4 className="text-sm font-extrabold text-blue-800 uppercase tracking-wide py-2 px-3 bg-blue-100 rounded-lg inline-block shadow-sm">{category}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {categoryTones.map((tone) => {
                                    const isSelected = selectedTones.includes(tone.value);
                                    return (
                                        <button
                                            key={tone.value}
                                            onClick={() => toggleTone(tone.value)}
                                            className={`relative group p-4 rounded-xl border text-left transition-all duration-200 ${isSelected
                                                ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20 shadow-md transform scale-[1.02]'
                                                : 'border-slate-200 bg-white/50 hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`font-bold text-md ${isSelected ? 'text-purple-700' : 'text-slate-700'}`}>
                                                    {tone.label}
                                                </span>
                                                {isSelected && (
                                                    <div className="bg-purple-500 rounded-full p-0.5 shadow-sm">
                                                        <Check size={10} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-600">
                                                {tone.description}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
