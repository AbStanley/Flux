import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnkiService } from './AnkiService';

// Mock global fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('AnkiService', () => {
    let service: AnkiService;

    beforeEach(() => {
        service = new AnkiService('http://127.0.0.1:8765');
        fetchMock.mockReset();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should ping successfully when Anki is running', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ result: { version: 6 }, error: null }),
        });

        const result = await service.ping();
        expect(result).toBe(true);
        expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:8765', expect.anything());
    });

    it('should return false on ping when Anki returns error', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ result: null, error: 'some error' }),
        });

        const result = await service.ping();
        expect(result).toBe(false);
    });

    it('should return false on ping when fetch fails', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network error'));

        const result = await service.ping();
        expect(result).toBe(false);
    });

    it('should fetch deck names', async () => {
        const mockDecks = ['Default', 'Japanese'];
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ result: mockDecks, error: null }),
        });

        const decks = await service.getDeckNames();
        expect(decks).toEqual(mockDecks);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: expect.stringContaining('"action":"deckNames"'),
            })
        );
    });

    it('should find cards', async () => {
        const mockIds = [123, 456];
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ result: mockIds, error: null }),
        });

        const cardIds = await service.findCards('deck:Japanese');
        expect(cardIds).toEqual(mockIds);
        expect(fetchMock).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: expect.stringContaining('"params":{"query":"deck:Japanese"}'),
            })
        );
    });

    it('should handle AnkiConnect errors gracefully by throwing', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ result: null, error: 'Deck not found' }),
        });

        await expect(service.getDeckNames()).rejects.toThrow('AnkiConnect Error: Deck not found');
    });
});
