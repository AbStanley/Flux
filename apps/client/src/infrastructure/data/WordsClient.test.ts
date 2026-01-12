import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WordsClient } from './WordsClient';

// Mock ApiClient class
vi.mock('../api/api-client', () => {
    return {
        ApiClient: class {
            post = vi.fn();
            get = vi.fn();
            delete = vi.fn();
            patch = vi.fn(); // Add other methods if needed to satisfy type
        }
    };
});

describe('WordsClient', () => {
    let client: WordsClient;
    let mockApiClient: any;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset env vars if needed, but easier to just test behavior based on current env mock
    });


    it('should call post on ApiClient when saveWord is called', async () => {
        client = new WordsClient();
        mockApiClient = (client as any).client;
        const mockResponse = { success: true };
        mockApiClient.post.mockResolvedValue(mockResponse);

        const wordData = { text: 'test', definition: 'a test' };
        const result = await client.saveWord(wordData);

        expect(mockApiClient.post).toHaveBeenCalledWith('/api/words', wordData);
        expect(result).toEqual(mockResponse);
    });

    it('should return error if ApiClient throws', async () => {
        client = new WordsClient();
        mockApiClient = (client as any).client;
        const error = new Error('Network error');
        mockApiClient.post.mockRejectedValue(error);

        await expect(client.saveWord({ text: 'fail' })).rejects.toThrow('Network error');
    });
});
