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

jest.setTimeout(120000);

describe('LLM Translation E2E (Ollama)', () => {
  let app: INestApplication;
  let service: OllamaTranslationService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    service = moduleFixture.get<OllamaTranslationService>(OllamaTranslationService);
  });

  afterAll(async () => {
    await app.close();
  });

  /** Collect all streaming chunks and parse the final JSON from the LLM. */
  const stream = async (dto: RichDto): Promise<any> => {
    const raw = await service.getRichTranslationStream(dto);
    let text = '';
    for await (const chunk of raw) {
      const r = (chunk as any).response;
      if (r) text += r;
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`LLM output not valid JSON:\n${text}`);
    }
  };

  /** Check that one of the accepted values is present (case-insensitive). */
  const oneOf = (actual: string | undefined, accepted: string[]) =>
    accepted.some((v) => actual?.toLowerCase() === v.toLowerCase());

  // ─────────────────────────────────────────────────────────────
  // German → Spanish
  // ─────────────────────────────────────────────────────────────
  describe('German → Spanish verbs', () => {
    it('"hat" → tener / tiene / haben', async () => {
      const r = await stream({
        text: 'hat', context: 'Er hat ein Buch.',
        sourceLanguage: 'German', targetLanguage: 'Spanish', model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(r.translation?.toLowerCase()).toBe('tener');
      expect(r.translationConjugated?.toLowerCase()).toBe('tiene');
      expect(r.grammar?.sourceInfinitive?.toLowerCase()).toBe('haben');
    });

    it('"sieht" → ver / ve / sehen', async () => {
      const r = await stream({
        text: 'sieht', context: 'Er sieht das Haus.',
        sourceLanguage: 'German', targetLanguage: 'Spanish', model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(r.translation?.toLowerCase()).toBe('ver');
      expect(r.translationConjugated?.toLowerCase()).toBe('ve');
      expect(r.grammar?.sourceInfinitive?.toLowerCase()).toBe('sehen');
    });

    it('"klingt" → sonar / suena / klingen', async () => {
      const r = await stream({
        text: 'klingt', context: '**Max:** Wow, das klingt ja wirklich speziell.',
        sourceLanguage: 'German', targetLanguage: 'Spanish', model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(oneOf(r.translation, ['sonar', 'klingen'])).toBe(true);
      expect(oneOf(r.translationConjugated, ['suena'])).toBe(true);
      expect(r.grammar?.sourceInfinitive?.toLowerCase()).toBe('klingen');
    });

    it('"Hast" → tener|haber / tienes|has / haben', async () => {
      const r = await stream({
        text: 'Hast', context: 'Hast du schon mal über ungewöhnliche Hobbys nachgedacht?',
        sourceLanguage: 'German', targetLanguage: 'Spanish', model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(oneOf(r.translation, ['tener', 'haber'])).toBe(true);
      expect(oneOf(r.translationConjugated, ['tienes', 'has'])).toBe(true);
      expect(r.grammar?.sourceInfinitive?.toLowerCase()).toBe('haben');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // French → Spanish
  // ─────────────────────────────────────────────────────────────
  describe('French → Spanish verbs', () => {
    it('"a" → isVerb, conjugated form populated, not the source word', async () => {
      const r = await stream({
        text: 'a', context: "Il a toujours un air innocent.",
        sourceLanguage: 'French', targetLanguage: 'Spanish', model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(r.translationConjugated).toBeTruthy();
      expect(r.translation?.toLowerCase()).not.toBe('a');
    });

    it('"suis" → ser|estar / soy|estoy / être', async () => {
      const r = await stream({
        text: 'suis', context: "Je suis très fatigué aujourd'hui.",
        sourceLanguage: 'French', targetLanguage: 'Spanish', model: 'translategemma:4b',
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
  describe('Russian → English verbs', () => {
    it('"читал" → isVerb, conjugated populated, source inf читать', async () => {
      const r = await stream({
        text: 'читал', context: 'Он читал книгу.',
        sourceLanguage: 'Russian', targetLanguage: 'English', model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(r.translationConjugated).toBeTruthy();
      const srcInf = (r._verbAnalysis?.sourceInfinitive ?? r.grammar?.sourceInfinitive)?.toLowerCase();
      expect(srcInf).toBe('читать');
    });

    it('"знаю" → know family / знать', async () => {
      const r = await stream({
        text: 'знаю', context: 'Я не знаю, почему он это сделал.',
        sourceLanguage: 'Russian', targetLanguage: 'English', model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(oneOf(r.translationConjugated, ['know', 'i know'])).toBe(true);
      const srcInf = (r._verbAnalysis?.sourceInfinitive ?? r.grammar?.sourceInfinitive)?.toLowerCase();
      expect(srcInf).toBe('знать');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Spanish → English
  // ─────────────────────────────────────────────────────────────
  describe('Spanish → English verbs', () => {
    it('"tiene" → have family / has', async () => {
      const r = await stream({
        text: 'tiene', context: 'Ella tiene un perro.',
        sourceLanguage: 'Spanish', targetLanguage: 'English', model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(oneOf(r.translationConjugated, ['has', 'have'])).toBe(true);
      expect(oneOf(r.translation, ['have', 'has', 'to have'])).toBe(true);
    });

    it('"voy" → go / go / ir', async () => {
      const r = await stream({
        text: 'voy', context: 'Yo siempre voy al parque los domingos.',
        sourceLanguage: 'Spanish', targetLanguage: 'English', model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(oneOf(r.translation, ['to go', 'go'])).toBe(true);
      expect(oneOf(r.translationConjugated, ['go', 'i go'])).toBe(true);
      const srcInf = (r._verbAnalysis?.sourceInfinitive ?? r.grammar?.sourceInfinitive)?.toLowerCase();
      expect(srcInf).toBe('ir');
    });
  });
});
