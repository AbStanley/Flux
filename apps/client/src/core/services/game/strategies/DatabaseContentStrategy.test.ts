import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatabaseContentStrategy } from './DatabaseContentStrategy';
import { wordsApi } from '../../../../infrastructure/api/words';

vi.mock('../../../../infrastructure/api/words');

describe('DatabaseContentStrategy', () => {
    let strategy: DatabaseContentStrategy;

    beforeEach(() => {
        strategy = new DatabaseContentStrategy();
        vi.clearAllMocks();

        // Smart mock: Return items based on the requested 'type'
        (wordsApi.getAll as any).mockImplementation(async (params: any) => {
            if (params.type === 'phrase') {
                return {
                    items: [{ id: 'p1', text: 'A phrase', type: 'phrase', definition: 'Une phrase', sourceLanguage: 'en', targetLanguage: 'fr' }],
                    total: 1
                };
            }
            if (params.type === 'word') {
                return {
                    items: [{ id: 'w1', text: 'Word', type: 'word', definition: 'Mot', sourceLanguage: 'en', targetLanguage: 'fr' }],
                    total: 1
                };
            }
            return { items: [], total: 0 };
        });
    });

    it('should validate availability as always true', async () => {
        expect(await strategy.validateAvailability()).toBe(true);
    });

    it('should pass type="word" when gameMode is build-word', async () => {
        await strategy.fetchItems({ gameMode: 'build-word', limit: 10 });
        expect(wordsApi.getAll).toHaveBeenCalledWith(expect.objectContaining({
            type: 'word'
        }));
    });

    it('should pass type="word" when gameMode is multiple-choice', async () => {
        await strategy.fetchItems({ gameMode: 'multiple-choice', limit: 10 });
        expect(wordsApi.getAll).toHaveBeenCalledWith(expect.objectContaining({
            type: 'word'
        }));
    });

    it('should fetch phrases for scramble mode', async () => {
        await strategy.fetchItems({ gameMode: 'scramble', limit: 10 });

        // Scramble calls getAll twice. Once for phrases, once for words (for examples).
        // Verify we requested phrases
        expect(wordsApi.getAll).toHaveBeenCalledWith(expect.objectContaining({
            type: 'phrase'
        }));
    });

    it('should force type="word" for dictation mode', async () => {
        const items = await strategy.fetchItems({ gameMode: 'dictation', limit: 10 });

        // Check the arguments of the first call
        const args = (wordsApi.getAll as any).mock.calls[0][0];
        expect(args.type).toBe('word');

        // Verify result from smart mock
        expect(items.length).toBeGreaterThan(0);
        expect(items[0].type).toBe('word');
    });

    it('should force type="word" for build-word mode', async () => {
        const items = await strategy.fetchItems({ gameMode: 'build-word', limit: 10 });
        expect(items[0].type).toBe('word');
    });

    it('should force type="word" for multiple-choice mode', async () => {
        const items = await strategy.fetchItems({ gameMode: 'multiple-choice', limit: 10 });
        expect(items[0].type).toBe('word');
    });

    it('should ensure scramble mode is the ONLY one fetching phrases', async () => {
        // 1. Verify Scramble DOES fetch phrases
        (wordsApi.getAll as any).mockClear();
        const scrambleItems = await strategy.fetchItems({ gameMode: 'scramble', limit: 10 });

        const phraseItem = scrambleItems.find(i => i.type === 'phrase');
        expect(phraseItem).toBeDefined();
        expect(phraseItem?.question).toBe('A phrase');

        // 2. Verify Dictation DOES NOT fetch phrases
        (wordsApi.getAll as any).mockClear();
        const dictationItems = await strategy.fetchItems({ gameMode: 'dictation', limit: 10 });

        const hasPhrase = dictationItems.some(i => i.type === 'phrase');
        expect(hasPhrase).toBe(false);
    });
});
