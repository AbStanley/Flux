import { LlmTestHelper } from './llm-test-setup';

jest.setTimeout(240000);

describe('LLM Translation E2E Ollama - German to Spanish', () => {
  beforeAll(async () => {
    await LlmTestHelper.setup();
  });

  afterAll(async () => {
    await LlmTestHelper.teardown();
  });

  const oneOf = (actual: string | undefined, accepted: string[]) =>
    accepted.some((v) => actual?.trim().toLowerCase() === v.toLowerCase());

  describe('German to Spanish verbs', () => {
    it('"hat" to tener or tiene or haben', async () => {
      const r = await LlmTestHelper.stream({
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
      const r = await LlmTestHelper.stream({
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
      const r = await LlmTestHelper.stream({
        text: 'klingt',
        context: '**Max:** Wow, das klingt ja wirklich speziell.',
        sourceLanguage: 'German',
        targetLanguage: 'Spanish',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(LlmTestHelper.oneOf(r.translation, ['sonar', 'klingen'])).toBe(
        true,
      );
      expect(LlmTestHelper.oneOf(r.translationConjugated, ['suena'])).toBe(
        true,
      );
      expect(r.grammar?.sourceInfinitive?.toLowerCase()).toBe('klingen');
    });

    it('"Hast" → tener or haber / tienes or has / haben', async () => {
      const r = await LlmTestHelper.stream({
        text: 'Hast',
        context: 'Hast du schon mal über ungewöhnliche Hobbys nachgedacht?',
        sourceLanguage: 'German',
        targetLanguage: 'Spanish',
        model: 'translategemma:4b',
      });
      expect(r.isVerb).toBe(true);
      expect(LlmTestHelper.oneOf(r.translation, ['tener', 'haber'])).toBe(true);
      expect(
        LlmTestHelper.oneOf(r.translationConjugated, [
          'tienes',
          'has',
          'tengo',
          'hecho',
        ]),
      ).toBe(true);
      expect(r.grammar?.sourceInfinitive?.toLowerCase()).toBe('haben');
    });
  });

  describe('German to Spanish non-verbs', () => {
    it('"Haus" noun to isVerb is false, valid translation not n/a', async () => {
      const r = await LlmTestHelper.stream({
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
      expect(
        oneOf(r.translation, ['casa', 'la casa', 'hogar', 'el hogar']),
      ).toBe(true);
    });

    it('"speziell" adjective to isVerb is false, valid translation not n/a', async () => {
      const r = await LlmTestHelper.stream({
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
        LlmTestHelper.oneOf(r.translation, [
          'especial',
          'específicamente',
          'particularmente',
        ]),
      ).toBe(true);
    });
  });
});
