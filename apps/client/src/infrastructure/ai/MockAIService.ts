import type { IAIService } from '../../core/interfaces/IAIService';

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

    async translateText(text: string, targetLanguage: string = 'en', context?: string): Promise<string> {
        console.log(`[MockAI] Translating "${text}" to ${targetLanguage} (Context: ${context || 'None'})`);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        return `[Translated to ${targetLanguage}]: ${text}`;
    }

    async getRichTranslation(text: string, _targetLanguage?: string, _context?: string): Promise<import('../../core/interfaces/IAIService').RichTranslationResult> {
        console.log(`[MockAI] Getting rich translation for "${text}" to ${_targetLanguage} (Context: ${_context})`);
        return {
            translation: `[Mock Rich] ${text}`,
            segment: text,
            grammar: {
                partOfSpeech: "noun",
                explanation: "Mock explanation"
            },
            examples: [],
            alternatives: ["Mock alt 1", "Mock alt 2"]
        };
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
}
