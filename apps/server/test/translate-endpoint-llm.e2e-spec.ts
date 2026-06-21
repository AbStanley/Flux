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

describe('LLM Translation E2E - Simple Hover Translation (/api/translate)', () => {
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

  /** Check that one of the accepted values is present in the response (case-insensitive) */
  const oneOf = (actual: string | undefined, accepted: string[]) =>
    accepted.some((v) => actual?.toLowerCase().includes(v.toLowerCase()));

  describe('German → Spanish Context Tests', () => {
    it('Single word with context: "klingt"', async () => {
      const res = await translate({
        text: 'klingt',
        targetLanguage: 'Spanish',
        context: 'Max Wow das klingt ja wirklich speziell',
        sourceLanguage: 'German',
        model: 'translategemma:4b',
      });
      expect(res.response.toLowerCase()).toBe('suena');
    });

    it('Phrase with context: "Ich finde das"', async () => {
      const res = await translate({
        text: 'Ich finde das',
        targetLanguage: 'Spanish',
        context: 'Ich finde das total spannend',
        sourceLanguage: 'German',
        model: 'translategemma:4b',
      });
      expect(
        oneOf(res.response, [
          'yo creo eso',
          'yo encuentro eso',
          'me parece',
          'yo lo encuentro',
          'yo pienso eso',
        ]),
      ).toBe(true);
    });

    it('Single word with Markdown context: "Auch"', async () => {
      const res = await translate({
        text: 'Auch',
        targetLanguage: 'Spanish',
        context: '**Anna:** Auch gut.',
        sourceLanguage: 'German',
        model: 'translategemma:4b',
      });
      // Accept 'también', 'igualmente', 'además', etc. Note character decoding issues in old script.
      expect(
        oneOf(res.response, [
          'también',
          'tambien',
          'igualmente',
          'además',
          'ademas',
        ]),
      ).toBe(true);
    });

    it('Two words with context: "Auch gut"', async () => {
      const res = await translate({
        text: 'Auch gut',
        targetLanguage: 'Spanish',
        context: 'Auch gut.',
        sourceLanguage: 'German',
        model: 'translategemma:4b',
      });
      expect(
        oneOf(res.response, [
          'también bien',
          'tambien bien',
          'igualmente bien',
          'muy bien también',
          'muy bien',
          'bien también',
        ]),
      ).toBe(true);
    });

    it('Full sentence: "Ich habe gerade etwas Interessantes gelesen."', async () => {
      const res = await translate({
        text: 'Ich habe gerade etwas Interessantes gelesen.',
        targetLanguage: 'Spanish',
        context: 'Ich habe gerade etwas Interessantes gelesen.',
        sourceLanguage: 'German',
        model: 'translategemma:4b',
      });
      expect(
        oneOf(res.response, [
          'acabo de leer algo interesante',
          'he leído algo interesante',
          'he leido algo interesante',
        ]),
      ).toBe(true);
    });

    it('Phrase with context: "wirklich Interessantes gelesen" (German to Spanish translation bug)', async () => {
      const res = await translate({
        text: 'wirklich Interessantes gelesen',
        targetLanguage: 'Spanish',
        context: 'Ich habe gerade etwas wirklich Interessantes gelesen.',
        sourceLanguage: 'German',
        model: 'translategemma:4b',
      });
      expect(
        oneOf(res.response, [
          'algo realmente interesante leído',
          'algo realmente interesante leido',
          'realmente interesante leído',
          'realmente interesante leido',
        ]),
      ).toBe(true);
    });

    it('Contraction with context: "geht\'s" (German to Spanish translation bug)', async () => {
      const res = await translate({
        text: "geht's",
        targetLanguage: 'Spanish',
        context: "Mir geht's gut, danke.",
        sourceLanguage: 'German',
        model: 'translategemma:4b',
      });
      expect(oneOf(res.response, ['va', 'anda'])).toBe(true);
    });

    it('Phrase with context: "geht es dir" (German to Spanish translation bug)', async () => {
      const res = await translate({
        text: 'geht es dir',
        targetLanguage: 'Spanish',
        context: 'Wie geht es dir heute?',
        sourceLanguage: 'German',
        model: 'translategemma:4b',
      });
      expect(
        oneOf(res.response, [
          'te va',
          'va',
          'estás',
          'estas',
          'te encuentras',
          'te va bien',
        ]),
      ).toBe(true);
    });
  });

  describe('Other Languages', () => {
    it('Russian single word "Почему" (Why)', async () => {
      const res = await translate({
        text: 'Почему',
        targetLanguage: 'English',
        context: 'Я не знаю, почему он это сделал.',
        sourceLanguage: 'Russian',
        model: 'translategemma:4b',
      });
      // The original script tested "Почему" with Cyrillic encoding issues, but the intent was "why".
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
