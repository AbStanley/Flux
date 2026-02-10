import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { OllamaService } from './ollama.service';
import { OllamaClientService } from './ollama-client.service';
import { OllamaTranslationService } from './ollama-translation.service';
import { OllamaGrammarService } from './ollama-grammar.service';
import { OllamaGenerationService } from './ollama-generation.service';

describe('OllamaService', () => {
  let service: OllamaService;
  let generationService: OllamaGenerationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaService,
        {
          provide: OllamaClientService,
          useValue: {
            chat: vi.fn(),
            generate: vi.fn(),
            listTags: vi.fn(),
            ensureModel: vi.fn(),
          },
        },
        {
          provide: OllamaTranslationService,
          useValue: {
            translateText: vi.fn(),
            explainText: vi.fn(),
            getRichTranslation: vi.fn(),
          },
        },
        {
          provide: OllamaGrammarService,
          useValue: {
            analyzeGrammar: vi.fn(),
          },
        },
        {
          provide: OllamaGenerationService,
          useValue: {
            generateExamples: vi.fn(),
            generateContent: vi.fn(),
            generateGameContent: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OllamaService>(OllamaService);
    generationService = module.get<OllamaGenerationService>(OllamaGenerationService);

    // Manually link dependencies to the service instance to bypass Vitest/Nest DI metadata issues
    (service as any).client = module.get(OllamaClientService);
    (service as any).translation = module.get(OllamaTranslationService);
    (service as any).grammar = module.get(OllamaGrammarService);
    (service as any).generation = generationService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateExamples', () => {
    it('should delegate to generation service', async () => {
      const params = {
        word: 'test',
        sourceLanguage: 'en',
        targetLanguage: 'es',
      };
      const mockResult = [{ sentence: 'Test', translation: 'Prueba' }];

      const spy = vi.spyOn(generationService, 'generateExamples').mockResolvedValue(mockResult);

      const result = await service.generateExamples(params);

      expect(spy).toHaveBeenCalledWith(params);
      expect(result).toBe(mockResult);
    });
  });
});
