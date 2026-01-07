import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OllamaService } from './OllamaService';
import { OllamaTransport } from './OllamaTransport';

// Mock the Transport class
vi.mock('./OllamaTransport');

describe('OllamaService', () => {

    let service: OllamaService;
    let mockTransport: any;

    beforeEach(() => {
        vi.clearAllMocks();


        service = new OllamaService('http://localhost:11434', 'llama3');
        mockTransport = (service as any).transport;
    });

    it('should initialize with correct base URL and model', () => {
        expect(service.getModel()).toBe('llama3');
        expect(OllamaTransport).toHaveBeenCalledWith('http://localhost:11434');
    });

    describe('translateText', () => {
        it('should call transport.generate with correct prompt', async () => {
            const mockResponse = 'Hola mundo';
            mockTransport.generate.mockResolvedValue(mockResponse);

            const result = await service.translateText('Hello world', 'Spanish');

            expect(mockTransport.generate).toHaveBeenCalledWith(
                expect.objectContaining({
                    model: 'llama3',
                    // Verify the prompt contains the key items
                    prompt: expect.stringContaining('Hello world')
                }),
                expect.anything()
            );

            // Check that it calls utils/ResponseParser (implicitly, by result being cleaned)
            expect(result).toBe('Hola mundo');
        });
    });

    describe('getRichTranslation', () => {
        it('should parse JSON response accurately', async () => {
            // Simulate a "noisy" LLM response
            const mockJson = {
                definitions: [{ type: 'noun', definition: 'A greeting' }],
                examples: ['Hello world'],
                synonyms: ['Hi']
            };
            const rawResponse = `Sure! Here is the JSON:\n\`\`\`json\n${JSON.stringify(mockJson)}\n\`\`\``;

            mockTransport.generate.mockResolvedValue(rawResponse);

            const result = await service.getRichTranslation('Hello');

            // Implementation note: getRichTranslation calls normalizeRichTranslation.
            // verifying structure matches what we expect from that normalizer.
            expect(result.definitions).toHaveLength(1);
            expect(result.examples[0]).toEqual(expect.objectContaining({ sentence: 'Hello world' }));
        });

        it('should throw error on invalid JSON', async () => {
            mockTransport.generate.mockResolvedValue('Not a JSON response');

            await expect(service.getRichTranslation('Hello'))
                .rejects
                .toThrow('Failed to parse rich translation');
        });
    });

    describe('checkHealth', () => {
        it('should return true if tags are returned', async () => {
            mockTransport.getTags.mockResolvedValue({ models: [] });
            const result = await service.checkHealth();
            expect(result).toBe(true);
        });

        it('should return false if tags fetch fails', async () => {
            mockTransport.getTags.mockRejectedValue(new Error('Network error'));
            const result = await service.checkHealth();
            expect(result).toBe(false);
        });
    });
});
