import React, { useState } from 'react';
import { usePrompt } from '@/contexts/PromptContext';
import { INDUSTRY_TEMPLATES, ROLE_PRESETS } from '@/constants';
import { Template } from '@/types';
import { User, Check, X, Building2 } from 'lucide-react';
import { clsx } from 'clsx';
import * as Icons from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';

interface TemplateSelectorProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ isOpen, onClose }) => {
    const {
        selectIndustry, selectRole,
        activeIndustry, activeRole,
        clearIndustry, clearRole
    } = usePrompt();

    const [activeTab, setActiveTab] = useState<'industry' | 'role'>('industry');

    // Categorization Logic
    // Categorization Logic
    const getIndustryCategory = (id: string) => {
        if (['legal', 'finance', 'hr'].includes(id)) return 'Corporate & Legal';
        if (['healthcare'].includes(id)) return 'Service & Public';
        if (['education', 'instructional-design'].includes(id)) return 'Education & Learning';
        if (['marketing', 'ecommerce', 'supply-chain'].includes(id)) return 'Business & Operations';
        if (['cybersecurity', 'research', 'biotech', 'game-design'].includes(id)) return 'Tech & Innovation';
        return 'Other';
    };

    const getRoleCategory = (id: string) => {
        if (['developer', 'data-scientist', 'analyst', 'solution-architect', 'ethical-hacker'].includes(id)) return 'Engineering & Data';
        if (['writer', 'designer'].includes(id)) return 'Creative & Design';
        if (['product-manager', 'startup', 'crisis-manager'].includes(id)) return 'Strategy & Management';
        if (['course-creator', 'learning-architect'].includes(id)) return 'Education & Learning';
        return 'Other';
    };

    const categorizedIndustries = INDUSTRY_TEMPLATES.reduce((acc, t) => {
        const cat = getIndustryCategory(t.id);
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(t);
        return acc;
    }, {} as Record<string, Template[]>);

    const categorizedRoles = ROLE_PRESETS.reduce((acc, t) => {
        const cat = getRoleCategory(t.id);
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(t);
        return acc;
    }, {} as Record<string, Template[]>);

    const handleApply = (t: Template, type: 'industry' | 'role') => {
        if (type === 'industry') {
            if (activeIndustry === t.id) clearIndustry();
            else selectIndustry(t);
        } else {
            if (activeRole === t.id) clearRole();
            else selectRole(t);
        }
    };

    const renderTemplateCard = (t: Template, type: 'industry' | 'role') => {
        const IconComponent = (Icons as any)[t.icon] || Icons.FileText;
        const isActive = type === 'industry' ? activeIndustry === t.id : activeRole === t.id;

        return (
            <button
                key={t.id}
                onClick={() => handleApply(t, type)}
                className={clsx(
                    "flex flex-col items-start p-4 border rounded-xl transition-all text-left group h-full relative",
                    isActive
                        ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500 shadow-md"
                        : "bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md hover:bg-slate-50"
                )}
            >
                {isActive && (
                    <div className="absolute top-2 right-2 text-indigo-600 bg-white rounded-full p-0.5 shadow-sm">
                        <Check size={14} strokeWidth={3} />
                    </div>
                )}
                <div className="flex items-center gap-2 mb-3 w-full pr-5">
                    <div className={clsx(
                        "p-2 rounded-lg transition-colors",
                        isActive ? "bg-indigo-200 text-indigo-700" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                    )}>
                        <IconComponent size={20} />
                    </div>
                    <span className={clsx("font-bold text-md", isActive ? "text-indigo-900" : "text-slate-900")}>{t.label}</span>
                </div>
                <p className={clsx("text-xs leading-relaxed mb-3 line-clamp-3", isActive ? "text-indigo-700/80" : "text-slate-900")}>{t.description}</p>
                <div className="mt-auto flex gap-1 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-900 rounded border border-slate-200 uppercase font-bold tracking-wider">
                        {t.frameworkId.toUpperCase()}
                    </span>
                </div>
            </button>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="relative w-1/2 h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Templates & Roles</h2>
                        <p className="text-slate-500 text-sm">Choose a starting point for your prompt</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-700">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('industry')}
                        className={clsx(
                            "flex-1 py-4 flex items-center justify-center gap-2 font-bold text-lg transition-all border-b-2",
                            activeTab === 'industry'
                                ? "border-indigo-600 text-indigo-600 bg-indigo-50/30"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        )}
                    >
                        <Building2 size={18} />
                        Industries
                    </button>
                    <button
                        onClick={() => setActiveTab('role')}
                        className={clsx(
                            "flex-1 py-4 flex items-center justify-center gap-2 font-bold text-lg transition-all border-b-2",
                            activeTab === 'role'
                                ? "border-fuchsia-600 text-fuchsia-600 bg-fuchsia-50/30"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        )}
                    >
                        <User size={18} />
                        Roles
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {activeTab === 'industry' ? (
                        <div className="space-y-8">
                            {Object.entries(categorizedIndustries).map(([category, templates]) => (
                                <div key={category}>
                                    <SectionHeader
                                        title={category}
                                        className="text-indigo-800 bg-indigo-100 px-3 py-2 rounded-lg inline-block w-auto mb-4"
                                    />
                                    <div className="grid grid-cols-3 gap-4">
                                        {templates.map(t => renderTemplateCard(t, 'industry'))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(categorizedRoles).map(([category, templates]) => (
                                <div key={category}>
                                    <SectionHeader
                                        title={category}
                                        className="text-fuchsia-800 bg-fuchsia-100 px-3 py-2 rounded-lg inline-block w-auto mb-4"
                                    />
                                    <div className="grid grid-cols-3 gap-4">
                                        {templates.map(t => renderTemplateCard(t, 'role'))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">
                        {(activeIndustry || activeRole) ? 'Selection active' : 'No templates selected'}
                    </span>
                    <Button
                        onClick={onClose}
                        className="bg-slate-900 hover:bg-slate-800 text-white hover:from-slate-900 hover:to-slate-800 shadow-slate-900/10"
                    >
                        Done
                    </Button>
                </div>
            </div>
        </div>
    );
};
