import type { GameContentParams, GameItem, IContentStrategy } from '../interfaces';
import { wordsApi, type Word, type Example } from '../../../../infrastructure/api/words';
import { normalizeLanguageCode } from '../../../utils/language';

export class DatabaseContentStrategy implements IContentStrategy {
    async validateAvailability(): Promise<boolean> {
        // Always available if the app is running (assuming DB is up)
        return true;
    }

    async fetchItems(config: GameContentParams['config']): Promise<GameItem[]> {
        // For scramble mode, use specialized fetching
        if (config?.gameMode === 'scramble') {
            return this.fetchScrambleItems(config);
        }

        try {
            const limit = config?.limit || 20;
            const reqSource = config?.language?.source;
            const reqTarget = config?.language?.target;

            // Determine content type based on game mode
            // STRICT RULE: Only 'scramble' mode allows phrases. All others must be words.
            // Note: 'scramble' is handled above and returns early, so we are guaranteed to be in a word-only mode here.
            const typeFilter: 'word' | 'phrase' | undefined = 'word';

            // 1. Forward Fetch: Search exactly as requested
            const fwdPromise = wordsApi.getAll({
                take: limit,
                sourceLanguage: reqSource,
                targetLanguage: reqTarget,
                type: typeFilter
            });

            // 2. Reverse Fetch: Search for the opposite to support "Backwards" learning
            let revPromise: Promise<{ items: Word[]; total: number }> | undefined;

            if ((reqSource || reqTarget) && reqSource !== reqTarget) {
                revPromise = wordsApi.getAll({
                    take: limit,
                    sourceLanguage: reqTarget,
                    targetLanguage: reqSource,
                    type: typeFilter
                });
            }

            const [fwdRes, revRes] = await Promise.all([
                fwdPromise,
                revPromise || Promise.resolve({ items: [], total: 0 })
            ]);

            const items: GameItem[] = [];

            fwdRes.items.forEach(word => {
                items.push(this.mapToGameItem(word, false));
            });

            revRes.items.forEach(word => {
                if (word.definition) {
                    items.push(this.mapToGameItem(word, true));
                }
            });

            return items.sort(() => 0.5 - Math.random()).slice(0, limit);

        } catch (error) {
            console.error('Failed to fetch words from DB:', error);
            return [];
        }
    }

    /**
     * Fetch items specifically for Scramble mode.
     * Combines: phrases (type='phrase') + word examples
     */
    private async fetchScrambleItems(config: GameContentParams['config']): Promise<GameItem[]> {
        try {
            const limit = config?.limit || 20;
            const reqSource = config?.language?.source;
            const reqTarget = config?.language?.target;

            // Fetch phrases directly
            const phrasesPromise = wordsApi.getAll({
                take: limit,
                type: 'phrase',
                sourceLanguage: reqSource,
                targetLanguage: reqTarget
            });

            // Fetch words (to get their examples)
            const wordsPromise = wordsApi.getAll({
                take: limit * 2, // Get more to have enough examples
                type: 'word',
                sourceLanguage: reqSource,
                targetLanguage: reqTarget
            });

            const [phrasesRes, wordsRes] = await Promise.all([phrasesPromise, wordsPromise]);

            const items: GameItem[] = [];

            // Map phrases directly (text = sentence, definition = translation)
            phrasesRes.items.forEach(phrase => {
                items.push(this.mapToGameItem(phrase, false));
            });

            // Extract examples from words and convert to GameItems
            wordsRes.items.forEach(word => {
                if (word.examples && word.examples.length > 0) {
                    word.examples.forEach(example => {
                        items.push(this.mapExampleToGameItem(example, word));
                    });
                }
            });

            // Filter out items with less than 3 words for scramble mode
            const filteredItems = items.filter(item => {
                const wordCount = item.answer.trim().split(/\s+/).length;
                return wordCount >= 3;
            });

            // Shuffle and limit
            return filteredItems.sort(() => 0.5 - Math.random()).slice(0, limit);

        } catch (error) {
            console.error('Failed to fetch scramble items from DB:', error);
            return [];
        }
    }

    /**
     * Map a word's example sentence to a GameItem for Scramble mode.
     */
    private mapExampleToGameItem(example: Example, parentWord: Word): GameItem {
        const sourceLang = parentWord.sourceLanguage || 'en';
        const targetLang = parentWord.targetLanguage || 'en';

        return {
            id: example.id,
            question: example.sentence,
            answer: example.translation || example.sentence, // Fallback to sentence if no translation
            context: `Related to: ${parentWord.text}`,
            source: 'db',
            type: 'phrase',
            lang: {
                source: normalizeLanguageCode(sourceLang),
                target: normalizeLanguageCode(targetLang)
            },
            originalData: { example, parentWord }
        };
    }

    private mapToGameItem(word: Word, swap: boolean): GameItem {
        const sourceLang = word.sourceLanguage || 'en';
        const targetLang = word.targetLanguage || 'en';

        return {
            id: word.id,
            question: swap ? (word.definition || '???') : word.text,
            answer: swap ? word.text : (word.definition || 'No definition'),
            context: word.context || (word.examples && word.examples.length > 0 ? word.examples[0].sentence : undefined),
            audioUrl: swap ? undefined : word.pronunciation,
            imageUrl: word.imageUrl,
            source: 'db',
            type: word.type === 'phrase' ? 'phrase' : 'word',
            lang: {
                source: normalizeLanguageCode(swap ? targetLang : sourceLang),
                target: normalizeLanguageCode(swap ? sourceLang : targetLang)
            },
            originalData: word
        };
    }
}

