import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIHandler } from './useAIHandler';
import { OllamaService } from '../../infrastructure/ai/OllamaService';

// Mock OllamaService class
vi.mock('../../infrastructure/ai/OllamaService', () => {
    const OllamaServiceMock = vi.fn();
    OllamaServiceMock.prototype.getAvailableModels = vi.fn();
    OllamaServiceMock.prototype.setModel = vi.fn();
    OllamaServiceMock.prototype.explainText = vi.fn();
    OllamaServiceMock.prototype.translateText = vi.fn();
    OllamaServiceMock.prototype.setBaseUrl = vi.fn();
    return { OllamaService: OllamaServiceMock };
});

const mockSetAiModel = vi.fn();
vi.mock('../../presentation/features/reader/store/useReaderStore', () => ({
    useReaderStore: () => ({
        aiModel: null,
        aiHost: '',
        setAiModel: mockSetAiModel
    })
}));

interface MockOllamaService {
    getAvailableModels: Mock<() => Promise<string[]>>;
    setModel: Mock<(model: string) => void>;
    explainText: Mock<(text: string, targetLanguage?: string, context?: string) => Promise<string>>;
    translateText: Mock<(text: string, targetLanguage?: string, context?: string, sourceLanguage?: string) => Promise<string>>;
    setBaseUrl: Mock<(url: string) => void>;
}

describe('useAIHandler', () => {
    let mockService: MockOllamaService;

    beforeEach(() => {
        vi.clearAllMocks();
        // Get the mock instance
        mockService = OllamaService.prototype as unknown as MockOllamaService;
        mockService.getAvailableModels.mockResolvedValue(['llama3']);
        mockService.setModel.mockReturnValue(undefined);
        mockService.setBaseUrl.mockReturnValue(undefined);
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => useAIHandler());
        expect(result.current.result).toBe('');
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('handles translation flow successfully', async () => {
        mockService.translateText.mockResolvedValue('Translated Text');

        const { result } = renderHook(() => useAIHandler());

        act(() => {
            result.current.handleAction('Source Text', 'TRANSLATE', 'Spanish');
        });

        // Should set loading true immediately (synchronously checked?) 
        // Note: state updates inside async function might not reflect immediately in test unless we wait
        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.result).toBe('Translated Text');
        expect(result.current.error).toBe(null);
        expect(mockService.translateText).toHaveBeenCalledWith('Source Text', 'Spanish');
        expect(mockService.setModel).toHaveBeenCalledWith('llama3');
    });

    it('handles explanation flow successfully', async () => {
        mockService.explainText.mockResolvedValue('Explanation Text');

        const { result } = renderHook(() => useAIHandler());

        act(() => {
            result.current.handleAction('Source', 'EXPLAIN', 'English');
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.result).toBe('Explanation Text');
        expect(mockService.explainText).toHaveBeenCalledWith('Source', 'English');
    });

    it('handles error state', async () => {
        mockService.translateText.mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => useAIHandler());

        act(() => {
            result.current.handleAction('Text', 'TRANSLATE', 'English');
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toContain('Error: Network Error');
        expect(result.current.result).toBe('');
    });

    it('selects preferred model if available', async () => {
        mockService.getAvailableModels.mockResolvedValue(['other-model', 'mistral-7b']);
        mockService.translateText.mockResolvedValue('');

        const { result } = renderHook(() => useAIHandler());
        await act(async () => {
            await result.current.handleAction('Text', 'TRANSLATE', 'English');
        });

        expect(mockService.setModel).toHaveBeenCalledWith('mistral-7b');
    });
});
