import { LlmTestHelper } from './llm-test-setup';

jest.setTimeout(240000);

describe('LLM Translation E2E Ollama - Spanish to Russian', () => {
  beforeAll(async () => {
    await LlmTestHelper.setup();
  });

  afterAll(async () => {
    await LlmTestHelper.teardown();
  });

  describe('Spanish to Russian non-verbs', () => {
    it('"las" article to isVerb is false, valid translation not n/a', async () => {
      const r = await LlmTestHelper.stream({
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

    it('"dueño" noun to isVerb is false, and should translate to a noun (not a verb like является/быть)', async () => {
      const r = await LlmTestHelper.stream({
        text: 'dueño',
        context: 'Don Ricardo, el dueño, sonrió.',
        sourceLanguage: 'Spanish',
        targetLanguage: 'Russian',
        model: 'translategemma:4b',
      });

      expect(r.isVerb).toBe(false);

      // The translation should be a noun meaning owner or host (e.g. владелец, хозяин)
      expect(r.translation).toBeTruthy();
      const lowerTranslation = r.translation?.toLowerCase().trim();
      expect(lowerTranslation).not.toBe('является');
      expect(lowerTranslation).not.toBe('быть');
      expect(lowerTranslation).not.toContain('ser');
      expect(
        LlmTestHelper.oneOf(r.translation, [
          'владелец',
          'хозяин',
          'собственник',
        ]),
      ).toBe(true);
    });
  });
});
