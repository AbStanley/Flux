import { Test } from '@nestjs/testing';
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

describe('LLM Translation E2E - German to Spanish Extra (/api/translate)', () => {
  let app: INestApplication;
  let service: OllamaTranslationService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    service = moduleFixture.get(OllamaTranslationService);
  });

  afterAll(async () => {
    await app.close();
  });

  const translate = (dto: TranslateDto) => service.translateText(dto);
  const oneOf = (actual: string | undefined, accepted: string[]) =>
    accepted.some((v) => actual?.toLowerCase().includes(v.toLowerCase()));

  describe('German → Spanish Extra Context Tests', () => {
    it('Single word with context: "muss" (German to Spanish grammatical agreement)', async () => {
      const res = await translate({
        text: 'muss',
        targetLanguage: 'Spanish',
        context: 'Ich muss wirklich aufstehen.',
        sourceLanguage: 'German',
        model: 'translategemma:4b',
      });
      expect(oneOf(res.response, ['debo', 'tengo'])).toBe(true);
    });

    it('Single word with context: "Kaffee" (no context bleeding)', async () => {
      const res = await translate({
        text: 'Kaffee',
        targetLanguage: 'Spanish',
        context: 'Ich brauche dringend Kaffee.',
        sourceLanguage: 'German',
        model: 'translategemma:4b',
      });
      expect(res.response.toLowerCase()).toBe('café');
    });

    it('Single word with context: "dein" (German to Spanish possessive pronoun)', async () => {
      const res = await translate({
        text: 'dein',
        targetLanguage: 'Spanish',
        context: 'Anna: Wie war dein Morgen?',
        sourceLanguage: 'German',
        model: 'translategemma:4b',
      });
      expect(oneOf(res.response, ['tu', 'tuyo'])).toBe(true);
    });

    it('Single word with context: "ihn" (German to Spanish accusative pronoun)', async () => {
      const res = await translate({
        text: 'ihn',
        targetLanguage: 'Spanish',
        context: '(Sie macht den Kaffee und trinkt ihn langsam.)',
        sourceLanguage: 'German',
        model: 'translategemma:4b',
      });
      expect(oneOf(res.response, ['lo'])).toBe(true);
    });
  });
});
