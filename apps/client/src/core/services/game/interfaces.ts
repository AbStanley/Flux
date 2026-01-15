export interface GameItem {
    id: string;
    /** The main prompt shown to the user (e.g., word in native language, or sentence to translate) */
    question: string;
    /** The expected answer (e.g., translation, correct sentence structure) */
    answer: string;
    /** Additional context or example usage */
    context?: string;
    /** URL to audio pronunciation */
    audioUrl?: string;
    /** URL to related image */
    imageUrl?: string;
    /** Source of the item for tracking back (e.g. 'anki', 'db', 'ai') */
    source: 'anki' | 'db' | 'ai';
    /** Raw data for specific handling (e.g. Anki card ID for reviewing) */
    originalData?: unknown;
    /** Type of content */
    type: 'word' | 'start' | 'phrase';
    /** Language direction metadata */
    lang?: {
        source: string; // e.g., 'en'
        target: string; // e.g., 'es'
    };
}

export interface GameContentParams {
    source: 'anki' | 'db' | 'ai';
    /** Specific constraints */
    config?: {
        /** For Anki: Deck Name. For DB: Filter tags? */
        collectionId?: string;
        limit?: number;
        language?: {
            source?: string;
            target?: string;
        }
        /** Only fetch items capable of this game mode? */
        gameMode?: 'multiple-choice' | 'build-word' | 'dictation' | 'scramble';
        timerEnabled?: boolean;

        // Anki Specific
        ankiFieldSource?: string;
        ankiFieldTarget?: string;
    };
}

export interface IContentStrategy {
    fetchItems(params: GameContentParams['config']): Promise<GameItem[]>;
    validateAvailability(): Promise<boolean>;
    syncProgress?(items: GameItem[], results: Record<string, boolean>): Promise<void>;
}
