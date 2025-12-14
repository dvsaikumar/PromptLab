import React from 'react';
import { PageTemplate } from '@/components/ui/PageTemplate';
import { Zap } from 'lucide-react';

interface NewTechPageProps {
    isSidebarOpen?: boolean;
}

export const NewTechPage: React.FC<NewTechPageProps> = ({ isSidebarOpen }) => {
    return (
        <PageTemplate
            title="New Tech"
            subtitle="Explore the latest in technology"
            icon={Zap}
            iconGradient="from-yellow-400 to-orange-500"
            isSidebarOpen={isSidebarOpen}
            iconSize={20}
            titleClassName="text-lg"
            subtitleClassName="text-xs"
        >
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500">
                <div className="mb-4 p-4 bg-slate-100 rounded-full">
                    <Zap size={48} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">New Tech Template</h3>
                <p>This is a blank canvas for your new technology page.</p>
            </div>
        </PageTemplate>
    );
};
