export const getTranslatePrompt = (
  text: string,
  targetLanguage: string = 'en',
  context?: string,
  sourceLanguage?: string,
): string => {
  const isAuto = !sourceLanguage || sourceLanguage === 'Auto';
  const fromLang = !isAuto ? `from ${sourceLanguage} ` : '';

  const isBlock = text.length > 100 || text.includes('\n');

  if (!isBlock) {
    const isSingleWord = !text.trim().includes(' ');
    const shouldIncludeContext = context && isSingleWord;

    return `[CONTEXT] ${shouldIncludeContext ? context : 'None'}
[TO_TRANSLATE] ${text}
[TARGET_LANGUAGE] ${targetLanguage}
[RULES]
1. Translate strictly ONLY the text: "${text}" into ${targetLanguage}.
2. Return JSON ONLY.
[JSON_FORMAT]
{
  "detectedLanguage": "${isAuto ? 'string' : sourceLanguage}",
  "translation": "string"
}`;
  }

  return `Role: Professional Translator.
Task: Translate the following text ${fromLang} into ${targetLanguage}.

Instructions:
1. Translate the full text faithfully.
2. Maintain original formatting.
3. CRITICALLY IMPORTANT: Output ONLY the translated text. Do NOT include "Here is the translation", "Translation:", or any other conversational filler.
4. Do NOT output the original text.

Text to Translate:
"${text}"`;
};



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

  return `You are a ${srcLang}→${targetLanguage} bilingual dictionary.

CRITICAL ROLE & RULES:
1. Ensure absolute parts-of-speech and category consistency. Never translate a verb form as a pronoun. If the input is a verb, the "translation" and "translationConjugated" fields MUST be verbs in the target language.
2. Maintain strict grammatical agreement (number, person, gender, tense). Do NOT translate plural source words into singular target forms.

A learner is reading this ${srcLang} sentence:
"${context || 'none'}"

Within that sentence they tapped: "${text}"

CRITICAL: "${text}" is a ${srcLang} word as used in the ${srcLang} sentence above. Do NOT interpret it as a word from any other language.

BEFORE writing JSON, decide:
1. In THIS ${srcLang} sentence, is "${text}" a verb form? (infinitive, conjugated, participle, gerund all count)
2. If yes, what is the ${srcLang} infinitive, and what is the conjugated ${targetLanguage} equivalent?

Reply with ONE JSON object in this exact shape:

{
  "type": "word" | "sentence",
  "isVerb": true | false,
  "segment": "${text}",
  "_analysis": "<Analyze '${text}' in isolation: is it a main verb or just an auxiliary/helping verb? State its literal base meaning before translating.>",
  "translationConjugated": "<${targetLanguage}: ONLY when isVerb=true — exact morphological equivalent of ONLY the word '${text}'. If '${text}' is just an auxiliary verb within a larger sentence, conjugate ONLY the auxiliary. Do NOT translate the full compound verb. Omit entirely when isVerb=false>",
  "translation": "<${targetLanguage}: INFINITIVE / base citation form of the translation; ≤3 words>",
  "grammar": {
    "sourceInfinitive": "<${srcLang} INFINITIVE / dictionary citation form. MUST BE IN ${srcLang}, NOT ${targetLanguage}. NEVER copy the segment if conjugated>",
    "partOfSpeech": "<${targetLanguage}>",
    "tense":        "<${targetLanguage}; REQUIRED when isVerb=true>",
    "gender":       "<${targetLanguage}; ONLY when grammatically gendered>",
    "explanation":  "<${targetLanguage}, one full sentence about how the word functions in THIS sentence>"
  },
  "examples":     [ {"sentence":"<${srcLang} ONLY>","translation":"<${targetLanguage} ONLY>"}, 2-3 entries — REQUIRED ],
  "alternatives": [ "<${targetLanguage}>", 1-2 entries — REQUIRED ]${isSentence
      ? `,
  "syntaxAnalysis": "<${targetLanguage}, 1-2 sentences describing structure>",
  "grammarRules":   [ "<${targetLanguage}, one grammar point>", 2-4 entries ]`
      : ''
    }
}

Rules:
- Use the ${srcLang} sentence above to pick the correct sense.
- "translation" is ALWAYS the infinitive/citation form: never conjugated, never progressive, never include reflexive pronouns unless mandatory.
- "translationConjugated" (isVerb=true only): conjugated to match "${text}" person/tense/number exactly. If the source is simple present, the target MUST be simple present.
- Grammatical Agreement: Maintain strict grammatical agreement (number, person, gender, tense). Do NOT translate plural forms as singular.
- Parts-of-Speech Matching: Never translate a verb form as a pronoun.
- When isVerb=true, "sourceInfinitive" MUST be the ${srcLang} INFINITIVE. NEVER copy the conjugated segment.
- Every string value MUST be in the language its slot assigns. Omit optional keys whose condition is false — never write "n/a", "none", or empty strings.
- "examples": each "sentence" entirely in ${srcLang}, each "translation" entirely in ${targetLanguage}. Never swap.
- Translate ONLY the specific segment "${text}". DO NOT translate the entire sentence. 
- If "${text}" is a single word, the translation MUST be a single word (or minimal equivalent). DO NOT translate the full compound verb if only the auxiliary verb was tapped.
${isSentence ? '- Multi-word input: type="sentence", isVerb=false.' : ''}

Output JSON only. No markdown, no preamble. Do NOT include a "conjugations" field.`;
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
       pronoun: "ich"  →  conjugation: "habe geschaut"   (NOT "ich habe geschaut")
       pronoun: "ich"  →  conjugation: "werde schauen"   (NOT "ich werde schauen")
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
