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
    return `Role: Professional Translator and Language Detector.
Task: Translate the segment "${text}" into ${targetLanguage} AND detect the source language.

Context Information:
- Full Sentence: "${context || 'None'}"
- Segment to Translate: "${text}"

Instructions:
1. Analyze the "Full Sentence" to determine the exact meaning of "${text}".
2. Translate ONLY "${text}". Do NOT translate the surrounding sentence.
3. Detect the source language name (e.g., "Spanish", "French", "Japanese").
4. Output ONLY a JSON object with two keys: "detectedLanguage" and "translation".
5. CRITICALLY IMPORTANT: Output ONLY the JSON. No conversational filler.

Expected JSON Output:
{
  "detectedLanguage": "...",
  "translation": "..."
}`;
  }

  if (isBlock) {
    return `Role: Professional Translator.
Task: Translate the following text ${fromLang}into ${targetLanguage}.

Instructions:
1. Translate the full text faithfully.
2. Maintain original formatting.
3. CRITICALLY IMPORTANT: Output ONLY the translated text. Do NOT include "Here is the translation", "Translation:", or any other conversational filler.
4. Do NOT output the original text.

Text to Translate:
"${text}"`;
  }

  const prompt = `Role: Context-Aware Dictionary.
Task: Translate the segment "${text}" ${fromLang} into ${targetLanguage}.

Context Information:
- Full Sentence: "${context || 'None'}"
- Segment to Translate: "${text}"

Instructions:
1. Analyze the "Full Sentence" to determine the exact meaning of "${text}" in this specific use case.
2. Translate ONLY the segment "${text}". Do NOT translate the surrounding sentence.
3. CRITICALLY IMPORTANT: Output ONLY the final translated text.
   - NO "The translation is..."
   - NO "In this context..."
   - NO quotes around the result.
   - NO bullet points.
   - NO explanations.
   - STRICTLY PROHIBITED: Do NOT provide a list of multiple meanings.
   - Output ONLY the most accurate single translation for this specific context.

Result:`;

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

  return `You are a bilingual dictionary. Look up "${text}" (${srcLang}) for a ${targetLanguage}-speaking learner.
Context (use only to disambiguate; never translate it): "${context || 'none'}"

Reply with ONE JSON object in the shape below. Decide "isVerb" FIRST and let it drive the rest of the JSON.

Definitions:
- isVerb=true  → "${text}" is a verb in ${srcLang} (infinitive, conjugated form, participle, gerund, zu-infinitive, etc.). Include "conjugations" and the verb-only grammar fields.
- isVerb=false → "${text}" is anything else (noun, adjective, adverb, pronoun, particle, sentence, …). Do NOT include "conjugations". Do NOT include "infinitive" or "tense".

Each placeholder names the language to write in. Omit any key whose condition is false — never write a literal string like "n/a" or "omitido" as a value.

{
  "type": "word" | "sentence",
  "isVerb": true | false,
  "segment": "${text}",
  "translation": "<${targetLanguage}: dictionary headword(s); ≤3 ${targetLanguage} words for single-word input>",
  "grammar": {
    "partOfSpeech": "<${targetLanguage}>",
    "infinitive":   "<${srcLang}; ONLY if isVerb=true>",
    "tense":        "<${targetLanguage}; ONLY if isVerb=true>",
    "gender":       "<${targetLanguage}; ONLY when grammatically gendered>",
    "explanation":  "<${targetLanguage}, one sentence>"
  },
  "conjugations": {
    "<tense name for ${srcLang}>": [ {"pronoun":"<${srcLang}>","conjugation":"<${srcLang}>"}, … 6 rows ],
    … 3-4 core tenses of ${srcLang}
  },
  "examples":     [ {"sentence":"<${srcLang}>","translation":"<${targetLanguage}>"}, 2-3 entries ],
  "alternatives": [ "<${targetLanguage}>", 1-2 entries ]
}

For multi-word input: type="sentence", isVerb=false, omit "conjugations", add "syntaxAnalysis" (${targetLanguage} string) and "grammarRules" (${targetLanguage} string[]).
Conjugation forms inflect the ${srcLang} infinitive — the forms always share the infinitive's stem.

When isVerb=true, "conjugations" MUST contain the core tenses of ${srcLang} — exactly these keys, in this order, each with 6 rows:
  - English:  Present, Past, Future, Present Perfect
  - Spanish / Italian / Portuguese:  Presente, Pretérito, Imperfecto, Futuro
  - French:   Présent, Passé composé, Imparfait, Futur
  - German:   Präsens, Präteritum, Perfekt, Futur
  - Russian:  Настоящее, Прошедшее, Будущее
  - Other:    3-4 core tenses of ${srcLang}
A conjugations block with fewer than 3 tense keys is incomplete and must not be returned.

Every string value must be in the language the schema assigns to that slot. Do not copy vocabulary, pronouns, or example sentences from any language other than ${srcLang} or ${targetLanguage} — they do not belong here. In particular, every "<${srcLang}>" slot must contain actual ${srcLang} output for "${text}", not placeholder text from some other language.

Output JSON only. No markdown, no preamble.`;
};

export const getExplainPrompt = (
  text: string,
  targetLanguage: string = 'en',
  context?: string,
): string => {
  return `Role: Educational Encyclopedia and Teacher.
Task: Explain the following text clearly and concisely IN ${targetLanguage}.

Input Text: "${text}"
${context ? `Context: "${context}"` : ''}

Instructions:
1. Provide a clear definition or explanation of the concept/phrase.
2. If it's a difficult word, provide a simple synonym.
3. If it's a cultural reference, explain the background briefly.
4. CRITICAL: The explanation MUST be written in ${targetLanguage}.
5. CRITICAL: Do NOT start with "Sure", "Here is", or "In this context". Just give the explanation.
6. Keep it under 3 sentences unless complex.

Output:
(The explanation text only)`;
};
