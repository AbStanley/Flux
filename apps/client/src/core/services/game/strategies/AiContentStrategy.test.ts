import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiContentStrategy } from './AiContentStrategy';
import { serverAIService } from '@/infrastructure/ai/ServerAIService';

// Mock serverAIService
vi.mock('@/infrastructure/ai/ServerAIService', () => ({
    serverAIService: {
        checkHealth: vi.fn(),
        generateGameContent: vi.fn(),
        setModel: vi.fn(),
    }
}));

describe('AiContentStrategy', () => {
    let strategy: AiContentStrategy;

    beforeEach(() => {
        strategy = new AiContentStrategy();
        vi.clearAllMocks();
    });

    it('should validate availability checking health', async () => {
        vi.mocked(serverAIService.checkHealth).mockResolvedValue(true);
        expect(await strategy.validateAvailability()).toBe(true);
        expect(serverAIService.checkHealth).toHaveBeenCalled();
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
        vi.mocked(serverAIService.generateGameContent).mockResolvedValue(mockResponse);

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
        vi.mocked(serverAIService.generateGameContent).mockResolvedValue(mockResponse);

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
        vi.mocked(serverAIService.generateGameContent).mockResolvedValue(mockResponse);

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
        expect(serverAIService.generateGameContent).toHaveBeenCalledWith(
            expect.objectContaining({ mode: 'scramble', topic: 'Animals' })
        );
    });

    it('should convert language codes to full names in prompt', async () => {
        const mockResponse = JSON.stringify([{ question: "Hello", answer: "Hola" }]);
        serverAIService.generateGameContent = vi.fn().mockResolvedValue(mockResponse);

        await strategy.fetchItems({
            aiTopic: 'Test',
            language: { source: 'en', target: 'es' } // Codes
        });

        // Backend handles prompt, we just check args passed to service
        expect(serverAIService.generateGameContent).toHaveBeenCalledWith(
            expect.objectContaining({ sourceLanguage: 'English', targetLanguage: 'Spanish' })
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
        vi.mocked(serverAIService.generateGameContent).mockResolvedValue(mockResponse);

        const items = await strategy.fetchItems({ aiTopic: 'Pets' });
        expect(items).toHaveLength(1);
        expect(items[0].question).toBe('Gato');
    });

    it('should throw error if all items are filtered (duplicates)', async () => {
        const mockResponse = JSON.stringify([
            { question: "Same", answer: "Same", type: "word" },
            { question: "Test", answer: "test", type: "word" }
        ]);

        serverAIService.generateGameContent = vi.fn().mockResolvedValue(mockResponse);

        await expect(strategy.fetchItems({
            aiTopic: 'Fail',
            language: { source: 'English', target: 'Spanish' }
        })).rejects.toThrow(/AI generated 2 items but all were invalid/);
    });

    it('should throw error on invalid JSON', async () => {
        vi.mocked(serverAIService.generateGameContent).mockResolvedValue("Not JSON");
        await expect(strategy.fetchItems({ aiTopic: 'Test' })).rejects.toThrow("Invalid format from AI");
    });
});
