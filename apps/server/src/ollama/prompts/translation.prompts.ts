export const getTranslatePrompt = (
  text: string,
  targetLanguage: string = 'en',
  context?: string,
  sourceLanguage?: string,
): string => {
  const isAuto = !sourceLanguage || sourceLanguage === 'Auto';
  const fromLang = !isAuto ? `from ${sourceLanguage} ` : '';

  const isBlock = text.length > 100 || text.includes('\n');

  if (isAuto) {
    return `[CONTEXT] ${context || 'None'}
[TO_TRANSLATE] ${text}
[TARGET_LANGUAGE] ${targetLanguage}
[TASK] Translate ONLY "${text}" and detect source language.
[RULES]
1. No extra words from context.
2. Return JSON ONLY.
[JSON_FORMAT]
{
  "detectedLanguage": "string",
  "translation": "string"
}`;
  }

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

  const prompt = `[CONTEXT] ${context || 'None'}
[TO_TRANSLATE] ${text}
[TARGET_LANGUAGE] ${targetLanguage}
[RULES]
1. Translate ONLY "${text}".
2. DO NOT include translations of surrounding words from the context.
3. DO NOT add words like "Algo", "Something", or "The" if not in the original text.
[RESULT]`;

  return prompt;
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
1. Ensure absolute parts-of-speech and category consistency. Never translate a verb form as a pronoun. If the input tapped word is a verb, the "translation" field MUST be a verb or verb form in the target language.
2. Maintain strict grammatical agreement (number, person, gender, tense). Do NOT translate plural source words into singular target forms, preventing pronoun mix-ups.

A learner is reading this ${srcLang} sentence:
"${context || 'none'}"

Within that sentence they tapped: "${text}"

CRITICAL: "${text}" is a ${srcLang} word (or phrase) as used in the ${srcLang} sentence above. Do NOT interpret it as a word from any other language, even if it looks identical to one. Pay close attention to cross-language homographs.

BEFORE writing JSON, decide:
1. In THIS ${srcLang} sentence, is "${text}" a verb form? (infinitive, conjugated, participle, gerund, zu-infinitive all count)
2. If yes, what is the ${srcLang} infinitive?

Reply with ONE JSON object in this exact shape:

{
  "type": "word" | "sentence",
  "isVerb": true | false,
  "segment": "${text}",
  "translation": "<${targetLanguage}: dictionary headword(s) for the ${srcLang} word in this context; ≤3 words for single-word input>",
  "grammar": {
    "infinitive":   "<${srcLang} dictionary form; REQUIRED and MUST be filled when isVerb=true>",
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
- Use the ${srcLang} sentence above to pick the correct sense. The translation must match how the word is actually used there.
- Grammatical Agreement: Maintain strict grammatical agreement (number, person, gender, tense) between the source word and the translation. Do NOT translate plural pronouns or plural verb forms as singular, avoiding singular pronoun mix-ups.
- Parts-of-Speech Matching: Ensure absolute semantic and parts-of-speech consistency between the source word and its translation. Never translate a verb form as a pronoun.
- When isVerb=true, "infinitive" MUST be the ${srcLang} dictionary form — NEVER copy the segment verbatim when the segment is a conjugated form.
- Every string value MUST be in the language its slot assigns. Omit optional keys whose condition is false — never write "n/a", "none", or empty strings.
- "examples": each "sentence" entirely in ${srcLang}, each "translation" entirely in ${targetLanguage}. Never swap. If scripts differ, the two fields MUST use different scripts.
- Examples should show "${text}" used in natural, varied ${srcLang} contexts — not all the same sense.
${isSentence ? `- Multi-word input: type="sentence", isVerb=false.` : ''}
- Translate ONLY the specific segment "${text}". DO NOT include translations of surrounding words from the context sentence in the "translation" field. 

Output JSON only. No markdown, no preamble. Do NOT include a "conjugations" field — conjugation tables are fetched separately when the user requests them.`;
};

/**
 * Focused fallback that asks for a SINGLE tense at a time. Wrapping the
 * rows in an object plays nicer with Ollama's JSON mode (which prefers
 * top-level objects) than a bare array.
 */
export const getSingleTensePrompt = (
  infinitive: string,
  sourceLanguage: string,
  tense: string,
): string => {
  return `Give the ${tense} tense conjugation of the ${sourceLanguage} verb "${infinitive}".

Reply with this exact JSON shape — no commentary, no markdown:
{
  "rows": [
    {"pronoun": "<${sourceLanguage} pronoun>", "conjugation": "<inflected form of '${infinitive}'>"},
    …
  ]
}

Use one row per person/gender/number the paradigm has — typically 6 rows by person; Russian past is 4 rows with pronouns "он", "она", "оно", "они". Every row is filled with a real ${sourceLanguage} form.`;
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



