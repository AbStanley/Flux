import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { OllamaTranslationService } from '../src/ollama/services/ollama-translation.service';

type RichDto = {
  text: string;
  targetLanguage: string;
  context?: string;
  sourceLanguage?: string;
  model?: string;
};

/**
 * The subset of the parsed rich-translation JSON that these tests assert on.
 * All fields are optional because the LLM output is best-effort and the
 * assertions guard each access.
 */
type RichTranslationResult = {
  isVerb?: boolean;
  translation?: string;
  translationConjugated?: string;
  grammar?: { sourceInfinitive?: string };
  _verbAnalysis?: { sourceInfinitive?: string };
};

jest.setTimeout(240000);

describe('LLM Translation E2E Ollama', () => {
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

  /** Collect all streaming chunks and parse the final JSON from the LLM. */
  const stream = async (dto: RichDto): Promise<RichTranslationResult> => {
    const raw = await service.getRichTranslationStream(dto);
    let text = '';
    for await (const chunk of raw) {
      if (chunk.response) text += chunk.response;
    }
    try {
      return JSON.parse(text) as RichTranslationResult;
    } catch {
      throw new Error(`LLM output not valid JSON:\n${text}`);
    }
  };

  /** Check that one of the accepted values is present (case-insensitive). */
  const oneOf = (actual: string | undefined, accepted: string[]) =>
    accepted.some((v) => actual?.trim().toLowerCase() === v.toLowerCase());

  // ─────────────────────────────────────────────────────────────
  // German → Spanish
  // ─────────────────────────────────────────────────────────────
  describe('German to Spanish verbs', () => {
    it('"hat" to tener or tiene or haben', async () => {
      const r = await stream({
        text: 'hat',
        context: 'Er hat ein Buch.',
        sourceLanguage: 'German',
        targetLanguage: 'Spanish',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(r.translation?.toLowerCase()).toBe('tener');
      expect(r.translationConjugated?.toLowerCase()).toBe('tiene');
      expect(r.grammar?.sourceInfinitive?.toLowerCase()).toBe('haben');
    });

    it('"sieht" to ver or ve or sehen', async () => {
      const r = await stream({
        text: 'sieht',
        context: 'Er sieht das Haus.',
        sourceLanguage: 'German',
        targetLanguage: 'Spanish',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(r.translation?.toLowerCase()).toBe('ver');
      expect(r.translationConjugated?.toLowerCase()).toBe('ve');
      expect(r.grammar?.sourceInfinitive?.toLowerCase()).toBe('sehen');
    });

    it('"klingt" to sonar or suena or klingen', async () => {
      const r = await stream({
        text: 'klingt',
        context: '**Max:** Wow, das klingt ja wirklich speziell.',
        sourceLanguage: 'German',
        targetLanguage: 'Spanish',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(oneOf(r.translation, ['sonar', 'klingen'])).toBe(true);
      expect(oneOf(r.translationConjugated, ['suena'])).toBe(true);
      expect(r.grammar?.sourceInfinitive?.toLowerCase()).toBe('klingen');
    });

    it('"Hast" → tener or haber / tienes or has / haben', async () => {
      const r = await stream({
        text: 'Hast',
        context: 'Hast du schon mal über ungewöhnliche Hobbys nachgedacht?',
        sourceLanguage: 'German',
        targetLanguage: 'Spanish',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(oneOf(r.translation, ['tener', 'haber'])).toBe(true);
      expect(
        oneOf(r.translationConjugated, ['tienes', 'has', 'tengo', 'hecho']),
      ).toBe(true);
      expect(r.grammar?.sourceInfinitive?.toLowerCase()).toBe('haben');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // German → Spanish Non-verbs
  // ─────────────────────────────────────────────────────────────
  describe('German to Spanish non-verbs', () => {
    it('"Haus" noun to isVerb is false, valid translation not n/a', async () => {
      const r = await stream({
        text: 'Haus',
        context: 'Er sieht das Haus.',
        sourceLanguage: 'German',
        targetLanguage: 'Spanish',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(false);
      expect(r.translation).toBeTruthy();
      expect(r.translation?.toLowerCase()).not.toBe('n/a');
      expect(r.translation?.toLowerCase()).not.toBe('none');
      expect(oneOf(r.translation, ['casa'])).toBe(true);
    });

    it('"speziell" adjective to isVerb is false, valid translation not n/a', async () => {
      const r = await stream({
        text: 'speziell',
        context: '**Max:** Wow, das klingt ja wirklich speziell.',
        sourceLanguage: 'German',
        targetLanguage: 'Spanish',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(false);
      expect(r.translation).toBeTruthy();
      expect(r.translation?.toLowerCase()).not.toBe('n/a');
      expect(r.translation?.toLowerCase()).not.toBe('none');
      expect(
        oneOf(r.translation, [
          'especial',
          'específicamente',
          'particularmente',
        ]),
      ).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // French → Spanish
  // ─────────────────────────────────────────────────────────────
  describe('French to Spanish verbs', () => {
    it('"a" to isVerb, conjugated form populated, not the source word', async () => {
      const r = await stream({
        text: 'a',
        context: 'Il a toujours un air innocent.',
        sourceLanguage: 'French',
        targetLanguage: 'Spanish',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(r.translationConjugated).toBeTruthy();
      expect(r.translation?.toLowerCase()).not.toBe('a');
    });

    it('"suis" → ser or estar / soy or estoy / être', async () => {
      const r = await stream({
        text: 'suis',
        context: "Je suis très fatigué aujourd'hui.",
        sourceLanguage: 'French',
        targetLanguage: 'Spanish',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(oneOf(r.translation, ['ser', 'estar'])).toBe(true);
      expect(oneOf(r.translationConjugated, ['soy', 'estoy'])).toBe(true);
      expect(r.grammar?.sourceInfinitive?.toLowerCase()).toBe('être');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Russian → English
  // ─────────────────────────────────────────────────────────────
  describe('Russian to English verbs', () => {
    it('"читал" to isVerb, conjugated populated, source inf читать', async () => {
      const r = await stream({
        text: 'читал',
        context: 'Он читал книгу.',
        sourceLanguage: 'Russian',
        targetLanguage: 'English',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(r.translationConjugated).toBeTruthy();
      const srcInf = (
        r._verbAnalysis?.sourceInfinitive ?? r.grammar?.sourceInfinitive
      )?.toLowerCase();
      expect(srcInf).toBe('читать');
    });

    it('"знаю" to know family or знать', async () => {
      const r = await stream({
        text: 'знаю',
        context: 'Я не знаю, почему он это сделал.',
        sourceLanguage: 'Russian',
        targetLanguage: 'English',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(oneOf(r.translationConjugated, ['know', 'i know'])).toBe(true);
      const srcInf = (
        r._verbAnalysis?.sourceInfinitive ?? r.grammar?.sourceInfinitive
      )?.toLowerCase();
      expect(srcInf).toBe('знать');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Spanish → English
  // ─────────────────────────────────────────────────────────────
  describe('Spanish to English verbs', () => {
    it('"tiene" to have family or has', async () => {
      const r = await stream({
        text: 'tiene',
        context: 'Ella tiene un perro.',
        sourceLanguage: 'Spanish',
        targetLanguage: 'English',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(oneOf(r.translationConjugated, ['has', 'have'])).toBe(true);
      expect(oneOf(r.translation, ['have', 'has', 'to have'])).toBe(true);
    });

    it('"voy" to go or go or ir', async () => {
      const r = await stream({
        text: 'voy',
        context: 'Yo siempre voy al parque los domingos.',
        sourceLanguage: 'Spanish',
        targetLanguage: 'English',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(oneOf(r.translation, ['to go', 'go'])).toBe(true);
      expect(oneOf(r.translationConjugated, ['go', 'i go'])).toBe(true);
      const srcInf = (
        r._verbAnalysis?.sourceInfinitive ?? r.grammar?.sourceInfinitive
      )?.toLowerCase();
      expect(srcInf).toBe('ir');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Spanish → Russian
  // ─────────────────────────────────────────────────────────────
  describe('Spanish to Russian non-verbs', () => {
    it('"las" article to isVerb is false, valid translation not n/a', async () => {
      const r = await stream({
        text: 'las',
        context: 'María: Normalmente, a las 11 de la noche.',
        sourceLanguage: 'Spanish',
        targetLanguage: 'Russian',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(false);
      expect(r.translation).toBeTruthy();
      expect(r.translation?.toLowerCase()).not.toBe('n/a');
      expect(r.translation?.toLowerCase()).not.toBe('none');
      expect(r.translation?.toLowerCase()).not.toContain('ночью');
    });
  });
});
