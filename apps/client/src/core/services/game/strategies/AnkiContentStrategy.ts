import type { IContentStrategy, GameItem, GameContentParams } from '../interfaces';
import { ankiService } from '@/infrastructure/external/anki/AnkiService';

export class AnkiContentStrategy implements IContentStrategy {
    async validateAvailability(): Promise<boolean> {
        return ankiService.ping();
    }

    async fetchItems(config: GameContentParams['config']): Promise<GameItem[]> {
        if (!config?.collectionId) {
            throw new Error("Deck name (collectionId) is required for Anki strategy.");
        }

        const deckName = config.collectionId;
        const limit = config.limit || 10;

        // 1. Find cards
        const cardIds = await ankiService.findCards(`deck:"${deckName}"`);

        if (cardIds.length === 0) {
            return [];
        }

        // 2. Shuffle and pick random subset
        const selectedIds = this.shuffleArray(cardIds).slice(0, limit);

        // 3. Fetch details
        const cardsInfo = await ankiService.getCardsInfo(selectedIds);

        // 4. Map to GameItems
        // TODO: We need field mapping configuration from the user.
        // For MVP/First Pass, we might guess or expect keys in 'config' if we added them?
        // The current GameContentParams interface (from step 41) doesn't have explicit field mapping keys yet.
        // But the user plan mentioned "Field Mapping".
        // I will assume the config object might unknowingly carry extra props or I'll add hardcoded logic/dynamic guessing for now 
        // until we update the interface officially. 
        // Wait, I can cast config to any to access extra props if needed, or better, update the plan to update the interface.
        // The user plan said: update useGameStore to store ankiFieldQuestion. 
        // For this file, I'll access them from config assuming they are passed.

        // Let's assume passed config has: { ankiFieldSource?: string, ankiFieldTarget?: string }
        // If not, we try to grab first two fields.

        return cardsInfo.map(info => {
            // Basic heuristic if no mapping provided
            const fieldNames = Object.keys(info.fields);
            // Sort by order if possible, but the API returns Record.
            // But we have info.fields[key].order
            const sortedFields = fieldNames.sort((a, b) => info.fields[a].order - info.fields[b].order);

            const invalidConfig = config as any;
            const sourceField = invalidConfig.ankiFieldSource || sortedFields[0];
            const targetField = invalidConfig.ankiFieldTarget || sortedFields[1] || sortedFields[0];

            const question = this.stripHtml(info.fields[sourceField]?.value || "???");
            const answer = this.stripHtml(info.fields[targetField]?.value || "???");

            // Extract audio/image?
            // Anki format: [sound:filename.mp3] <img src="filename.jpg">
            // For now, we just pass text.

            return {
                id: info.cardId.toString(),
                question,
                answer,
                source: 'anki',
                type: 'word', // Defaulting to word, could be phrase
                originalData: info,
                lang: {
                    source: config.language?.source || 'unknown',
                    target: config.language?.target || 'unknown'
                }
            };
        });
    }

    private shuffleArray<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    private stripHtml(html: string): string {
        // Basic strip
        return html.replace(/<[^>]*>?/gm, '');
    }
}
