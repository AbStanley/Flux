import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
// Removed vitest import
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
            chat: jest.fn(),
            generate: jest.fn(),
            listTags: jest.fn(),
            ensureModel: jest.fn(),
          },
        },
        {
          provide: OllamaTranslationService,
          useValue: {
            translateText: jest.fn(),
            explainText: jest.fn(),
            getRichTranslation: jest.fn(),
          },
        },
        {
          provide: OllamaGrammarService,
          useValue: {
            analyzeGrammar: jest.fn(),
          },
        },
        {
          provide: OllamaGenerationService,
          useValue: {
            generateExamples: jest.fn(),
            generateContent: jest.fn(),
            generateGameContent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OllamaService>(OllamaService);
    generationService = module.get<OllamaGenerationService>(
      OllamaGenerationService,
    );

    // Manually link dependencies to the service instance to bypass Vitest/Nest DI metadata issues
    const serviceInternal = service as unknown as {
      client: OllamaClientService;
      translation: OllamaTranslationService;
      grammar: OllamaGrammarService;
      generation: OllamaGenerationService;
    };
    serviceInternal.client =
      module.get<OllamaClientService>(OllamaClientService);
    serviceInternal.translation = module.get<OllamaTranslationService>(
      OllamaTranslationService,
    );
    serviceInternal.grammar =
      module.get<OllamaGrammarService>(OllamaGrammarService);
    serviceInternal.generation = generationService;
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

      const spy = jest
        .spyOn(generationService, 'generateExamples')
        .mockResolvedValue(mockResult);

      const result = await service.generateExamples(params);

      expect(spy).toHaveBeenCalledWith(params);
      expect(result).toBe(mockResult);
    });
  });
});
