import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, TrendingUp, FileText, Palette, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageTemplate } from '@/components/ui/PageTemplate';
import { promptDB } from '@/services/database';

interface MyHubProps {
    isSidebarOpen?: boolean;
}

interface DashboardStats {
    totalPrompts: number;
    savedPrompts: number;
    frameworksUsed: number;
    tonesApplied: number;
}

export const MyHub: React.FC<MyHubProps> = ({ isSidebarOpen = false }) => {
    const [stats, setStats] = useState<DashboardStats>({
        totalPrompts: 0,
        savedPrompts: 0,
        frameworksUsed: 0,
        tonesApplied: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const prompts = await promptDB.getAllPrompts();

                // Calculate stats
                const totalPrompts = prompts.length;
                const savedPrompts = prompts.length;

                // Get unique frameworks
                const frameworksSet = new Set(prompts.map(p => p.framework));
                const frameworksUsed = frameworksSet.size;

                // Count total tones applied across all prompts
                let tonesApplied = 0;
                prompts.forEach(p => {
                    try {
                        const tones = JSON.parse(p.tones);
                        tonesApplied += Array.isArray(tones) ? tones.length : 0;
                    } catch (e) {
                        // Skip invalid JSON
                    }
                });

                setStats({
                    totalPrompts,
                    savedPrompts,
                    frameworksUsed,
                    tonesApplied
                });
            } catch (error) {
                console.error('Failed to load stats:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    return (
        <PageTemplate
            title="Welcome to D Studios Lab"
            subtitle="Your AI-powered prompt engineering workspace"
            icon={Sparkles}
            iconGradient="from-blue-500 to-indigo-600"
            shadowColor="shadow-indigo-500/30"
            isSidebarOpen={isSidebarOpen}
        >
            {/* Quick Actions */}
            <section className="mb-10">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-amber-500" />
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-l-4 border-l-indigo-500">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                    <FileText size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">Prompt Lab</h3>
                                    <p className="text-slate-500 text-sm mt-1">Create structured prompts</p>
                                </div>
                            </div>
                            <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </Card>

                    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-l-4 border-l-pink-500">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg">
                                    <Palette size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">Tone Shifter</h3>
                                    <p className="text-slate-500 text-sm mt-1">Transform prompt styles</p>
                                </div>
                            </div>
                            <ArrowRight size={20} className="text-slate-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </Card>

                    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-l-4 border-l-emerald-500">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                                    <FileText size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900">Saved Prompts</h3>
                                    <p className="text-slate-500 text-sm mt-1">Access your library</p>
                                </div>
                            </div>
                            <ArrowRight size={20} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        </div>
                    </Card>
                </div>
            </section>

            {/* Stats Section */}
            <section className="mb-10">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-500" />
                    Your Stats
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="text-center py-6">
                        <div className="text-4xl font-bold text-indigo-600 mb-1">
                            {loading ? '...' : stats.totalPrompts}
                        </div>
                        <div className="text-sm text-slate-500 font-medium">Prompts Created</div>
                    </Card>
                    <Card className="text-center py-6">
                        <div className="text-4xl font-bold text-emerald-600 mb-1">
                            {loading ? '...' : stats.savedPrompts}
                        </div>
                        <div className="text-sm text-slate-500 font-medium">Saved Prompts</div>
                    </Card>
                    <Card className="text-center py-6">
                        <div className="text-4xl font-bold text-purple-600 mb-1">
                            {loading ? '...' : stats.frameworksUsed}
                        </div>
                        <div className="text-sm text-slate-500 font-medium">Frameworks Used</div>
                    </Card>
                    <Card className="text-center py-6">
                        <div className="text-4xl font-bold text-pink-600 mb-1">
                            {loading ? '...' : stats.tonesApplied}
                        </div>
                        <div className="text-sm text-slate-500 font-medium">Tones Applied</div>
                    </Card>
                </div>
            </section>

            {/* Getting Started */}
            <section>
                <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                {stats.totalPrompts === 0
                                    ? 'Ready to create your first prompt?'
                                    : `You've created ${stats.totalPrompts} prompt${stats.totalPrompts === 1 ? '' : 's'}! Keep going!`}
                            </h3>
                            <p className="text-slate-600">
                                {stats.totalPrompts === 0
                                    ? 'Use our AI-powered Prompt Lab to craft perfect prompts using 15+ frameworks.'
                                    : 'Continue crafting amazing prompts with our AI-powered tools.'}
                            </p>
                        </div>
                        <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30">
                            {stats.totalPrompts === 0 ? 'Get Started' : 'Create More'}
                        </Button>
                    </div>
                </Card>
            </section>
        </PageTemplate>
    );
};
