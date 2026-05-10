/* eslint-disable @typescript-eslint/no-unused-vars */
import type { IAIService, RichTranslationResult, RichConjugationsResult } from '../../core/interfaces/IAIService';
import type { PartOfSpeech } from '../../core/types/Linguistics';

export class MockAIService implements IAIService {
    async generateText(prompt: string, options?: { onProgress?: (chunk: string, fullText: string) => void, signal?: AbortSignal }): Promise<string> {
        console.log(`[MockAI] Generating text for prompt: ${prompt}`);

        const responseText = `[Mock Generated] content based on: "${prompt}". This is a placeholder for actual AI generation.`;

        if (options?.onProgress) {
            // Simulate streaming
            const words = responseText.split(' ');
            let accumulated = '';

            for (const word of words) {
                if (options.signal?.aborted) {
                    throw new Error('Aborted');
                }
                await new Promise(resolve => setTimeout(resolve, 100)); // Simulate token delay
                accumulated += (accumulated ? ' ' : '') + word;
                options.onProgress(word + ' ', accumulated);
            }
            return accumulated;
        } else {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
            return responseText;
        }
    }

    async translateText(text: string, targetLanguage: string = 'en', context?: string, sourceLanguage?: string, _signal?: AbortSignal): Promise<string | { response: string; sourceLanguage?: string }> {
        console.log(`[MockAI] Translating "${text}" from ${sourceLanguage || 'Auto'} to ${targetLanguage} (Context: ${context || 'None'})`);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        return `[Translated to ${targetLanguage}]: ${text}`;
    }

    async explainText(text: string, targetLanguage: string = 'en', context?: string, _sourceLanguage?: string, _signal?: AbortSignal): Promise<string> {
        console.log(`[MockAI] Explaining "${text}" in ${targetLanguage} (Context: ${context || 'None'})`);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        return `[Explanation in ${targetLanguage}]: This is a mock explanation for "${text}".`;
    }

    async getRichTranslation(text: string, _targetLanguage?: string, _context?: string, _sourceLanguage?: string, _signal?: AbortSignal): Promise<RichTranslationResult> {
        console.log(`[MockAI] Getting rich translation for "${text}" to ${_targetLanguage} (Context: ${_context})`);
        return {
            translation: `[Mock Rich] ${text}`,
            segment: text,
            grammar: {
                partOfSpeech: "noun" as PartOfSpeech,
                explanation: "Mock explanation"
            },
            examples: [],
            alternatives: ["Mock alt 1", "Mock alt 2"]
        };
    }

    async getConjugations(_infinitive: string, _sourceLanguage: string, _signal?: AbortSignal): Promise<RichConjugationsResult> {
        await new Promise(resolve => setTimeout(resolve, 900));
        return { conjugations: {} };
    }

    async getConjugationsStream(
        _infinitive: string,
        _sourceLanguage: string,
        opts: {
            signal?: AbortSignal;
            onTense: (tense: string, rows: Array<{ pronoun: string; conjugation: string }>) => void;
        },
    ): Promise<RichConjugationsResult> {
        await new Promise(resolve => setTimeout(resolve, 300));
        const rows = [{ pronoun: "I", conjugation: "mock" }];
        opts.onTense("Present", rows);
        await new Promise(resolve => setTimeout(resolve, 300));
        opts.onTense("Past", rows);
        return { conjugations: { Present: rows, Past: rows } };
    }

    async getRichTranslationStream(
        text: string,
        opts: {
            targetLanguage?: string;
            context?: string;
            sourceLanguage?: string;
            signal?: AbortSignal;
            onPartial: (partial: Partial<RichTranslationResult>) => void;
        },
    ): Promise<RichTranslationResult> {
        const final = await this.getRichTranslation(text, opts.targetLanguage, opts.context);
        opts.onPartial({ segment: final.segment, translation: final.translation });
        await new Promise(resolve => setTimeout(resolve, 200));
        opts.onPartial({ ...final, alternatives: [] });
        await new Promise(resolve => setTimeout(resolve, 200));
        opts.onPartial(final);
        return final;
    }

    async checkHealth(): Promise<boolean> {
        return true;
    }

    async getAvailableModels(): Promise<string[]> {
        return ["mock-model"];
    }

    getModel(): string {
        return "mock-model";
    }

    setModel(_model: string): void {
        // No-op for mock service
    }

    async generateContent(params: {
        topic?: string;
        sourceLanguage: string;
        isLearningMode: boolean;
        proficiencyLevel: import('../../core/types/AIConfig').ProficiencyLevel;
        contentType: import('../../core/types/AIConfig').ContentType;
    }): Promise<string> {
        console.log(`[MockAI] Generating content for topic: ${params.topic}, level: ${params.proficiencyLevel}, type: ${params.contentType}`);
        await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate generation delay
        return `[Mock Content] This is a mock ${params.contentType} about ${params.topic || 'a general topic'} at ${params.proficiencyLevel} level.`;
    }

    async generateGameContent(params: {
        topic: string;
        level: string;
        mode: string;
        sourceLanguage: string;
        targetLanguage: string;
        limit?: number;
    }): Promise<Array<{ question?: string; answer?: string; context?: string; type?: 'word' | 'phrase' }>> {
        console.log(`[MockAI] Generating game content for topic: ${params.topic}, mode: ${params.mode}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return [{ question: "Mock?", answer: "Mock!", context: "Just mocking.", type: "word" }];
    }
}
