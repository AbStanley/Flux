import { LlmTestHelper } from './llm-test-setup';

jest.setTimeout(240000);

describe('LLM Translation E2E Ollama - Mixed Directions', () => {
  beforeAll(async () => {
    await LlmTestHelper.setup();
  });

  afterAll(async () => {
    await LlmTestHelper.teardown();
  });

  describe('French to Spanish verbs', () => {
    it('"a" to isVerb, conjugated form populated, not the source word', async () => {
      const r = await LlmTestHelper.stream({
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
      const r = await LlmTestHelper.stream({
        text: 'suis',
        context: "Je suis très fatigué aujourd'hui.",
        sourceLanguage: 'French',
        targetLanguage: 'Spanish',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(LlmTestHelper.oneOf(r.translation, ['ser', 'estar'])).toBe(true);
      expect(
        LlmTestHelper.oneOf(r.translationConjugated, ['soy', 'estoy']),
      ).toBe(true);
      expect(r.grammar?.sourceInfinitive?.toLowerCase()).toBe('être');
    });
  });

  describe('Russian to English verbs', () => {
    it('"читал" to isVerb, conjugated populated, source inf читать', async () => {
      const r = await LlmTestHelper.stream({
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
      const r = await LlmTestHelper.stream({
        text: 'знаю',
        context: 'Я не знаю, почему он это сделал.',
        sourceLanguage: 'Russian',
        targetLanguage: 'English',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(
        LlmTestHelper.oneOf(r.translationConjugated, ['know', 'i know']),
      ).toBe(true);
      const srcInf = (
        r._verbAnalysis?.sourceInfinitive ?? r.grammar?.sourceInfinitive
      )?.toLowerCase();
      expect(srcInf).toBe('знать');
    });
  });

  describe('Spanish to English verbs', () => {
    it('"tiene" to have family or has', async () => {
      const r = await LlmTestHelper.stream({
        text: 'tiene',
        context: 'Ella tiene un perro.',
        sourceLanguage: 'Spanish',
        targetLanguage: 'English',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(
        LlmTestHelper.oneOf(r.translationConjugated, ['has', 'have']),
      ).toBe(true);
      expect(
        LlmTestHelper.oneOf(r.translation, ['have', 'has', 'to have']),
      ).toBe(true);
    });

    it('"voy" to go or go or ir', async () => {
      const r = await LlmTestHelper.stream({
        text: 'voy',
        context: 'Yo siempre voy al parque los domingos.',
        sourceLanguage: 'Spanish',
        targetLanguage: 'English',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(LlmTestHelper.oneOf(r.translation, ['to go', 'go'])).toBe(true);
      expect(LlmTestHelper.oneOf(r.translationConjugated, ['go', 'i go'])).toBe(
        true,
      );
      const srcInf = (
        r._verbAnalysis?.sourceInfinitive ?? r.grammar?.sourceInfinitive
      )?.toLowerCase();
      expect(srcInf).toBe('ir');
    });
  });
});
