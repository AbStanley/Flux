import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { OllamaTranslationService } from '../src/ollama/services/ollama-translation.service';

type TranslateDto = {
  text: string;
  targetLanguage: string;
  context?: string;
  sourceLanguage?: string;
  model?: string;
};

jest.setTimeout(240000);

describe('LLM Translation E2E - Other Languages (/api/translate)', () => {
  let app: INestApplication;
  let service: OllamaTranslationService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    service = moduleFixture.get<OllamaTranslationService>(
      OllamaTranslationService,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  const translate = async (dto: TranslateDto) => {
    return service.translateText(dto);
  };

  const oneOf = (actual: string | undefined, accepted: string[]) =>
    accepted.some((v) => actual?.toLowerCase().includes(v.toLowerCase()));

  describe('Other Languages', () => {
    it('Russian single word "Почему" (Why)', async () => {
      const res = await translate({
        text: 'Почему',
        targetLanguage: 'English',
        context: 'Я не знаю, почему он это сделал.',
        sourceLanguage: 'Russian',
        model: 'translategemma:4b',
      });
      expect(oneOf(res.response, ['why'])).toBe(true);
    });

    it('Russian phrase "не знаю" (do not know)', async () => {
      const res = await translate({
        text: 'не знаю',
        targetLanguage: 'Spanish',
        context: 'Я не знаю, почему он это сделал.',
        sourceLanguage: 'Russian',
        model: 'translategemma:4b',
      });
      expect(
        oneOf(res.response, ['no sé', 'no se', 'no lo sé', 'no lo se']),
      ).toBe(true);
    });

    it('Spanish single word "siempre" → English', async () => {
      const res = await translate({
        text: 'siempre',
        targetLanguage: 'English',
        context: 'Yo siempre voy al parque los domingos.',
        sourceLanguage: 'Spanish',
        model: 'translategemma:4b',
      });
      expect(oneOf(res.response, ['always'])).toBe(true);
    });

    it('Spanish phrase "los domingos" → English', async () => {
      const res = await translate({
        text: 'los domingos',
        targetLanguage: 'English',
        context: 'Yo siempre voy al parque los domingos.',
        sourceLanguage: 'Spanish',
        model: 'translategemma:4b',
      });
      expect(oneOf(res.response, ['sundays', 'on sundays'])).toBe(true);
    });
  });
});
