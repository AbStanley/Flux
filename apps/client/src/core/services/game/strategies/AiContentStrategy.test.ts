import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiContentStrategy } from './AiContentStrategy';
import { ollamaService } from '@/infrastructure/ai/OllamaService';

// Mock ollamaService
vi.mock('@/infrastructure/ai/OllamaService', () => ({
    ollamaService: {
        checkHealth: vi.fn(),
        generateText: vi.fn(),
    }
}));

describe('AiContentStrategy', () => {
    let strategy: AiContentStrategy;

    beforeEach(() => {
        strategy = new AiContentStrategy();
        vi.clearAllMocks();
    });

    it('should validate availability checking health', async () => {
        vi.mocked(ollamaService.checkHealth).mockResolvedValue(true);
        expect(await strategy.validateAvailability()).toBe(true);
        expect(ollamaService.checkHealth).toHaveBeenCalled();
    });

    it('should throw error if no topic provided', async () => {
        await expect(strategy.fetchItems({} as any)).rejects.toThrow("Topic is required");
    });

    it('should parse valid JSON response from AI', async () => {
        const mockResponse = `
        [
            { "question": "Casa", "answer": "House", "context": "Mi casa es grande", "type": "word" }
        ]
        `;
        vi.mocked(ollamaService.generateText).mockResolvedValue(mockResponse);

        const items = await strategy.fetchItems({
            aiTopic: 'Real Estate',
            language: { source: 'Spanish', target: 'English' }
        });

        expect(items).toHaveLength(1);
        expect(items[0].question).toBe('Casa');
        expect(items[0].answer).toBe('House');
        expect(items[0].source).toBe('ai');
    });

    it('should generate valid story segments', async () => {
        const mockResponse = `
        [
            { "context": "Once upon a time", "question": "time", "answer": "tiempo", "type": "phrase" }
        ]
        `;
        vi.mocked(ollamaService.generateText).mockResolvedValue(mockResponse);

        const items = await strategy.fetchItems({
            aiTopic: 'Magic',
            gameMode: 'story'
        });

        expect(items).toHaveLength(1);
        expect(items[0].context).toBe('Once upon a time');
        expect(items[0].question).toBe('time');
    });

    it('should generate valid scramble sentences', async () => {
        const mockResponse = `
        [
            { "question": "The dog runs.", "answer": "El perro corre.", "context": "Simple sentence", "type": "phrase" }
        ]
        `;
        vi.mocked(ollamaService.generateText).mockResolvedValue(mockResponse);

        const items = await strategy.fetchItems({
            aiTopic: 'Animals',
            gameMode: 'scramble',
            aiLevel: 'beginner',
            language: { source: 'Spanish', target: 'English' }
        });

        expect(items).toHaveLength(1);
        expect(items[0].answer).toBe('El perro corre.');
        // Verify language metadata is swapped (Source=English, Target=Spanish)
        expect(items[0].lang?.source).toBe('en-US');
        expect(items[0].lang?.target).toBe('es-ES');

        // Verify call args to ensure correct prompt/model passed
        expect(ollamaService.generateText).toHaveBeenCalledWith(
            expect.stringContaining('scramble'),
            undefined // No model specified in this call
        );
    });

    it('should convert language codes to full names in prompt', async () => {
        const mockResponse = JSON.stringify([{ question: "Hello", answer: "Hola" }]);
        ollamaService.generateText = vi.fn().mockResolvedValue(mockResponse);

        await strategy.fetchItems({
            aiTopic: 'Test',
            language: { source: 'en', target: 'es' } // Codes
        });

        // Prompt should contain full names
        expect(ollamaService.generateText).toHaveBeenCalledWith(
            expect.stringContaining('"question": The content in English'),
            undefined
        );
        expect(ollamaService.generateText).toHaveBeenCalledWith(
            expect.stringContaining('"answer": The translation in Spanish'),
            undefined
        );
    });

    it('should handle AI response with extra text', async () => {
        const mockResponse = `
        Here is your JSON:
        [
            { "question": "Gato", "answer": "Cat", "type": "word" }
        ]
        Hope that helps!
        `;
        vi.mocked(ollamaService.generateText).mockResolvedValue(mockResponse);

        const items = await strategy.fetchItems({ aiTopic: 'Pets' });
        expect(items).toHaveLength(1);
        expect(items[0].question).toBe('Gato');
    });

    it('should throw error if all items are filtered (duplicates)', async () => {
        const mockResponse = JSON.stringify([
            { question: "Same", answer: "Same", type: "word" },
            { question: "Test", answer: "test", type: "word" }
        ]);

        ollamaService.generateText = vi.fn().mockResolvedValue(mockResponse);

        await expect(strategy.fetchItems({
            aiTopic: 'Fail',
            language: { source: 'English', target: 'Spanish' }
        })).rejects.toThrow(/AI generated 2 items but all were invalid/);
    });

    it('should throw error on invalid JSON', async () => {
        vi.mocked(ollamaService.generateText).mockResolvedValue("Not JSON");
        await expect(strategy.fetchItems({ aiTopic: 'Test' })).rejects.toThrow("Invalid format from AI");
    });
});
