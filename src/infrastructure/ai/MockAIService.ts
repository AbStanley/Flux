import type { IAIService } from '../../core/interfaces/IAIService';

export class MockAIService implements IAIService {
    async generateText(prompt: string): Promise<string> {
        console.log(`[MockAI] Generating text for prompt: ${prompt}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        return `[Mock Generated] content based on: "${prompt}". This is a placeholder for actual AI generation.`;
    }

    async translateText(text: string, targetLanguage: string = 'en'): Promise<string> {
        console.log(`[MockAI] Translating "${text}" to ${targetLanguage}`);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        return `[Translated to ${targetLanguage}]: ${text}`;
    }

    async checkHealth(): Promise<boolean> {
        return true;
    }

    async getAvailableModels(): Promise<string[]> {
        return ["mock-model"];
    }
}
