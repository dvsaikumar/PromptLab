import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { InputField } from './InputField';
import { PromptContext } from '@/contexts/PromptContext';

// Mock everything needed for InputField
const mockContextValue = {
    fields: { 'test-field': 'Initial Value' },
    setField: vi.fn(),
    undoField: vi.fn(),
    redoField: vi.fn(),
    fieldHistory: {},
    historyIndex: {},
    generateSuggestions: vi.fn(),
    generatePrompt: vi.fn(),
    // ... add any other missing props as no-ops if needed by the component's internal logic
    // Usually only accessed ones matter. 
    simpleIdea: '',
    setSimpleIdea: vi.fn(),
};

// Wrapper to provide Context
const renderWithContext = (ui: React.ReactElement) => {
    return render(
        <PromptContext.Provider value={mockContextValue as any}>
            {ui}
        </PromptContext.Provider>
    );
};

describe('InputField Component', () => {
    it('renders label and description correctly', () => {
        renderWithContext(
            <InputField
                id="test-field"
                label="Test Label"
                description="Test Description"
            />
        );

        expect(screen.getByText('Test Label')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('displays the correct value from context', () => {
        renderWithContext(
            <InputField
                id="test-field"
                label="Test Label"
                description="Test Description"
            />
        );

        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('Initial Value');
    });

    it('calls setField when typing', () => {
        renderWithContext(
            <InputField
                id="test-field"
                label="Test Label"
                description="Test Description"
            />
        );

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'New Value' } });

        expect(mockContextValue.setField).toHaveBeenCalledWith('test-field', 'New Value');
    });

    it('calls generatePrompt when Ctrl+Enter is pressed', () => {
        renderWithContext(
            <InputField
                id="test-field"
                label="Test Label"
                description="Test Description"
            />
        );

        const textarea = screen.getByRole('textbox');
        fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

        expect(mockContextValue.generatePrompt).toHaveBeenCalled();
    });
});
