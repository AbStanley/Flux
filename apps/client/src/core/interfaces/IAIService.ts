import type { ContentType, ProficiencyLevel } from '../types/AIConfig';
import type { GrammaticalGender, GrammaticalTense, PartOfSpeech, TranslationType } from '../types/Linguistics';

export interface RichTranslationResult {
    type?: TranslationType; // Discriminator
    isVerb?: boolean;
    translation: string;
    segment: string;
    // Word-specific
    grammar?: {
        partOfSpeech: PartOfSpeech;
        tense?: GrammaticalTense | string; // Keep string fallback for tenses as they can be complex/varied from AI
        gender?: GrammaticalGender;
        number?: string;
        infinitive?: string;
        explanation: string;
    };
    // Sentence-specific
    syntaxAnalysis?: string;
    grammarRules?: string[];

    examples: Array<{
        sentence: string;
        translation: string;
    }>;
    alternatives: string[];
    conjugations?: {
        [tense: string]: Array<{ pronoun: string; conjugation: string }>;
    };
}

/** On-demand conjugation tables fetched when the user clicks "Show conjugations". */
export interface RichConjugationsResult {
    conjugations: NonNullable<RichTranslationResult['conjugations']>;
}

export interface IAIService {
    /**
     * Generates text based on a prompt.
     * @param prompt The input prompt.
     * @param options Optional configuration for generation (streaming, signal, etc.)
     * @returns The generated text.
     */
    generateText(prompt: string, options?: {
        onProgress?: (chunk: string, fullText: string) => void;
        signal?: AbortSignal;
        [key: string]: unknown
    }): Promise<string>;

    /**
     * Translates text to a target language.
     * @param text The text to translate.
     * @param targetLanguage The language code (e.g., 'en', 'es', 'fr'). Defaults to user preference or 'en'.
     * @returns The translated text.
     */
    translateText(text: string, targetLanguage?: string, context?: string, sourceLanguage?: string): Promise<string | { response: string; sourceLanguage?: string }>;

    /**
     * Helper to get rich translation info with grammar and examples
     */
    getRichTranslation(text: string, targetLanguage?: string, context?: string, sourceLanguage?: string): Promise<RichTranslationResult>;

    /**
     * Streaming variant of getRichTranslation. Calls `onPartial` with a
     * best-effort-parsed partial of the eventual rich result each time the
     * stream reveals a newly-completed field, and returns the final result.
     * The signal is optional and aborts the underlying fetch if provided.
     */
    getRichTranslationStream(
        text: string,
        opts: {
            targetLanguage?: string;
            context?: string;
            sourceLanguage?: string;
            signal?: AbortSignal;
            onPartial: (partial: Partial<RichTranslationResult>) => void;
        },
    ): Promise<RichTranslationResult>;

    /**
     * On-demand conjugation tables. Called when the user clicks "Show
     * conjugations" in the rich details panel.
     */
    getConjugations(infinitive: string, sourceLanguage: string): Promise<RichConjugationsResult>;

    /**
     * Streaming variant — fires `onTense` as each tense's rows land so
     * the UI can render the first table while later ones are still
     * generating. Resolves with the full conjugations object once every
     * tense has either arrived or failed.
     */
    getConjugationsStream(
        infinitive: string,
        sourceLanguage: string,
        opts: {
            signal?: AbortSignal;
            onTense: (tense: string, rows: Array<{ pronoun: string; conjugation: string }>) => void;
        },
    ): Promise<RichConjugationsResult>;

    /**
     * Checks if the service is available/healthy.
     */
    checkHealth(): Promise<boolean>;

    /**
     * Get available models (specific to the service).
     */
    getAvailableModels(): Promise<string[]>;

    /**
     * Get the current model name.
     */
    getModel(): string;

    /**
     * Set the current model name.
     */
    setModel(model: string): void;

    /**
     * Explains text in a target language.
     */
    explainText(text: string, targetLanguage?: string, context?: string, sourceLanguage?: string): Promise<string>;

    /**
     * Generates content with strict parameters.
     */
    generateContent(params: {
        topic?: string;
        sourceLanguage: string;
        isLearningMode: boolean;
        proficiencyLevel: ProficiencyLevel;
        contentType: ContentType
    }): Promise<string>;

    /**
     * Generates game content.
     */
    generateGameContent(params: {
        topic: string;
        level: string;
        mode: string;
        sourceLanguage: string;
        targetLanguage: string;
        limit?: number;
        sourceLangCode?: string;
        targetLangCode?: string;
    }): Promise<Array<{ 
        question?: string; 
        answer?: string; 
        target_text?: string; 
        source_translation?: string;
        target_lang_code?: string;
        source_lang_code?: string;
        context?: string; 
        type?: 'word' | 'phrase' 
    }>>;
}
