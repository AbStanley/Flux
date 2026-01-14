
// actually I'll stick to standard Promise<T> and throw errors for now to keep it simple as per plan.

export interface AnkiConnectRequest {
    action: string;
    version: number;
    params?: any;
}

export interface AnkiConnectResponse<T> {
    result: T;
    error: string | null;
}

export class AnkiService {
    private readonly baseUrl: string = '/anki';
    private readonly version = 6;

    constructor(customUrl?: string) {
        if (customUrl) this.baseUrl = customUrl;
    }

    /**
     * Generic wrapper for AnkiConnect calls
     */
    private async invoke<T>(action: string, params: any = {}): Promise<T> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // AnkiConnect might be picky, usually generic fetch works
                },
                body: JSON.stringify({
                    action,
                    version: this.version,
                    params
                })
            });

            if (!response.ok) {
                throw new Error(`AnkiConnect HTTP Error: ${response.status} ${response.statusText}`);
            }

            const data: AnkiConnectResponse<T> = await response.json();

            if (data.error) {
                throw new Error(`AnkiConnect Error: ${data.error}`);
            }

            return data.result;

        } catch (error) {
            // Rethrow or wrap
            // For now, let's allow it to bubble up so the UI can handle "Connection Failed"
            throw error;
        }
    }

    /**
     * Check if AnkiConnect is available
     */
    async ping(): Promise<boolean> {
        try {
            // "version" action is a good way to ping
            await this.invoke('version');
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get list of all deck names
     */
    async getDeckNames(): Promise<string[]> {
        return this.invoke<string[]>('deckNames');
    }

    /**
     * Get all model (note type) names
     */
    async getModelNames(): Promise<string[]> {
        return this.invoke<string[]>('modelNames');
    }

    /**
     * Get fields for a specific model
     */
    async getModelFieldNames(modelName: string): Promise<string[]> {
        return this.invoke<string[]>('modelFieldNames', { modelName });
    }

    /**
     * Find cards by query (e.g., "deck:MyDeck")
     */
    async findCards(query: string): Promise<number[]> {
        return this.invoke<number[]>('findCards', { query });
    }

    /**
     * Get specific info for a list of cards
     */
    async getCardsInfo(cards: number[]): Promise<AnkiCardInfo[]> {
        return this.invoke<AnkiCardInfo[]>('cardsInfo', { cards });
    }
}

export interface AnkiCardInfo {
    cardId: number;
    fields: Record<string, { value: string; order: number }>;
    fieldOrder: number;
    question: string;
    answer: string;
    modelName: string;
    ordinal: number;
    deckName: string;
    css: string;
    // ... other fields as needed
}

export const ankiService = new AnkiService();
