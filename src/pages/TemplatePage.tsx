import React from 'react';
import { PageTemplate } from '@/components/ui/PageTemplate';
import { Layout, LayoutDashboard, BarChart, FileText, Users, Plus, Search, MoreHorizontal, ArrowUpRight, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface TemplatePageProps {
    isSidebarOpen?: boolean;
}

export const TemplatePage: React.FC<TemplatePageProps> = ({ isSidebarOpen = false }) => {
    const [activeTab, setActiveTab] = React.useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', colorClass: 'bg-indigo-100 text-indigo-700' },
        { id: 'settings', label: 'Settings', colorClass: 'bg-amber-100 text-amber-700' },
        { id: 'logs', label: 'Logs', colorClass: 'bg-emerald-100 text-emerald-700' }
    ];

    const pillMenu = (
        <div className="flex bg-slate-100/50 p-1 rounded-lg">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                        ? `${tab.colorClass} shadow-sm`
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );

    return (
        <PageTemplate
            title="Template Page"
            subtitle="A blank canvas for new features"
            icon={Layout}
            iconGradient="from-pink-500 to-rose-500"
            isSidebarOpen={isSidebarOpen}
            rightContent={pillMenu}
            className="flex flex-col !p-0 !top-[120px]"
            headerClassName="!px-4 !h-14"
            iconSize={20}
            titleClassName="text-lg"
            subtitleClassName="text-xs"
        >
            <div className="flex h-full">
                {/* Secondary Sidebar */}
                <div className="w-64 h-full flex-shrink-0 flex flex-col bg-white border-r border-slate-200">
                    <div className="p-2 pt-6 space-y-2 flex-1 overflow-y-auto">
                        <button className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-sm transition-colors">
                            <LayoutDashboard size={16} className="text-indigo-600" />
                            Dashboard
                        </button>
                        <button className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors">
                            <BarChart size={16} className="text-emerald-500" />
                            Analytics
                        </button>
                        <button className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 font-bold text-sm transition-colors">
                            <FileText size={16} className="text-blue-500" />
                            Reports
                        </button>
                    </div>
                    <div className="p-2 border-t border-slate-100 mt-auto">
                        <button className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors">
                            <Users size={16} className="text-amber-500" />
                            User Settings
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 h-full flex flex-col min-w-0 bg-slate-50 pt-2 overflow-hidden">
                    {/* Secondary Top Head Bar */}
                    <div className="shrink-0 h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-10">
                        <div className="flex items-center gap-4">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h2>
                            <div className="h-4 w-px bg-slate-200"></div>
                            <p className="text-xs text-slate-400">Manage your project {activeTab} area</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-600">
                                <Search size={16} />
                            </Button>
                            <Button size="sm" leftIcon={<Plus size={16} />} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                                Add New
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-[18px] py-4">
                        <div className="w-full mx-auto space-y-4">
                            {/* Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <Card key={i} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase">Metric {i}</p>
                                            <h3 className="text-2xl font-bold text-slate-800 mt-1">{100 * i}</h3>
                                        </div>
                                        <div className={`p-2 rounded-lg ${i % 2 === 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            <ArrowUpRight size={20} />
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Left Column (2 spans) */}
                                <div className="lg:col-span-2 space-y-4">
                                    <Card className="min-h-[300px] p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold text-slate-800">Main Content Area</h3>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal size={16} /></Button>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl h-64 flex items-center justify-center text-slate-400">
                                            Feature Component / Chart Placeholder
                                        </div>
                                    </Card>

                                    <Card className="p-6">
                                        <h3 className="font-bold text-slate-800 mb-4">Detailed List View</h3>
                                        <div className="space-y-3">
                                            {[1, 2, 3].map((j) => (
                                                <div key={j} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                            {j}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-700">List Item Title {j}</p>
                                                            <p className="text-xs text-slate-400">Description or metadata line</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="default" className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>

                                {/* Right Column (1 span) */}
                                <div className="space-y-4">
                                    <Card className="h-full p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-slate-800">Activity Feed</h3>
                                            <Clock size={16} className="text-slate-400" />
                                        </div>
                                        <div className="relative border-l border-slate-200 ml-2 space-y-6">
                                            {[1, 2, 3, 4, 5].map((k) => (
                                                <div key={k} className="relative pl-6">
                                                    <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-slate-200 border-2 border-white"></div>
                                                    <p className="text-sm text-slate-600">User updated standard settings configuration.</p>
                                                    <span className="text-xs text-slate-400 mt-1 block">2 hours ago</span>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Footer - Aligned with User Settings in Sidebar */}
                    <div className="shrink-0 h-[53px] bg-white border-t border-slate-200 px-4 flex items-center justify-between">
                        <p className="text-xs text-slate-400">© 2024 DStudiosLab. All rights reserved.</p>
                        <div className="flex gap-4">
                            <span className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">Privacy</span>
                            <span className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">Terms</span>
                        </div>
                    </div>
                </div>
            </div>
        </PageTemplate>
    );
};
