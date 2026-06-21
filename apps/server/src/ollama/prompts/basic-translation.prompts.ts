export const getTranslatePrompt = (
  text: string,
  targetLanguage: string = 'en',
  context?: string,
  sourceLanguage?: string,
): string => {
  const isAuto = !sourceLanguage || sourceLanguage === 'Auto';
  const fromLang = !isAuto ? `from ${sourceLanguage} ` : '';

  const isBlock = text.length > 100 || text.includes('\n');

  if (isBlock) {
    return `Role: Professional Translator.
Task: Translate the following text ${fromLang} into ${targetLanguage}.

Instructions:
1. Translate the full text faithfully.
2. Maintain original formatting.
3. CRITICALLY IMPORTANT: Output ONLY the translated text. Do NOT include "Here is the translation", "Translation:", or any other conversational filler.
4. Do NOT output the original text.

Text to Translate:
"${text}"`;
  }

  const shouldIncludeContext = !!context && context.trim().length > 0;
  const hasQuestionMark =
    shouldIncludeContext && (context.includes('?') || context.includes('¿'));

  if (shouldIncludeContext && hasQuestionMark) {
    const fromLangSuffix = isAuto ? '' : ` (${sourceLanguage})`;
    return `Translate the following segment from the context${fromLangSuffix}.
Context: "${context.trim()}"
Segment to translate: "${text.trim()}"
Target Language: ${targetLanguage}

[RULES]
1. Translate ONLY the segment "${text.trim()}" to the ${targetLanguage} equivalent.
2. The translation must strictly represent ONLY the words in the segment "${text.trim()}". Do NOT translate or include any adjacent words or question words from the surrounding context (such as helper verbs, pronouns, adjectives, adverbs, or question words that are outside the segment).
3. If the segment is not a complete sentence, the translation must be a fragment, not a complete sentence or question.
4. Return JSON ONLY.
[JSON_FORMAT]
{
  "detectedLanguage": "${isAuto || !sourceLanguage ? 'string' : sourceLanguage.toLowerCase()}",
  "translation": "string"
}`;
  }

  let formattedContext = context || 'None';
  if (shouldIncludeContext && text.trim().length <= 2) {
    try {
      const escapedText = text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(
        `(?<=^|[^\\p{L}\\p{N}_])${escapedText}(?=[^\\p{L}\\p{N}_]|$)`,
        'u',
      );
      formattedContext = context.replace(regex, `'${text.trim()}'`);
    } catch {
      // Fallback to raw context if regex fails
    }
  }

  const langPhrase = isAuto ? 'phrase' : `${sourceLanguage} phrase`;
  const instruction = shouldIncludeContext
    ? `From the ${langPhrase}: "${formattedContext}", translate exclusively and only the words "${text.trim()}" to the ${targetLanguage} equivalent within the context mentioned, without introductions, just a precise word by word in order get the meaning of the words in this context.`
    : `Translate exclusively and only the words "${text.trim()}" to the ${targetLanguage} equivalent, without introductions, just a precise word by word in order to get the meaning of the words.`;

  return `${instruction}

[RULES]
1. Translate strictly ONLY the text: "${text.trim()}" into ${targetLanguage}.
2. Return JSON ONLY.
[JSON_FORMAT]
{
  "detectedLanguage": "${isAuto || !sourceLanguage ? 'string' : sourceLanguage.toLowerCase()}",
  "translation": "string"
}`;
};

export const getSingleTensePrompt = (
  infinitive: string,
  sourceLanguage: string,
  tense: string,
): string => {
  return `You are a ${sourceLanguage} grammar expert.
Task: Conjugate ONLY the ${sourceLanguage} verb "${infinitive}" in the ${tense} tense.

CRITICAL RULES:
1. Conjugate ONLY "${infinitive}". Do NOT conjugate any other verb, even if you believe a synonym is more common in this tense.
2. "pronoun" = the standalone subject pronoun(s) ONLY — never include a verb word here.
3. "conjugation" = the COMPLETE verb form for that person — all auxiliary + main verb words, NO pronoun.
   - Compound/periphrastic tenses (Perfekt, Futur, Passé composé, etc.):
       pronoun: "ich"  →  conjugation: "habe geschaut"   (NOT "ich habe..." or "ich habe geschaut")
       pronoun: "ich"  →  conjugation: "werde schauen"   (NOT "ich werde..." or "ich werde schauen")
   - Simple tenses: just the single conjugated word, e.g. "schaue", "schaust", "schaut".

Return exactly this 6-row JSON (replace placeholder text with real ${sourceLanguage} for "${infinitive}" ${tense}):
{
  "rows": [
    {"pronoun": "1st sg pronoun",  "conjugation": "<1st sg form of ${infinitive}>"},
    {"pronoun": "2nd sg pronoun",  "conjugation": "<2nd sg form of ${infinitive}>"},
    {"pronoun": "3rd sg pronoun",  "conjugation": "<3rd sg form of ${infinitive}>"},
    {"pronoun": "1st pl pronoun",  "conjugation": "<1st pl form of ${infinitive}>"},
    {"pronoun": "2nd pl pronoun",  "conjugation": "<2nd pl form of ${infinitive}>"},
    {"pronoun": "3rd pl pronoun",  "conjugation": "<3rd pl form of ${infinitive}>"}
  ]
}

Output JSON only. No markdown. No preamble.`;
};

export const getExplainPrompt = (
  text: string,
  targetLanguage: string = 'en',
  context?: string,
): string => {
  return `Role: High-quality General Monolingual Dictionary.
Task: Provide a clean, direct, monolingual dictionary-style definition of "${text}" in ${targetLanguage}.

Input Text: "${text}"
${context ? `Reading context of occurrence: "${context}"` : ''}

Instructions:
1. Output format: Start with the input word in bold on the first line, followed by its general, standard definition on the next line.
2. General-First Rule: Provide the general, standard dictionary definition of "${text}". Do NOT narrow the definition entirely to the provided reading context sentence if the word has a more common general meaning.
3. CRITICAL: The explanation must be completely written in ${targetLanguage}.
4. CRITICAL: Output ONLY the word and its definition. Do NOT write "Here is the definition", "Definition:", "Sure!", or any other conversational intro.
5. Keep it under 2 sentences. Be clear, precise, and educational.

Output:`;
};
