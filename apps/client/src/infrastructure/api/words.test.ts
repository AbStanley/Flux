import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { wordsApi } from './words';
import { defaultClient } from './api-client';

// Mock the ApiClient methods
vi.mock('./api-client', () => ({
    defaultClient: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
    }
}));

describe('wordsApi', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('getAll', () => {
        it('should call get with correct endpoint and params', async () => {
            const params = { sort: 'asc', sourceLanguage: 'en' };
            const mockResponse = [{ id: '1', text: 'hello' }];
            (defaultClient.get as any).mockResolvedValue(mockResponse);

            const result = await wordsApi.getAll(params);

            expect(defaultClient.get).toHaveBeenCalledWith('/api/words', params);
            expect(result).toEqual(mockResponse);
        });

        it('should call get with correct endpoint when no params provided', async () => {
            const mockResponse = [{ id: '1', text: 'hello' }];
            (defaultClient.get as any).mockResolvedValue(mockResponse);

            const result = await wordsApi.getAll();

            expect(defaultClient.get).toHaveBeenCalledWith('/api/words', undefined);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('create', () => {
        it('should call post with correct endpoint and data', async () => {
            const data = { text: 'hello' };
            const mockResponse = { id: '1', text: 'hello' };
            (defaultClient.post as any).mockResolvedValue(mockResponse);

            const result = await wordsApi.create(data);

            expect(defaultClient.post).toHaveBeenCalledWith('/api/words', data);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('delete', () => {
        it('should call delete with correct endpoint', async () => {
            const id = '123';
            (defaultClient.delete as any).mockResolvedValue(undefined);

            await wordsApi.delete(id);

            expect(defaultClient.delete).toHaveBeenCalledWith('/api/words/123');
        });
    });

    describe('update', () => {
        it('should call patch with correct endpoint and data', async () => {
            const id = '123';
            const data = { definition: 'greeting' };
            const mockResponse = { id: '123', text: 'hello', definition: 'greeting' };
            (defaultClient.patch as any).mockResolvedValue(mockResponse);

            const result = await wordsApi.update(id, data);

            expect(defaultClient.patch).toHaveBeenCalledWith('/api/words/123', data);
            expect(result).toEqual(mockResponse);
        });
    });
});
