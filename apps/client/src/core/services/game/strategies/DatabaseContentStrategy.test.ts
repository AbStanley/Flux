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
                    items: [{ id: 'p1', text: 'A phrase', type: 'phrase', definition: 'Une phrase longue', sourceLanguage: 'en', targetLanguage: 'fr' }],
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


    it('should handle reverse fetch for scramble mode correctly', async () => {
        // Mock wordsApi.getAll to return empty for forward, and match for reverse
        (wordsApi.getAll as any).mockImplementation((params: any) => {
            // Forward (Es->En) -> Empty
            if (params.sourceLanguage === 'es' && params.targetLanguage === 'en') {
                return Promise.resolve({ items: [], total: 0 });
            }
            // Reverse (En->Es) -> Mock Match
            if (params.sourceLanguage === 'en' && params.targetLanguage === 'es') {
                const mockWord = {
                    id: 'w1',
                    text: 'Cat',
                    definition: 'Gato',
                    sourceLanguage: 'en',
                    targetLanguage: 'es',
                    examples: [{
                        id: 'ex1',
                        sentence: 'The cat is black', // Source (En)
                        translation: 'El gato es negro', // Target (Es)
                    }],
                    type: 'word'
                };
                return Promise.resolve({ items: [mockWord], total: 1 });
            }
            return Promise.resolve({ items: [], total: 0 });
        });

        const items = await strategy.fetchItems({
            gameMode: 'scramble',
            language: { source: 'es', target: 'en' }
        });


        expect(items.length).toBeGreaterThan(0);
        const item = items[0];


        // Reverse Fetch Logic:
        // Word is En->Es. User wants Es->En.
        // We are using the "Example" of the word.
        // Example: Sentence="The cat..."(En), Translation="El gato..."(Es).
        // Goal: Learn Es (Source). Prompt: En (Target).
        // Answer (Scramble) should be "El gato..." (Es).
        // Question (Prompt) should be "The cat..." (En).
        // Lang Metadata: Source=Es, Target=En.

        expect(item.question).toBe('The cat is black'); // Wait, check implementation logic again?

        // Let's check implementation behavior:
        // mapExampleToGameItem(..., swap=true)
        // if (swap) {
        //    q = example.sentence; // "The cat is black" (En)
        //    a = example.translation; // "El gato es negro" (Es)
        //    ...
        //    lang: { source: tLang (Es), target: sLang (En) }
        // }
        // Wait, if lang.source = Es, lang.target = En.
        // The prompt (Question) should be in SOURCE language (Es) usually?
        // Or is Question the "native" prompt and Answer is "target" to learn?

        // In this app:
        // "Question" is displayed to user.
        // "Answer" is what they have to build/scramble.

        // If I want to learn SPANISH.
        // Prompt should be ENGLISH. (e.g. "The cat is black")
        // I have to build "El gato es negro".

        // So Question = English ("The cat is black").
        // Answer = Spanish ("El gato es negro").

        // Logic in implementation:
        // q = example.sentence ("The cat is black" - En)
        // a = example.translation ("El gato es negro" - Es)

        // So Question IS English. Correct.
        // Answer IS Spanish. Correct.

        expect(item.question).toBe('The cat is black');
        expect(item.answer).toBe('El gato es negro');
    });
});

