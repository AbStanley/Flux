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

            // 1b. Reverse Fetch: Phrases (Search for opposite direction)
            let revPhrasesPromise: Promise<{ items: Word[]; total: number }> | undefined;
            if ((reqSource || reqTarget) && reqSource !== reqTarget) {
                revPhrasesPromise = wordsApi.getAll({
                    take: limit,
                    type: 'phrase',
                    sourceLanguage: reqTarget,
                    targetLanguage: reqSource
                });
            }

            // Fetch words (to get their examples)
            const wordsPromise = wordsApi.getAll({
                take: limit * 2, // Get more to have enough examples
                type: 'word',
                sourceLanguage: reqSource,
                targetLanguage: reqTarget
            });

            // 2b. Reverse Fetch: Words (for examples)
            let revWordsPromise: Promise<{ items: Word[]; total: number }> | undefined;
            if ((reqSource || reqTarget) && reqSource !== reqTarget) {
                revWordsPromise = wordsApi.getAll({
                    take: limit * 2,
                    type: 'word',
                    sourceLanguage: reqTarget,
                    targetLanguage: reqSource
                });
            }

            const [phrasesRes, wordsRes, revPhrasesRes, revWordsRes] = await Promise.all([
                phrasesPromise,
                wordsPromise,
                revPhrasesPromise || Promise.resolve({ items: [], total: 0 }),
                revWordsPromise || Promise.resolve({ items: [], total: 0 })
            ]);

            const items: GameItem[] = [];

            // Map phrases directly (text = sentence, definition = translation)
            phrasesRes.items.forEach(phrase => {
                items.push(this.mapToGameItem(phrase, false));
            });
            revPhrasesRes.items.forEach(phrase => {
                items.push(this.mapToGameItem(phrase, true));
            });

            // Extract examples from words and convert to GameItems
            wordsRes.items.forEach(word => {
                if (word.examples && word.examples.length > 0) {
                    word.examples.forEach(example => {
                        items.push(this.mapExampleToGameItem(example, word, false));
                    });
                }
            });
            revWordsRes.items.forEach(word => {
                if (word.examples && word.examples.length > 0) {
                    word.examples.forEach(example => {
                        items.push(this.mapExampleToGameItem(example, word, true));
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
    private mapExampleToGameItem(example: Example, parentWord: Word, swap: boolean = false): GameItem {
        const sourceLang = parentWord.sourceLanguage || 'en';
        const targetLang = parentWord.targetLanguage || 'en';

        // If swap is true, we want the "Prompt" to be the Translation (Source) and "Answer" to be the Sentence (Target)
        // Wait, for scramble:
        // Normal: Question = Translation, Answer = Sentence (Scramble target)
        // Swap (Reverse Fetch): Word is Target->Source.
        // We want to learn Source (which is user's Target).
        // So Answer must be Source.

        let q = example.translation || example.sentence;
        let a = example.sentence;
        let sLang = sourceLang;
        let tLang = targetLang;

        if (swap) {
            // Word was fetched as Target->Source.
            // sLang=Target, tLang=Source.
            // We want to learn tLang (Source).
            // Answer = example.sentence (which is in sLang/Target... wait)
            // Let's look at `mapToGameItem` for reference.
            // mapToGameItem(swap=true): Question=Word.text (Target), Answer=Word.def (Source).
            // But for scramble, we need a Sentence.
            // Example usually has: sentence (Source), translation (Target).

            // If I fetch distinct "English->Spanish" words.
            // Word: Cat (en), Gato (es). Example: "The cat is black", "El gato es negro".
            // Normal: Answer="El gato es negro", Question="The cat is black".

            // If I fetch distinct "Spanish->English" words (Reverse Fetch).
            // Word: Gato (es), Cat (en). Example: "El gato es negro", "The cat is black".
            // We want to learn Spanish (Source).
            // Answer="El gato es negro". Question="The cat is black".

            // Since the detailed structure of Example doesn't explicitly have 'source/target' fields but assumes relationship to parent:
            // We just need to ensure 'answer' is the language we are learning.

            // If swap=true, parentWord is Target->Source.
            // We are learning Target (which is parent's Source).
            // So Answer should be parent's Source side.
            // In the DB, `example.sentence` is usually associated with the word's source language.
            // So even if we swapped the fetch, `example.sentence` is likely the "Source" language text.

            // So:
            // Normal (En->Es): Word En. Example Sentence (En) "Cat", Translation (Es) "Gato". 
            // WAIT: Usually Example Sentence is in the Foreign Language (Source)?
            // Let's check `EditWordDialog` or usage. 
            // EditWordDialog: "Word / Phrase" (formData.text). `sourceLanguage` = Foreign. `targetLanguage` = Native.
            // Example: Sentence (Foreign), Translation (Native).

            // OK.
            // Normal Fetch (Source=Spanish, Target=English).
            // Word: Gato (Es). 
            // Example: "El gato..." (Es), "The cat..." (En).
            // We want to learn Spanish.
            // Answer (Scramble) = "El gato..." (Es).
            // Question (Prompt) = "The cat..." (En).

            // Reverse Fetch (Source=English, Target=Spanish).
            // User wants to learn Spanish. But we found a word stored as English->Spanish.
            // Word: Cat (En). 
            // Example: "The cat..." (En). Translation: "El gato..." (Es).
            // We want to learn Spanish.
            // Answer (Scramble) = Translation "El gato..." (Es).
            // Question (Prompt) = Sentence "The cat..." (En).

            q = example.sentence; // English
            a = example.translation || example.sentence; // Spanish

            // Swap languages for metadata
            sLang = targetLang;
            tLang = sourceLang;
        }

        return {
            id: example.id,
            question: q,
            answer: a,
            context: `Related to: ${parentWord.text}`,
            source: 'db',
            type: 'phrase',
            lang: {
                source: normalizeLanguageCode(tLang), // We want Prompt to be Native
                target: normalizeLanguageCode(sLang)  // We want Answer to be Foreign
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

