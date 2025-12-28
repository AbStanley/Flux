export interface IAIService {
    /**
     * Generates text based on a prompt.
     * @param prompt The input prompt.
     * @returns The generated text.
     */
    generateText(prompt: string): Promise<string>;

    /**
     * Translates text to a target language.
     * @param text The text to translate.
     * @param targetLanguage The language code (e.g., 'en', 'es', 'fr'). Defaults to user preference or 'en'.
     * @returns The translated text.
     */
    translateText(text: string, targetLanguage?: string, context?: string, sourceLanguage?: string): Promise<string>;

    /**
     * Checks if the service is available/healthy.
     */
    checkHealth(): Promise<boolean>;

    /**
     * Get available models (specific to the service).
     */
    getAvailableModels(): Promise<string[]>;
}
