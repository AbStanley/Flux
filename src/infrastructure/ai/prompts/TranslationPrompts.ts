export const getTranslatePrompt = (
  text: string,
  targetLanguage: string = 'en',
  context?: string,
  sourceLanguage?: string
): string => {
  const fromLang = (sourceLanguage && sourceLanguage !== 'Auto') ? `from ${sourceLanguage} ` : '';

  // Heuristic: If text is long (> 100 chars) or has newlines, treat as Block Translation
  const isBlock = text.length > 100 || text.includes('\n');

  if (isBlock) {
    return `Role: Professional Translator.
Task: Translate the following text ${fromLang}into ${targetLanguage}.

Instructions:
1. Translate the full text faithfully.
2. Maintain original formatting.
3. Output ONLY the translation. No introductory text.

Text to Translate:
"${text}"`;
  }

  // Existing "Dictionary/Contextual" prompt for short phrases/words
  let prompt = `Role: Dictionary and Translation Engine.
Task: Provide the meaning of a specific text segment ${fromLang}into ${targetLanguage}.

Input Data:
- Full Sentence (Context): "${context || 'None'}"
- Segment to Translate: "${text}"

Instructions:
1. Look at the "Segment to Translate".
2. Identify its meaning within the "Full Sentence".
3. Negation Check: If the segment itself does not contain "no"/"not", the translation MUST be positive.
4. Preposition Check: If the segment does not include a preposition, do not add one.
5. STRICT: Translate ONLY the words in "Segment to Translate". Do NOT translate the surrounding words from the context.
6. Return ONLY the translation text. No explanations.

Examples:
Input: Context="yo no veo donde estas", Segment="estas"
Output: you are

Input: Context="yo no veo donde estas", Segment="donde estas"
Output: where you are

Input: Context="para todos ustedes", Segment="todos ustedes"
Output: all of you

Input: Context="hasta aqui ya no se que hacer", Segment="se que hacer"
Output: know what to do

Input: Context="I like to run", Segment="run"
Output: corrrer

Required Output:
(Just the translation text. Do not include 'Here is the translation' or quotes around the result.)`;

  if (context) {
    prompt += `\n\nContext: "${context}"`;
    prompt += `\nTarget Text: "${text}"`;
  } else {
    prompt += `\n\nTarget Text: "${text}"`;
  }

  return prompt;
};

export const getRichTranslationPrompt = (
  text: string,
  targetLanguage: string = 'en',
  context?: string,
  sourceLanguage?: string
): string => {
  const fromLang = (sourceLanguage && sourceLanguage !== 'Auto') ? `from ${sourceLanguage} ` : '';

  return `Role: Expert Linguist and Translator.
Task: Analyze the text segment "${text}" ${fromLang}and translate it to ${targetLanguage}. Provide detailed grammatical information, usage examples, and alternatives.

Input Data:
- Full Sentence (Context): "${context || 'None'}"
- Segment to Analyze: "${text}"

Instructions:
1. Determine if "Segment to Analyze" is a SINGLE WORD or a SENTENCE.
   - HINT: If the segment matches a single lexical unit (no spaces, or a standard compound word), treat it as a WORD.
   - HINT: If it is a conjugated verb form (like "era", "fui", "running"), treat it as a WORD.

2. Translate the segment accurately within the given context.
   - CRITICAL: "Segment to Analyze" MUST be translated based on the "Full Sentence". Do not provide a generic dictionary definition if it doesn't fit the context.

IF IT IS A *SENTENCE* (or Phrase):
   - Set "type" to "sentence".
   - Provide a "syntaxAnalysis": Breakdown (Subject + Verb + Object).
   - Provide "grammarRules".
   - OMIT "conjugations" UNLESS the phrase is effectively a phrasal verb acting as a single verb unit.

IF IT IS A *SINGLE WORD*:
   - Set "type" to "word".
   - Identify the Part of Speech.
   - If it's a VERB (or acts as one in context):
     - MUST include "conjugations":
       - Include "Present".
       - For Romance languages (Spanish, French, etc), MUST include BOTH "Preterite" AND "Imperfect".
       - Include "Future".
       - CRITICAL: You MUST include the specific tense of the "Segment to Analyze" if it is not one of the above (e.g. if the word is "Conditional", include "Conditional").
     - IMPORTANT: Use SOURCE language pronouns.
   - If it's NOT a verb, OMIT "conjugations".
   - OMIT "grammar" object usually used for single words (Part of Speech, etc) unless relevant to the *whole* sentence structure.

3. Provide 2-3 usage examples with translations.
4. Provide 1-2 common alternatives.

Output Format: JSON ONLY.
Structure:
{
  "type": "word" or "sentence",
  "translation": "translated text",
  "segment": "original text",
  
  // IF WORD:
  "grammar": {
    "partOfSpeech": "...",
    "tense": "...",
    "gender": "...",
    "infinitive": "...",
    "explanation": "..."
  },
  "conjugations": { 
      "Present": [ {"pronoun": "...", "conjugation": "..."} ],
      "Preterite": [ ... ],
      "Future": [ ... ]
  }, // Only if VERB

  // IF SENTENCE:
  "syntaxAnalysis": "Subject (...) + Verb (...) ...",
  "grammarRules": ["Rule 1...", "Rule 2..."],

  "examples": [
    { "sentence": "Example usage...", "translation": "Translated example..." }
  ],
  "alternatives": ["Alternative 1", "Alternative 2"]
}
`;
};
