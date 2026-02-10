import type { ContentType, ProficiencyLevel } from '../types/AIConfig';
import type { GrammaticalGender, GrammaticalTense, PartOfSpeech, TranslationType } from '../types/Linguistics';

export interface RichTranslationResult {
    type?: TranslationType; // Discriminator
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
    translateText(text: string, targetLanguage?: string, context?: string, sourceLanguage?: string): Promise<string>;

    /**
     * Helper to get rich translation info with grammar and examples
     */
    getRichTranslation(text: string, targetLanguage?: string, context?: string, sourceLanguage?: string): Promise<RichTranslationResult>;

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
    }): Promise<string>;
}
