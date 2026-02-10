import { Test, TestingModule } from '@nestjs/testing';
import { OllamaService } from './ollama.service';

describe('OllamaService', () => {
  let service: OllamaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OllamaService],
    }).compile();

    service = module.get<OllamaService>(OllamaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateExamples', () => {
    it('should return examples when model returns a JSON array', async () => {
      const mockResponse = {
        message: {
          content: JSON.stringify([
            { sentence: 'Test sentence', translation: 'Test translation' },
          ]),
        },
      };

      // Access private ollama property for mocking
      (service as unknown as { ollama: unknown }).ollama = {
        chat: jest.fn().mockResolvedValue(mockResponse),
        list: jest.fn().mockResolvedValue({ models: [{ name: 'llama3' }] }),
      };

      const result = await service.generateExamples({
        word: 'test',
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });

      expect(result).toHaveLength(1);
      expect(result[0].sentence).toBe('Test sentence');
    });

    it('should return examples when model wraps JSON array in markdown', async () => {
      const mockResponse = {
        message: {
          content:
            '```json\n[\n  {"sentence": "Test", "translation": "Prueba"}\n]\n```',
        },
      };

      (service as unknown as { ollama: unknown }).ollama = {
        chat: jest.fn().mockResolvedValue(mockResponse),
        list: jest.fn().mockResolvedValue({ models: [{ name: 'llama3' }] }),
      };

      const result = await service.generateExamples({
        word: 'test',
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });

      expect(result).toHaveLength(1);
      expect(result[0].sentence).toBe('Test');
    });

    it('should return examples when model returns a JSON object with examples array', async () => {
      // Some models might return this even if asked for an array
      const mockResponse = {
        message: {
          content: JSON.stringify({
            examples: [
              { sentence: 'Test nested', translation: 'Prueba anidada' },
            ],
          }),
        },
      };

      (service as unknown as { ollama: unknown }).ollama = {
        chat: jest.fn().mockResolvedValue(mockResponse),
        list: jest.fn().mockResolvedValue({ models: [{ name: 'llama3' }] }),
      };

      const result = await service.generateExamples({
        word: 'test',
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });

      expect(result).toHaveLength(1);
      expect(result[0].sentence).toBe('Test nested');
    });

    it('should return examples when model returns a single object instead of array', async () => {
      const mockResponse = {
        message: {
          content: JSON.stringify({ sentence: 'Single', translation: 'Solo' }),
        },
      };

      (service as unknown as { ollama: unknown }).ollama = {
        chat: jest.fn().mockResolvedValue(mockResponse),
        list: jest.fn().mockResolvedValue({ models: [{ name: 'llama3' }] }),
      };

      const result = await service.generateExamples({
        word: 'test',
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });

      expect(result).toHaveLength(1);
      expect(result[0].sentence).toBe('Single');
    });

    it('should return empty array when model returns invalid JSON', async () => {
      const mockResponse = {
        message: {
          content: 'Not JSON at all',
        },
      };

      (service as unknown as { ollama: unknown }).ollama = {
        chat: jest.fn().mockResolvedValue(mockResponse),
        list: jest.fn().mockResolvedValue({ models: [{ name: 'llama3' }] }),
      };

      const result = await service.generateExamples({
        word: 'test',
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });

      expect(result).toEqual([]);
    });

    it('should handle response with extra text and markdown', async () => {
      const mockResponse = {
        message: {
          content:
            'Here are the examples:\n\n```json\n[{"sentence": "Extra", "translation": "Extra"}]\n```\nHope this helps!',
        },
      };

      (service as unknown as { ollama: unknown }).ollama = {
        chat: jest.fn().mockResolvedValue(mockResponse),
        list: jest.fn().mockResolvedValue({ models: [{ name: 'llama3' }] }),
      };

      const result = await service.generateExamples({
        word: 'test',
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });

      expect(result).toHaveLength(1);
      expect(result[0].sentence).toBe('Extra');
    });
  });
});
