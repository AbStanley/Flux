export const getRichTranslationPrompt = (
  text: string,
  targetLanguage: string = 'en',
  context?: string,
  sourceLanguage?: string,
): string => {
  const srcLang =
    sourceLanguage && sourceLanguage !== 'Auto'
      ? sourceLanguage
      : 'source language';
  const isSentence = text.length > 40 || /\s/.test(text.trim());

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

  const rule3 = isRussian
    ? '\n3. Translate ONLY the tapped segment. Do NOT translate it using another word from the surrounding context that belongs to a different part of the sentence. If the segment has no direct equivalent in the target language (such as articles when translating to Russian which does not use articles), the "translation" should represent its primary grammatical role or a close equivalent (e.g., a demonstrative pronoun), and the "explanation" must describe its correct grammatical function.'
    : '';

  return `You are a ${srcLang}→${targetLanguage} bilingual dictionary.

CRITICAL ROLE & RULES:
1. Ensure absolute parts-of-speech and category consistency. Never translate a verb form as a pronoun. If the input is a verb, the "translation" and "translationConjugated" fields MUST be verbs in the target language.
2. Maintain strict grammatical agreement (number, person, gender, tense). Do NOT translate plural source words into singular target forms.${rule3}

A learner is reading this ${srcLang} sentence:
"${formattedContext}"

Within that sentence they tapped: "${text}"${isHighlighted ? ' (marked with single quotes above)' : ''}

CRITICAL: "${text}" is a ${srcLang} word as used in the ${srcLang} sentence above. Do NOT interpret it as a word from any other language.

Reply with ONE JSON object in this exact shape:

{
  "type": "word" | "sentence",
  "isVerb": true | false,
  "segment": "${text}",
  "_verbAnalysis": {
    "sourceInfinitive": "<${srcLang} INFINITIVE — the dictionary/citation form. NEVER copy the conjugated text here.>",
    "targetInfinitive": "<${targetLanguage} INFINITIVE — the dictionary/citation form. NEVER write the conjugated form here.>",
    "grammaticalPerson": "<grammatical person and number (required when isVerb=true)>"
  },
  "translationConjugated": "<${targetLanguage} CONJUGATED verb. Check grammaticalPerson carefully! Conjugate for 'I', 'you', 'he/she', etc. accordingly. Omit if not a verb.>",
  "translation": "<${targetLanguage} translation. MUST be the dictionary base form (pure INFINITIVE for verbs). NEVER the source language word. NEVER a conjugated form. NEVER write 'n/a'.>",
  "grammar": {
    "sourceInfinitive": "<The pure ${srcLang} INFINITIVE — must exactly match '_verbAnalysis.sourceInfinitive'. NEVER copy '${text}' here if it is conjugated.>",
    "partOfSpeech": "<${targetLanguage}>",
    "tense":        "<${targetLanguage}; REQUIRED when isVerb=true>",
    "gender":       "<${targetLanguage}; ONLY when grammatically gendered>",
    "explanation":  "<${targetLanguage}, one full sentence about how the word functions in THIS sentence>"
  },
  "examples":     [ {"sentence":"<${srcLang} ONLY>","translation":"<${targetLanguage} ONLY>"}, 3 entries — REQUIRED ],
  "alternatives": [ "<${targetLanguage}>", 1-2 entries — REQUIRED ]${
    isSentence
      ? `,
  "syntaxAnalysis": "<${targetLanguage}, 1-2 sentences describing structure>",
  "grammarRules":   [ "<${targetLanguage}, one grammar point>", 2-4 entries ]`
      : ''
  }
}

Rules:
1. Identify if "${text}" is a verb in the context of the sentence.
2. The "translation" field is strictly for the DICTIONARY BASE FORM. If the input is a verb, this field MUST be the pure infinitive. NEVER put a conjugated verb here.
3. The "translationConjugated" field is for the contextual translation. It MUST match "${text}" exactly in tense, person, and number. Apply correct vowel changes for irregular Spanish verbs (o -> ue, e -> ie). Ensure the correct grammatical person based on the sentence subject.
4. ALL translation fields MUST be in the target language (${targetLanguage}). Do NOT copy the source language word into the translation fields.
- Grammatical Agreement: Maintain strict grammatical agreement (number, person, gender, tense). Do NOT translate plural forms as singular.
- Parts-of-Speech Matching: Never translate a verb form as a pronoun.
- When isVerb=true, "sourceInfinitive" MUST be the pure ${srcLang} INFINITIVE. NEVER copy the conjugated segment.
- Every string value MUST be in the language its slot assigns. Omit optional keys whose condition is false — never write "n/a", "none", or empty strings.
- "examples": exactly 3 natural, diverse, and contextual example sentences. Each "sentence" must be entirely in ${srcLang} and MUST explicitly contain "${text}" (or its conjugation/variation). Each "translation" must be entirely in ${targetLanguage}. Never swap the languages or leave them empty.
- Translate ONLY the specific segment "${text}". DO NOT translate the entire sentence. 
- If "${text}" is a single word, the translation MUST be a single word (or minimal equivalent). DO NOT translate the full compound verb if only the auxiliary verb was tapped.
${isSentence ? '- Multi-word input: type="sentence", isVerb=false.' : ''}

Output JSON only. No markdown, no preamble. Do NOT include a "conjugations" field.`;
};
