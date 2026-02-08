import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerAIService } from './ServerAIService';

describe('ServerAIService', () => {
    let service: ServerAIService;
    const mockBaseUrl = 'http://localhost:3002/api';
    const mockModel = 'test-model';

    beforeEach(() => {
        service = new ServerAIService(mockBaseUrl, mockModel);
        vi.stubGlobal('fetch', vi.fn());
    });

    it('should initialize with correct base URL and model', () => {
        expect(service.getModel()).toBe(mockModel);
    });

    describe('translateText', () => {
        it('should call fetch with correct parameters', async () => {
            const mockResponse = 'Hola';
            (global.fetch as any).mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(mockResponse)
            });

            const result = await service.translateText('Hello', 'es');

            expect(global.fetch).toHaveBeenCalledWith(
                `${mockBaseUrl}/translate`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        text: 'Hello',
                        targetLanguage: 'es',
                        context: undefined,
                        sourceLanguage: undefined,
                        model: mockModel
                    })
                })
            );
            expect(result).toBe(mockResponse);
        });

        it('should throw error when response is not ok', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: false
            });

            await expect(service.translateText('Hello', 'es')).rejects.toThrow('Translation failed');
        });
    });

    describe('explainText', () => {
        it('should call fetch with correct parameters', async () => {
            const mockResponse = 'Explanation';
            (global.fetch as any).mockResolvedValue({
                ok: true,
                text: () => Promise.resolve(mockResponse)
            });

            const result = await service.explainText('Hello', 'es');

            expect(global.fetch).toHaveBeenCalledWith(
                `${mockBaseUrl}/explain`,
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        text: 'Hello',
                        targetLanguage: 'es',
                        context: undefined,
                        model: mockModel
                    })
                })
            );
            expect(result).toBe(mockResponse);
        });
    });

    describe('getRichTranslation', () => {
        it('should call fetch and return json', async () => {
            const mockResult = { translation: 'Hola', grammar: {} };
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResult)
            });

            const result = await service.getRichTranslation('Hello', 'es');

            expect(global.fetch).toHaveBeenCalledWith(
                `${mockBaseUrl}/rich-translation`,
                expect.objectContaining({
                    method: 'POST'
                })
            );
            expect(result).toEqual(mockResult);
        });
    });

    describe('checkHealth', () => {
        it('should return true when fetch is ok', async () => {
            (global.fetch as any).mockResolvedValue({ ok: true });
            const result = await service.checkHealth();
            expect(result).toBe(true);
        });

        it('should return false when fetch fails', async () => {
            (global.fetch as any).mockRejectedValue(new Error('Network error'));
            const result = await service.checkHealth();
            expect(result).toBe(false);
        });
    });

    describe('getAvailableModels', () => {
        it('should return model names', async () => {
            (global.fetch as any).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    models: [{ name: 'm1' }, { name: 'm2' }]
                })
            });

            const models = await service.getAvailableModels();
            expect(models).toEqual(['m1', 'm2']);
        });

        it('should return empty array on failure', async () => {
            (global.fetch as any).mockRejectedValue(new Error('Fail'));
            const models = await service.getAvailableModels();
            expect(models).toEqual([]);
        });
    });
});
