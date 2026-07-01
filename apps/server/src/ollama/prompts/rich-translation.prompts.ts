// Prompt builder for rich translations with syntax, grammar, and preferred translation hint alignment.
export const getRichTranslationPrompt = (
  text: string,
  targetLanguage: string = 'en',
  context?: string,
  sourceLanguage?: string,
  preferredTranslation?: string,
): string => {
  const srcLang =
    sourceLanguage && sourceLanguage !== 'Auto'
      ? sourceLanguage
      : 'source language';
  const isSentence = text.length > 40 || /\s/.test(text.trim());

  const cleanSrcLang = srcLang.toLowerCase().replace(/[^a-z]/g, '');
  const cleanTgtLang = targetLanguage.toLowerCase().replace(/[^a-z]/g, '');
  const srcKey =
    cleanSrcLang && cleanSrcLang !== 'sourcelanguage'
      ? `${cleanSrcLang}_sentence`
      : 'source_sentence';
  const tgtKey = `${cleanTgtLang}_translation`;

  let formattedContext = context || 'none';
  let isHighlighted = false;
  if (!isSentence && context) {
    if (text.trim().length <= 2) {
      try {
        const escapedText = text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(
          `(?<=^|[^\\p{L}\\p{N}_])${escapedText}(?=[^\\p{L}\\p{N}_]|$)`,
          'u',
        );
        const newContext = context.replace(regex, `'${text.trim()}'`);
        if (newContext !== context) {
          formattedContext = newContext;
          isHighlighted = true;
        }
      } catch {
        // Fallback to raw context if regex fails
      }
    }
  }

  const isRussian =
    targetLanguage.toLowerCase() === 'russian' ||
    targetLanguage.toLowerCase() === 'ru';
  const translationDesc = isRussian
    ? `<Russian translation. MUST be the dictionary base form (pure INFINITIVE for verbs). For non-verbs, if there is no direct translation (like articles), you MUST write its grammatical role e.g. 'артикль' or a close equivalent like 'те'. NEVER omit this field. NEVER write 'n/a'. — REQUIRED>`
    : `<${targetLanguage} translation. MUST be the dictionary base form (pure INFINITIVE for verbs). NEVER the source language word. NEVER a conjugated form. NEVER write 'n/a'.>`;

  const preferredInstruction = preferredTranslation
    ? `\nPREFERRED TRANSLATION TARGET HINT: The user previously saw the translation "${preferredTranslation}" for this word. If possible, align your primary translations with this preferred translation:
- If "${text}" is a verb, the "translation" field MUST be the pure dictionary infinitive form of "${preferredTranslation}" in ${targetLanguage}.
- The "translationConjugated" field MUST be the correctly conjugated form of that SAME verb in ${targetLanguage}, matching the grammatical subject and tense of the context sentence exactly.
- If it is not a verb, the "translation" field MUST match "${preferredTranslation}".`
    : '';

  return `You are a ${srcLang}→${targetLanguage} bilingual dictionary.
Context sentence: "${formattedContext}"
Within that sentence they selected: "${text}"${isHighlighted ? ' (marked with single quotes above)' : ''}

CRITICAL: "${text}" is a ${srcLang} word as used in the ${srcLang} sentence above. Do NOT interpret it as a word from any other language.
CRITICAL: Translate ONLY "${text}" as used in the context sentence. Do NOT translate other parts of the sentence.

Output ONE JSON object matching this exact shape:
{
  "type": "word" | "sentence",
  "isVerb": true | false,
  "segment": "${text}",
  "_verbAnalysis": {
    "sourceInfinitive": "<${srcLang} infinitive base form>",
    "targetInfinitive": "<${targetLanguage} infinitive base form>",
    "grammaticalPerson": "<person and number (e.g. 3rd person singular), omit if isVerb=false>"
  },
  "translationConjugated": "<${targetLanguage} conjugated verb matching subject/tense of context sentence, omit if isVerb=false>",
  "translation": "${translationDesc}",
  "grammar": {
    "sourceInfinitive": "<${srcLang} infinitive, must match _verbAnalysis.sourceInfinitive>",
    "partOfSpeech": "<${targetLanguage} part of speech>",
    "tense":        "<${targetLanguage} tense, omit if isVerb=false>",
    "gender":       "<${targetLanguage} gender, omit if not gendered>",
    "explanation":  "<${targetLanguage} definition and a brief description of grammatical function in context sentence (1 sentence)>"
  },
  "examples":     [ {"${srcKey}":"<sentence in ${srcLang} containing '${text}'>","${tgtKey}":"<translation in ${targetLanguage}>"}, exactly 3 entries ],
  "alternatives": [ "<alternative translation in ${targetLanguage}>", 1-2 entries ]${
    isSentence
      ? `,
  "syntaxAnalysis": "<structure description in ${targetLanguage}>",
  "grammarRules":   [ "<grammar point in ${targetLanguage}>", 2-4 entries ]`
      : ''
  }
}

Rules:
1. "isVerb" MUST be true if "${text}" acts as a verb (representing action, existence, possession, state, or auxiliary function) in the context sentence. Be extremely careful: if a single-letter word is the word carrying the action, state, or possession in the clause (since every complete clause must have a verb), it is a verb. In such cases, "isVerb" MUST be true, and "translation" MUST be the infinitive form of that verb in ${targetLanguage}.
2. If "${text}" is a verb, "translation" and "_verbAnalysis.targetInfinitive" MUST match exactly and be the pure dictionary infinitive of the translation in ${targetLanguage}. "translationConjugated" MUST be the correctly conjugated form of that exact same verb in ${targetLanguage}, matching the tense, person, and number of the context sentence subject.
3. If "${text}" is NOT a verb, the "translation" field MUST match the input's part of speech (it MUST NOT be a verb, e.g. use "especial" instead of "especializar" for the adjective "speziell").
4. "sourceInfinitive" (in both places) MUST be the pure dictionary infinitive form of "${text}" in ${srcLang}. NEVER copy "${text}" if it is conjugated.
5. Every translation, explanation, and alternative MUST be in the target language (${targetLanguage}).
6. "alternatives" MUST contain 1-2 synonyms or alternative translations of "${text}" strictly in ${targetLanguage}. Never write source language (${srcLang}) words here.
7. "examples": exactly 3 sentences. Each "${srcKey}" MUST contain "${text}" (or its conjugation) in ${srcLang}. Each "${tgtKey}" MUST be the target translation in ${targetLanguage}.
8. Maintain strict grammatical agreement (tense, person, number, gender). Do not mix singular/plural.
9. Omit optional keys with false conditions. Do not output empty strings, "n/a", "none", or a "conjugations" field.

Output JSON only. No markdown, no preamble.${preferredInstruction}`;
};
