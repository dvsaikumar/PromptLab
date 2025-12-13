import React, { useState, useEffect } from 'react';
import './freelance.scss';
import { Toaster } from 'react-hot-toast';
import { clsx } from 'clsx';

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { MyHub } from '@/pages/MyHub';
import { PromptLab } from '@/pages/PromptLab';
import { PromptLabNew } from '@/pages/PromptLabNew';
import { ToneShifter } from '@/pages/ToneShifter';
import { SavedPromptsLibrary } from '@/pages/SavedPrompts';
import { TemplatePage } from '@/pages/TemplatePage';
import { ChainReactionPage } from '@/pages/ChainReactionPage';
import { ReversePrompt } from '@/pages/ReversePromptPage';
import { promptDB } from '@/services/database';

const AppContent: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activePage, setActivePage] = useState<string>('my-hub');
    const [activeSection, setActiveSection] = useState<string | null>('quick-start');

    // Initialize database on mount
    useEffect(() => {
        // Force database initialization
        promptDB.getAllPrompts().catch(console.error);

        // Check for page param for hidden routes
        const params = new URLSearchParams(window.location.search);
        if (params.get('page') === 'template') {
            setActivePage('template');
        }
        if (params.get('page') === 'pl2') {
            setActivePage('prompt-lab-2');
        }

        // Listen for settings open request
        const handleOpenSettings = () => setIsSettingsOpen(true);
        window.addEventListener('open-settings-modal', handleOpenSettings);
        return () => window.removeEventListener('open-settings-modal', handleOpenSettings);
    }, []);

    const toggleSection = (section: string) => {
        setActiveSection(prev => prev === section ? null : section);
    };

    const handleNavigation = (page: string) => {
        setActivePage(page);
    };

    const handleNavigateWithSection = (page: string, section?: string) => {
        setActivePage(page);
        if (section) {
            setActiveSection(section);
        }
    };

    const renderPage = () => {
        switch (activePage) {
            case 'my-hub':
                return <MyHub isSidebarOpen={isSidebarOpen} />;
            case 'prompt-lab':
                return <PromptLab activeSection={activeSection} toggleSection={toggleSection} isSidebarOpen={isSidebarOpen} />;
            case 'prompt-lab-2':
                return <PromptLabNew isSidebarOpen={isSidebarOpen} />;
            case 'reverse-prompt':
                return <ReversePrompt isSidebarOpen={isSidebarOpen} />;
            case 'chain-reaction':
                return <ChainReactionPage isSidebarOpen={isSidebarOpen} />;
            case 'tone-shifter':
                return <ToneShifter isSidebarOpen={isSidebarOpen} />;
            case 'saved-prompts':
                return <SavedPromptsLibrary isSidebarOpen={isSidebarOpen} onNavigate={handleNavigateWithSection} />;
            case 'template':
                return <TemplatePage isSidebarOpen={isSidebarOpen} />;
            default:
                return <MyHub isSidebarOpen={isSidebarOpen} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Header
                onOpenSettings={() => setIsSettingsOpen(true)}
            />

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                activeSection={activePage}
                onNavigate={handleNavigation}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            <main className={clsx(
                "pt-16 pb-16 min-h-screen transition-all duration-300",
                isSidebarOpen ? "lg:pl-64" : "lg:pl-16"
            )}>
                <div className="px-2 py-8">
                    {renderPage()}
                </div>
            </main>

            <Footer isSidebarOpen={isSidebarOpen} />

            <Toaster position="bottom-center" />
        </div>
    );
};

export default AppContent;
