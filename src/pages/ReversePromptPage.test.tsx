import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReversePrompt } from './ReversePromptPage';
import { LLMService } from '@/services/llm';
import { usePrompt } from '@/contexts/PromptContext';

// Mock dependencies
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
        loading: vi.fn(),
        dismiss: vi.fn(),
    }
}));

vi.mock('@/contexts/PromptContext', () => ({
    usePrompt: vi.fn()
}));

vi.mock('@/services/llm', () => ({
    LLMService: {
        getInstance: vi.fn()
    }
}));

// Mock Tesseract
vi.mock('tesseract.js', () => ({
    default: {
        recognize: vi.fn().mockResolvedValue({ data: { text: "MOCKED OCR TEXT" } })
    }
}));

// Mock child components that might use complex logic or DOM
vi.mock('@/components/ui/LLMSelector', () => ({
    LLMSelector: () => <div data-testid="llm-selector">LLM Selector</div>
}));

vi.mock('@/components/ui/PersonaSelector', () => ({
    PersonaSelector: () => <div data-testid="persona-selector">Persona Selector</div>
}));

// Mock AnalysisFocusSelector to simplify testing
vi.mock('@/components/ui/AnalysisFocusSelector', () => ({
    AnalysisFocusSelector: ({ onChange }: any) => (
        <select data-testid="mode-select" onChange={(e) => onChange(e.target.value)}>
            <option value="general">General</option>
            <option value="code">Code Optimization</option>
            <option value="security">Security Audit</option>
            <option value="design">Design System</option>
            <option value="product">Product Specs</option>
            <option value="bug">Bug Triage</option>
        </select>
    )
}));

describe('ReversePrompt Page', () => {
    // ... [Setup remains same] ...
    const mockGenerateCompletion = vi.fn();
    const mockGetProvider = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetProvider.mockReturnValue({ generateCompletion: mockGenerateCompletion });
        (LLMService.getInstance as any).mockReturnValue({ getProvider: mockGetProvider });
        (usePrompt as any).mockReturnValue({
            llmConfig: { providerId: 'openai', apiKey: 'sk-test', model: 'gpt-4' }
        });
    });

    // ... [Existing tests 1, 2 remain same] ...

    it('1. Renders the workspace title and subtitle correctly', () => {
        render(<ReversePrompt isSidebarOpen={true} />);
        expect(screen.getByText('Reverse Engineering Lab')).toBeInTheDocument();
        expect(screen.getByText('Deconstruct apps, code, and designs')).toBeInTheDocument();
    });

    it('2. Updates text input state when typing', () => {
        render(<ReversePrompt />);
        const textarea = screen.getByPlaceholderText(/Paste code, requirements/i);
        fireEvent.change(textarea, { target: { value: 'Sample prompt content' } });
        expect(textarea).toHaveValue('Sample prompt content');
    });

    it('handles image upload and analysis (design mode) with Atomic Granularity', async () => {
        const user = userEvent.setup();
        render(<ReversePrompt />);

        // Select Design Mode
        const select = screen.getByTestId('mode-select');
        await user.selectOptions(select, 'design');

        // Mock file upload
        const file = new File(['(⌐■_■)'], 'cool-design.png', { type: 'image/png' });
        const input = screen.getByTestId('file-upload');
        await user.upload(input, file);

        await waitFor(() => {
            expect(screen.getByAltText('cool-design.png')).toBeInTheDocument();
        });

        const analyzeBtn = screen.getByRole('button', { name: /Deconstruct/i });
        await user.click(analyzeBtn);

        await waitFor(() => {
            const calls = (LLMService.getInstance().getProvider('openai').generateCompletion as any).mock.calls;
            const lastCall = calls[calls.length - 1][0];

            // Expect Sonnet Design Protocol
            expect(lastCall.systemPrompt).toContain('Claude Sonnet 4.5');
            expect(lastCall.systemPrompt).toContain('Wow Factor');
            expect(lastCall.systemPrompt).toContain('Micro-Animations');
        });
    });

    it('handles text analysis (code mode) with Hidden Dependency Scan', async () => {
        const user = userEvent.setup();
        render(<ReversePrompt />);

        const select = screen.getByTestId('mode-select');
        await user.selectOptions(select, 'code');

        const textarea = screen.getByPlaceholderText(/Paste code, requirements/i);
        fireEvent.change(textarea, { target: { value: 'import AWS from "aws-sdk";' } });

        const analyzeBtn = screen.getByRole('button', { name: /Deconstruct/i });
        await user.click(analyzeBtn);

        await waitFor(() => {
            const calls = (LLMService.getInstance().getProvider('openai').generateCompletion as any).mock.calls;
            const lastCall = calls[calls.length - 1][0];

            expect(lastCall.systemPrompt).toContain('CURSOR_AGENT_PROTOCOL');
            expect(lastCall.systemPrompt).toContain('Context-First');
            expect(lastCall.systemPrompt).toContain('Diff-Centric');
        });
    });

    it('handles product mode analysis with KPI focus', async () => {
        const user = userEvent.setup();
        render(<ReversePrompt />);

        await user.selectOptions(screen.getByTestId('mode-select'), 'product');
        fireEvent.change(screen.getByPlaceholderText(/Paste code, requirements/i), { target: { value: 'New Login Flow' } });
        await user.click(screen.getByRole('button', { name: /Deconstruct/i }));

        await waitFor(() => {
            const calls = (LLMService.getInstance().getProvider('openai').generateCompletion as any).mock.calls;
            const lastCall = calls[calls.length - 1][0];

            // Falls back to default persona (Prompt Engineer) as PersonaSelector is mocked
            expect(lastCall.systemPrompt).toContain('Senior Prompt AI Engineer');
            expect(lastCall.userPrompt).toContain('New Login Flow');
        });
    });

    it('handles bug mode analysis with Stack Trace Forensic', async () => {
        const user = userEvent.setup();
        render(<ReversePrompt />);

        await user.selectOptions(screen.getByTestId('mode-select'), 'bug');
        fireEvent.change(screen.getByPlaceholderText(/Paste code, requirements/i), { target: { value: 'Error: NullPointer' } });
        await user.click(screen.getByRole('button', { name: /Deconstruct/i }));

        await waitFor(() => {
            const calls = (LLMService.getInstance().getProvider('openai').generateCompletion as any).mock.calls;
            const lastCall = calls[calls.length - 1][0];

            // Falls back to default persona
            expect(lastCall.systemPrompt).toContain('Senior Prompt AI Engineer');
            expect(lastCall.userPrompt).toContain('Error: NullPointer');
        });
    });


});
