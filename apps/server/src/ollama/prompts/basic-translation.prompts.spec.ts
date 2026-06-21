import { getTranslatePrompt } from './basic-translation.prompts';

describe('getTranslatePrompt', () => {
  const targetLanguage = 'Spanish';

  it('should generate a prompt with context for a multi-word phrase', () => {
    const text = 'wirklich Interessantes gelesen';
    const context = 'Ich habe gerade etwas wirklich Interessantes gelesen.';
    const sourceLanguage = 'German';

    const prompt = getTranslatePrompt(
      text,
      targetLanguage,
      context,
      sourceLanguage,
    );

    expect(prompt).toContain(
      'From the German phrase: "Ich habe gerade etwas wirklich Interessantes gelesen."',
    );
    expect(prompt).toContain(
      'translate exclusively and only the words "wirklich Interessantes gelesen"',
    );
    expect(prompt).toContain(
      'Translate strictly ONLY the text: "wirklich Interessantes gelesen" into Spanish.',
    );
    expect(prompt).toContain('"detectedLanguage": "german"');
  });

  it('should generate a prompt with context for a single word / contraction', () => {
    const text = "geht's";
    const context = "Mir geht's gut, danke.";
    const sourceLanguage = 'German';

    const prompt = getTranslatePrompt(
      text,
      targetLanguage,
      context,
      sourceLanguage,
    );

    expect(prompt).toContain(
      'From the German phrase: "Mir geht\'s gut, danke."',
    );
    expect(prompt).toContain(
      'translate exclusively and only the words "geht\'s"',
    );
    expect(prompt).toContain(
      'Translate strictly ONLY the text: "geht\'s" into Spanish.',
    );
    expect(prompt).toContain('"detectedLanguage": "german"');
  });

  it('should generate a prompt without context if context is not provided', () => {
    const text = 'wirklich Interessantes gelesen';
    const sourceLanguage = 'German';

    const prompt = getTranslatePrompt(
      text,
      targetLanguage,
      undefined,
      sourceLanguage,
    );

    expect(prompt).not.toContain('From the German phrase:');
    expect(prompt).toContain(
      'Translate exclusively and only the words "wirklich Interessantes gelesen"',
    );
    expect(prompt).toContain(
      'Translate strictly ONLY the text: "wirklich Interessantes gelesen" into Spanish.',
    );
    expect(prompt).toContain('"detectedLanguage": "german"');
  });

  it('should handle Auto-detected source language correctly', () => {
    const text = 'hallo';
    const context = 'Hallo, wie geht es dir?';

    const prompt = getTranslatePrompt(text, targetLanguage, context, 'Auto');

    expect(prompt).toContain(
      'Translate the following segment from the context.',
    );
    expect(prompt).toContain('Context: "Hallo, wie geht es dir?"');
    expect(prompt).toContain('Segment to translate: "hallo"');
    expect(prompt).toContain('"detectedLanguage": "string"');
  });

  it('should generate a prompt with context for "wollte dich" context from German to Spanish', () => {
    const text = 'wollte dich';
    const context = 'Ich wollte dich unbedingt fragen...';
    const sourceLanguage = 'German';

    const prompt = getTranslatePrompt(
      text,
      targetLanguage,
      context,
      sourceLanguage,
    );

    expect(prompt).toContain(
      'From the German phrase: "Ich wollte dich unbedingt fragen..."',
    );
    expect(prompt).toContain(
      'translate exclusively and only the words "wollte dich" to the Spanish equivalent within the context mentioned',
    );
    expect(prompt).toContain(
      'without introductions, just a precise word by word in order get the meaning of the words in this context',
    );
    expect(prompt).toContain('"detectedLanguage": "german"');
  });
});
