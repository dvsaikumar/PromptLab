import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SimpleIdea } from './SimpleIdea';
import { PromptContext } from '@/contexts/PromptContext';

// Mock dependencies to avoid environment issues (pdfjs-dist)
vi.mock('@/utils/fileProcessor', () => ({
    processFile: vi.fn()
}));

// Mock context values
const mockContextValue = {
    simpleIdea: 'Initial Idea',
    setSimpleIdea: vi.fn(),
    selectedTones: [],
    attachments: [],
    addAttachment: vi.fn(),
    removeAttachment: vi.fn(),
    expandIdea: vi.fn(),
    complexity: 'direct',
    setComplexity: vi.fn(),
    llmConfig: { model: 'gpt-4', providerId: 'openai' },
    activePersonaId: 'prompt-engineer',
    setActivePersonaId: vi.fn(),
};

const renderWithContext = (ui: React.ReactElement) => {
    return render(
        <PromptContext.Provider value={mockContextValue as any}>
            {ui}
        </PromptContext.Provider>
    );
};

describe('SimpleIdea Component', () => {
    it('renders text area with initial value', () => {
        renderWithContext(
            <SimpleIdea isOpen={true} onToggle={vi.fn()} isSidebarOpen={true} />
        );
        const textarea = screen.getByPlaceholderText(/Describe your goal/i);
        expect(textarea).toBeInTheDocument();
        expect(textarea).toHaveValue('Initial Idea');
    });

    it('renders persona selector', () => {
        renderWithContext(
            <SimpleIdea isOpen={true} onToggle={vi.fn()} isSidebarOpen={true} />
        );
        expect(screen.getByText('Expert Persona')).toBeInTheDocument();
        // Badge text '15+ Yrs Exp' was removed in favor of clean internal label
    });

    it('calls setSimpleIdea when typing', () => {
        renderWithContext(
            <SimpleIdea isOpen={true} onToggle={vi.fn()} isSidebarOpen={true} />
        );
        const textarea = screen.getByPlaceholderText(/Describe your goal/i);
        fireEvent.change(textarea, { target: { value: 'New Idea' } });
        expect(mockContextValue.setSimpleIdea).toHaveBeenCalledWith('New Idea');
    });
});
