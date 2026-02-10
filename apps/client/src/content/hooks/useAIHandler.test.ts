import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIHandler } from './useAIHandler';
import { ServerAIService } from '../../infrastructure/ai/ServerAIService';

// Mock ServerAIService class
vi.mock('../../infrastructure/ai/ServerAIService', () => {
    const ServerAIServiceMock = vi.fn();
    ServerAIServiceMock.prototype.getAvailableModels = vi.fn();
    ServerAIServiceMock.prototype.setModel = vi.fn();
    ServerAIServiceMock.prototype.explainText = vi.fn();
    ServerAIServiceMock.prototype.translateText = vi.fn();
    ServerAIServiceMock.prototype.checkHealth = vi.fn();
    return { ServerAIService: ServerAIServiceMock };
});

import { ServiceProvider } from '../../presentation/contexts/ServiceContext';

const mockSetAiModel = vi.fn();
const mockStoreState = {
    aiModel: null,
    aiHost: '',
    setAiModel: mockSetAiModel
};

vi.mock('../../presentation/features/reader/store/useReaderStore', () => ({
    useReaderStore: (selector?: (state: any) => any) => {
        if (selector) return selector(mockStoreState);
        return mockStoreState;
    }
}));

interface MockServerAIService {
    getAvailableModels: Mock<() => Promise<string[]>>;
    setModel: Mock<(model: string) => void>;
    explainText: Mock<(text: string, targetLanguage?: string, context?: string) => Promise<string>>;
    translateText: Mock<(text: string, targetLanguage?: string, context?: string, sourceLanguage?: string) => Promise<string>>;
    checkHealth: Mock<() => Promise<boolean>>;
}

describe('useAIHandler', () => {
    let mockService: MockServerAIService;

    beforeEach(() => {
        vi.clearAllMocks();
        // Get the mock instance
        mockService = ServerAIService.prototype as unknown as MockServerAIService;
        mockService.getAvailableModels.mockResolvedValue(['llama3']);
        mockService.setModel.mockReturnValue(undefined);
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => useAIHandler(), { wrapper: ServiceProvider });
        expect(result.current.result).toBe('');
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    it('handles translation flow successfully', async () => {
        mockService.translateText.mockResolvedValue('Translated Text');

        const { result } = renderHook(() => useAIHandler(), { wrapper: ServiceProvider });

        act(() => {
            result.current.handleAction('Source Text', 'TRANSLATE', 'Spanish');
        });

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.result).toBe('Translated Text');
        expect(result.current.error).toBe(null);
        expect(mockService.translateText).toHaveBeenCalledWith('Source Text', 'Spanish', 'Auto');
        expect(mockService.setModel).toHaveBeenCalledWith('llama3');
    });

    it('handles explanation flow successfully', async () => {
        mockService.explainText.mockResolvedValue('Explanation Text');

        const { result } = renderHook(() => useAIHandler(), { wrapper: ServiceProvider });

        act(() => {
            result.current.handleAction('Source', 'EXPLAIN', 'English');
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.result).toBe('Explanation Text');
        expect(mockService.explainText).toHaveBeenCalledWith('Source', 'English', 'Auto');
    });

    it('handles error state', async () => {
        mockService.translateText.mockRejectedValue(new Error('Network Error'));

        const { result } = renderHook(() => useAIHandler(), { wrapper: ServiceProvider });

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

        const { result } = renderHook(() => useAIHandler(), { wrapper: ServiceProvider });
        await act(async () => {
            await result.current.handleAction('Text', 'TRANSLATE', 'English');
        });

        expect(mockService.setModel).toHaveBeenCalledWith('mistral-7b');
    });
});
