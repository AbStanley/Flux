// --- From client/.. /GenerationPrompts.ts ---
export type ContentType = 'Story' | 'Monologue' | 'Conversation';

export const getStoryPrompt = (params: {
  sourceLang: string;
  isLearningMode: boolean;
  proficiencyLevel: string;
  topic?: string;
  contentType?: ContentType;
}): string => {
  const {
    sourceLang,
    isLearningMode,
    proficiencyLevel,
    topic,
    contentType = 'Story',
  } = params;
  let contentDescription = '';
  switch (contentType) {
    case 'Monologue':
      contentDescription = 'a monologue';
      break;
    case 'Conversation':
      contentDescription = 'a conversation between two people';
      break;
    case 'Story':
    default:
      contentDescription = 'a short story';
      break;
  }

  if (isLearningMode) {
    const topicPhrase = topic
      ? ` about "${topic}"`
      : ' about a random interesting topic';
    return `Write ${contentDescription} about ${topicPhrase} in ${sourceLang} suitable for a ${proficiencyLevel} proficiency level learner. The vocabulary and grammar should be appropriate for ${proficiencyLevel}. Include a title starting with '## '. Output ONLY the title and the text. Do not include any introductory or concluding remarks. Do NOT include translations.`;
  } else {
    return `Write ${contentDescription} in ${sourceLang} about a robot learning to paint. Include a title starting with '## '. Output ONLY the title and the text. Do not include any introductory or concluding remarks. Do NOT include translations.`;
  }
};

