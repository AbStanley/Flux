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
  const fromLang =
    sourceLanguage && sourceLanguage !== 'Auto'
      ? `from ${sourceLanguage} `
      : '';
  const srcLang = sourceLanguage || 'the source language';

  return `Translate and analyze "${text}" ${fromLang}into ${targetLanguage}.
Context: "${context || 'None'}"

Return JSON ONLY — no markdown, no commentary.

Determine if "${text}" is a SINGLE WORD or a SENTENCE/PHRASE:
- A single lexical unit (no spaces, or a conjugated verb like "llegado", "running") = WORD.
- Multiple words forming a clause = SENTENCE.

{
  "type": "word" or "sentence",
  "translation": "...",
  "segment": "${text}",
  "grammar": {
    "partOfSpeech": "...",
    "infinitive": "... (if verb, in ${srcLang})",
    "tense": "... (if verb)",
    "gender": "... (if applicable)",
    "explanation": "brief grammar note in ${targetLanguage}"
  },
  "conjugations": {
    "Present": [{"pronoun": "...", "conjugation": "..."}],
    "Preterite": [{"pronoun": "...", "conjugation": "..."}],
    "Imperfect": [{"pronoun": "...", "conjugation": "..."}],
    "Future": [{"pronoun": "...", "conjugation": "..."}]
  },
  "examples": [
    {"sentence": "${srcLang} example", "translation": "${targetLanguage} translation"}
  ],
  "alternatives": ["alt1 (translation)", "alt2 (translation)"]
}

CRITICAL RULES for "translation" field:
- If type is "word": translate ONLY the word "${text}" — output a single word or minimal equivalent in ${targetLanguage}. NEVER translate the surrounding context. Example: "llegado" → "arrivé", NOT a full sentence.
- If type is "sentence": translate the full phrase into ${targetLanguage}.

CRITICAL RULES for "conjugations":
- Include ONLY if the word is a verb. Omit entirely for non-verbs.
- BOTH "pronoun" AND "conjugation" values MUST be in ${srcLang}. NEVER use ${targetLanguage} pronouns or verb forms.
- Use the standard pronouns of ${srcLang}. For example in Spanish: Yo, Tú, Él/Ella, Nosotros, Vosotros, Ellos/Ellas. In French: Je, Tu, Il/Elle, Nous, Vous, Ils/Elles. In German: Ich, Du, Er/Sie, Wir, Ihr, Sie.
- Do NOT mix pronouns or verb forms from different languages. Every value must be 100% ${srcLang}.
- Include all 6 persons (1st/2nd/3rd singular + 1st/2nd/3rd plural).
- For Romance languages include Preterite, Imperfect, AND Future.

Other rules:
- "explanation" must be written in ${targetLanguage}.
- For sentences: omit "conjugations", add "syntaxAnalysis" and "grammarRules" instead.
- Provide 2-3 examples and 1-2 alternatives.`;
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
