import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnkiContentStrategy } from './AnkiContentStrategy';
import { ankiService } from '@/infrastructure/external/anki/AnkiService';

// Mock the ankiService dependency
vi.mock('@/infrastructure/external/anki/AnkiService', () => ({
    ankiService: {
        ping: vi.fn(),
        findCards: vi.fn(),
        getCardsInfo: vi.fn(),
    }
}));

describe('AnkiContentStrategy', () => {
    let strategy: AnkiContentStrategy;

    beforeEach(() => {
        strategy = new AnkiContentStrategy();
        vi.resetAllMocks();
    });

    it('should validate availability via ping', async () => {
        vi.mocked(ankiService.ping).mockResolvedValue(true);
        expect(await strategy.validateAvailability()).toBe(true);
        expect(ankiService.ping).toHaveBeenCalled();
    });

    it('should throw if no collectionId (deck name) provided', async () => {
        await expect(strategy.fetchItems({} as any)).rejects.toThrow("Deck name");
    });

    it('should return empty list if no cards found', async () => {
        vi.mocked(ankiService.findCards).mockResolvedValue([]);
        const items = await strategy.fetchItems({ collectionId: 'TestDeck' });
        expect(items).toEqual([]);
    });

    it('should fetch and map cards correctly', async () => {
        // Mock finding cards
        vi.mocked(ankiService.findCards).mockResolvedValue([1, 2, 3, 4, 5]);

        // Mock card info
        const mockInfo = [
            {
                cardId: 1,
                fields: {
                    Front: { value: 'Hello', order: 0 },
                    Back: { value: 'Konnichiwa', order: 1 }
                },
                fieldOrder: 0,
                modelName: 'Basic',
                ordinal: 0,
                deckName: 'TestDeck',
                css: '',
                question: '',
                answer: ''
            },
            {
                cardId: 2,
                fields: {
                    Front: { value: '<b>Cat</b>', order: 0 },
                    Back: { value: 'Neko', order: 1 }
                },
                fieldOrder: 0,
                modelName: 'Basic',
                ordinal: 0,
                deckName: 'TestDeck',
                css: '',
                question: '',
                answer: ''
            }
        ];

        // Should request info for subset (limit defaults to 10 so it requests all input ids)
        // Wait, logic shuffles and slices. 
        // With 5 inputs and limit 10, it requests 5 info.
        // We simulate it returning info for 2 of them to match our mock logic simplicity
        vi.mocked(ankiService.getCardsInfo).mockResolvedValue(mockInfo);

        const items = await strategy.fetchItems({ collectionId: 'TestDeck', limit: 2 });

        expect(items).toHaveLength(2);
        expect(items[0].source).toBe('anki');

        // Check HTML stripping
        const catItem = items.find(i => i.answer === 'Neko');
        expect(catItem).toBeDefined();
        expect(catItem?.question).toBe('Cat'); // Stripped <b>
    });
});