// --- From client/.. /TranslationPrompts.ts ---
export const getTranslatePrompt = (
  text: string,
  targetLanguage: string = 'en',
  context?: string,
  sourceLanguage?: string,
): string => {
  const fromLang =
    sourceLanguage && sourceLanguage !== 'Auto'
      ? `from ${sourceLanguage} `
      : '';

  const isBlock = text.length > 100 || text.includes('\n');

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
Task: Translate the specific segment "${text}" ${fromLang}into ${targetLanguage}, fitting the context of: "${context || 'None'}".

Instructions:
1. Analyze the "Context" to determine the exact meaning of "${text}".
2. Translate ONLY "${text}". Do NOT translate the surrounding sentence.
3. If "${text}" is a phrase/idiom, translate its meaning.
4. If "${text}" is a conjugated verb, keep the correct tense/person in the translation if possible, or provide the infinitive with a note if ambiguous (but prefer direct mapping).
5. CRITICALLY IMPORTANT: Output ONLY the final translated text.
   - NO "The translation is..."
   - NO "In this context..."
   - NO quotes around the result.
   - NO explanations.

Input:
Context: "${context || 'None'}"
Segment: "${text}"

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

  return `Role: Expert Linguist and Translator.
Task: Analyze the text segment "${text}" ${fromLang}and translate it to ${targetLanguage}. Provide detailed grammatical information, usage examples, and alternatives.

Input Data:
- Full Sentence (Context): "${context || 'None'}"
- Segment to Analyze: "${text}"
- Source Language: "${sourceLanguage || 'Unknown'}"
- Target Language: "${targetLanguage}"

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
     - MUST include "conjugations" in ${sourceLanguage || 'the source language'}:
       - Include "Present".
       - For Romance languages (Spanish, French, etc), MUST include BOTH "Preterite" AND "Imperfect".
       - Include "Future".
       - CRITICAL: You MUST include the specific tense of the "Segment to Analyze" if it is not one of the above.
      - IMPORTANT: Use ALL standard personal pronouns for the language (e.g., I, You, He/She/It, We, You(pl), They).
      - Ensure all persons (1st, 2nd, 3rd) and numbers (singular, plural) are represented.
      - If multiple pronouns share the same verb form (e.g. "He/She" or "They/You"), you may group them or list them distinctively, but ensure NO standard pronoun is missing.
      - Do NOT repeat the exact same conjugation row multiple times unnecessarily, but DO ensure the user sees the conjugation for every person.
     - STRICT PROHIBITION: Do NOT translate the conjugated verb forms into ${targetLanguage}. They MUST remain in ${sourceLanguage || 'the source language'}.
   - If it's NOT a verb, OMIT "conjugations".
   - OMIT "grammar" object usually used for single words (Part of Speech, etc) unless relevant to the *whole* sentence structure.

3. Provide 3 usage examples in ${sourceLanguage || 'the source language'} WITH translations in ${targetLanguage}.
   - CRITICAL: "sentence" MUST be in ${sourceLanguage || 'the source language'}.
   - CRITICAL: "translation" MUST be in ${targetLanguage}.
   - Ensure the examples are distinct from the input text.

4. Provide 1-2 common alternatives in ${sourceLanguage || 'the source language'} WITH translations in ${targetLanguage}.

Output Format: JSON ONLY.
Structure:
{
  "type": "word" or "sentence",
  "translation": "translated text (${targetLanguage})",
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
    { "sentence": "Foreign language sentence (${sourceLanguage || 'source'})", "translation": "Native language translation (${targetLanguage})" }
  ],
  "alternatives": ["Alternative 1 (Translation)", "Alternative 2 (Translation)"]
}
`;
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

// --- Original Server Prompts ---
export const GRAMMAR_ANALYSIS_PROMPT = (
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
) => `Analyze the grammar of the following sentence: "${text}".
Source Language: ${sourceLanguage}
Target Language: ${targetLanguage}

Provide a JSON response with the following structure:
{
  "sentence": "${text}",
  "translation": "Full translation of the sentence",
  "grammar": [
    {
      "word": "word from sentence",
      "translation": "translation of word",
      "partOfSpeech": "Part of Speech (e.g., Pronoun, Verb)",
      "details": "Grammatical details (e.g., Nominative Singular, Present Tense)",
      "colorGroup": "suggested color group index (1-8) based on: 1=Noun, 2=Verb, 3=Adjective, 4=Adverb/Preposition, 5=Other, 6=Article/Determiner, 7=Conjunction, 8=Pronoun"
    }
  ]
}
Ensure the 'grammar' array breaks down every word in the sentence roughly in order.
STRICTLY ignore punctuation marks (., !?, etc) in the 'grammar' list; only include meaningful words.
Articles (the, a, der, die, das) should use group 6.
Pronouns (he, she, it, er, sie, es, etc) should use group 8.
Only output the valid JSON object. Do not include markdown formatting. No newlines inside strings.`;

// --- Game Content Prompts ---
export const getGameContentPrompt = (
  topic: string,
  level: string,
  mode: string,
  sourceLang: string,
  targetLang: string,
  limit: number = 10,
): string => {
  const isStoryMode = mode === 'story';
  const contextInstruction =
    mode === 'scramble'
      ? 'Generate FULL SENTENCES.'
      : 'Generate simple words or short phrases.';

  if (isStoryMode) {
    return `
      Generate a short cohesive story about "${topic}" in ${targetLang} (Level: ${level}).
      Split the story into ${limit} short segments.
      for each segment, identify a key phrase or word to translate to ${sourceLang}.

      Return strictly a JSON array of objects. Each object must have:
      - "context": The story segment in ${targetLang}.
      - "question": The key phrase/word in ${targetLang} (from the segment).
      - "answer": The translation of the key phrase/word in ${sourceLang}.
      - "type": "phrase"
      
      Example JSON format:
      [
          { "context": "Había una vez un gato.", "question": "gato", "answer": "cat", "type": "phrase" }
      ]

      Do not include markdown. Just JSON.
      `;
  } else if (mode === 'scramble') {
    return `
       For "scramble" mode, generate ${limit} FULL SENTENCES about "${topic}".
       Level criteria:
       - Beginner: Simple Subject-Verb-Object sentences (5-8 words).
       - Intermediate: Sentences with conjunctions or simple relative clauses (8-12 words).
       - Advanced: Complex sentences with subordinate clauses or idiomatic expressions (12+ words).
       
       Current Level: ${level}

       Return strictly a JSON array of objects. Each object must have:
       - "question": The full sentence in ${targetLang} (for reference/hint).
       - "answer": The full sentence in ${sourceLang} (this will be scrambled).
       - "context": A brief explanation of grammar or context if needed.
       - "type": "phrase"

       Example JSON format:
      [
          { "question": "The cat sleeps on the sofa.", "answer": "El gato duerme en el sofá.", "context": "Simple present tense description.", "type": "phrase" }
      ]
      
      Do not include markdown formatting or explanations. Just the JSON array.
       `;
  } else {
    // Default / Multiple Choice
    return `
      Generate ${limit} items for a language learning game.
      Topic: "${topic}"
      Difficulty Level: ${level}
      Game Mode: ${mode} (${contextInstruction})

      Return strictly a JSON array of objects. Each object must have:
      - "question": The content in ${sourceLang}.
      - "answer": The translation in ${targetLang}.
      - "context": A short example sentence using the word in ${targetLang}.
      - "type": "word" or "phrase".

      IMPORTANT criteria:
      1. "question" and "answer" must be in the specified languages.
      2. "question" and "answer" must NOT be identical (unless the word is the same in both languages, which should be rare).
      3. Avoid proper nouns if they don't change between languages.

           Example JSON format:
          [
              { "question": "Hello", "answer": "Hola", "context": "Hola, ¿cómo estás?", "type": "word" }
          ]
          
          Do not include markdown formatting or explanations. Just the JSON array.
      `;
  }
};

export const getExamplesPrompt = (params: {
  word: string;
  definition?: string;
  sourceLanguage: string;
  targetLanguage: string;
  count: number;
  existingExamples?: string[];
}): string => {
  const {
    word,
    definition,
    sourceLanguage,
    targetLanguage,
    count,
    existingExamples,
  } = params;
  const excludePart =
    existingExamples && existingExamples.length > 0
      ? `\nDo NOT regenerate these existing examples:\n- ${existingExamples.join('\n- ')}\n`
      : '';

  return `Generate exactly ${count} NEW natural example sentences for "${word}"${definition ? ` (meaning: ${definition})` : ''}.${excludePart}
- Sentence Language: ${sourceLanguage}
- Translation Language: ${targetLanguage}

Return a JSON array of ${count} objects. No extra text.
Format:
[
  {"sentence": "Example 1 in ${sourceLanguage}", "translation": "Translation 1 in ${targetLanguage}"},
  {"sentence": "Example 2 in ${sourceLanguage}", "translation": "Translation 2 in ${targetLanguage}"},
  {"sentence": "Example 3 in ${sourceLanguage}", "translation": "Translation 3 in ${targetLanguage}"}
]`;
};
