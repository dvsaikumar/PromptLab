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
        expect(screen.getByText('Reverse Prompt Engineering')).toBeInTheDocument();
        expect(screen.getByText('Full-page workspace for deconstructing content and designs')).toBeInTheDocument();
    });

    it('2. Updates text input state when typing', () => {
        render(<ReversePrompt />);
        const textarea = screen.getByPlaceholderText(/I will analyze/i);
        fireEvent.change(textarea, { target: { value: 'Sample prompt content' } });
        expect(textarea).toHaveValue('Sample prompt content');
    });

    it('handles image upload and analysis (design mode) with Atomic Granularity', async () => {
        const user = userEvent.setup();
        render(<ReversePrompt />);

        // Mock file upload
        const file = new File(['(⌐■_■)'], 'cool-design.png', { type: 'image/png' });
        const input = screen.getByTestId('file-upload');
        await user.upload(input, file);

        await waitFor(() => {
            expect(screen.getByText('cool-design.png')).toBeInTheDocument();
        });

        const analyzeBtn = screen.getByTitle('Start Analysis');
        await user.click(analyzeBtn);

        await waitFor(() => {
            const calls = (LLMService.getInstance().getProvider('openai').generateCompletion as any).mock.calls;
            const lastCall = calls[calls.length - 1][0];

            // EXTREME TEST: Check for God Mode & Atomic Level Details
            expect(lastCall.systemPrompt).toContain('ATOMIC GRANULARITY');
            expect(lastCall.systemPrompt).toContain('Pixel-Physics');
            expect(lastCall.userPrompt).toContain('Visual Compiler Trace');
            expect(lastCall.userPrompt).toContain('Anti-Hallucination Check');
        });
    });

    it('handles text analysis (code mode) with Hidden Dependency Scan', async () => {
        const user = userEvent.setup();
        render(<ReversePrompt />);

        const select = screen.getByTestId('mode-select');
        await user.selectOptions(select, 'code');

        const textarea = screen.getByPlaceholderText(/I will analyze/i);
        fireEvent.change(textarea, { target: { value: 'import AWS from "aws-sdk";' } });

        const analyzeBtn = screen.getByTitle('Start Analysis');
        await user.click(analyzeBtn);

        await waitFor(() => {
            const calls = (LLMService.getInstance().getProvider('openai').generateCompletion as any).mock.calls;
            const lastCall = calls[calls.length - 1][0];

            expect(lastCall.userPrompt).toContain('Hidden Dependency Scan');
            expect(lastCall.systemPrompt).toContain('GOD MODE ACTIVE');
            expect(lastCall.systemPrompt).toContain('Gemini Vibe Coder');
        });
    });

    it('handles product mode analysis with KPI focus', async () => {
        const user = userEvent.setup();
        render(<ReversePrompt />);

        await user.selectOptions(screen.getByTestId('mode-select'), 'product');
        fireEvent.change(screen.getByPlaceholderText(/I will analyze/i), { target: { value: 'New Login Flow' } });
        await user.click(screen.getByTitle('Start Analysis'));

        await waitFor(() => {
            const calls = (LLMService.getInstance().getProvider('openai').generateCompletion as any).mock.calls;
            const lastCall = calls[calls.length - 1][0];

            expect(lastCall.userPrompt).toContain('Chief Product Officer');
            expect(lastCall.userPrompt).toContain('Success Metrics');
            expect(lastCall.userPrompt).toContain('Gherkin Syntax');
        });
    });

    it('handles bug mode analysis with Stack Trace Forensic', async () => {
        const user = userEvent.setup();
        render(<ReversePrompt />);

        await user.selectOptions(screen.getByTestId('mode-select'), 'bug');
        fireEvent.change(screen.getByPlaceholderText(/I will analyze/i), { target: { value: 'Error: NullPointer' } });
        await user.click(screen.getByTitle('Start Analysis'));

        await waitFor(() => {
            const calls = (LLMService.getInstance().getProvider('openai').generateCompletion as any).mock.calls;
            const lastCall = calls[calls.length - 1][0];

            expect(lastCall.userPrompt).toContain('Distinguished Engineer');
            expect(lastCall.userPrompt).toContain('Stack Trace Anatomy');
            expect(lastCall.userPrompt).toContain('5 Whys');
        });
    });

    it('4. Disables analysis button if input is empty', () => {
        render(<ReversePrompt />);
        const sendBtn = screen.getByTitle('Start Analysis');
        expect(sendBtn).toBeDisabled();
    });
});
