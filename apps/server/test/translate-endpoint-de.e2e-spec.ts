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

describe('LLM Translation E2E - German to Spanish (/api/translate)', () => {
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
          'encuentro que',
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
      expect(oneOf(res.response, ['va', 'anda', 'está', 'esta', 'estoy'])).toBe(
        true,
      );
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

    it('Single word with context: "muss" (German to Spanish grammatical agreement)', async () => {
      const res = await translate({
        text: 'muss',
        targetLanguage: 'Spanish',
        context: 'Ich muss wirklich aufstehen.',
        sourceLanguage: 'German',
        model: 'translategemma:4b',
      });
      // Accept first-person singular forms matching "Ich" (I) context: 'debo', 'tengo'
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
      // Accept 'tu' or 'tuyo' (not Italian 'tuo')
      expect(oneOf(res.response, ['tu', 'tuyo'])).toBe(true);
    });
  });
});
