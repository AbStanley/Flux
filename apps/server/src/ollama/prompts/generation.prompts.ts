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
      ? `about "${topic}"`
      : 'about a random interesting topic';
    return `Write ${contentDescription} ${topicPhrase} in ${sourceLang}. The ENTIRE output (title and body) MUST be written in ${sourceLang}. The vocabulary and grammar should be appropriate for a ${proficiencyLevel} proficiency level learner. Include a title starting with '## '. Output ONLY the title and the text. Do not include any introductory or concluding remarks. Do NOT include translations or English text.`;
  } else {
    return `Write ${contentDescription} in ${sourceLang} about a robot learning to paint. Include a title starting with '## '. Output ONLY the title and the text. Do not include any introductory or concluding remarks. Do NOT include translations.`;
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

  return `You are a professional linguist. Generate exactly ${count} NEW, natural, and diverse example sentences in ${sourceLanguage} for the target word/phrase: "${word}"${definition ? ` (meaning: ${definition})` : ''}.${excludePart}

CRITICAL RULES:
1. Each example sentence MUST be written entirely in ${sourceLanguage} and use the word "${word}" (or a natural variation/conjugation of it) in context.
2. The translation of each sentence MUST be written entirely in ${targetLanguage} and accurately translate the sentence.
3. NEVER swap the languages: "sentence" is ${sourceLanguage} ONLY, and "translation" is ${targetLanguage} ONLY.
4. Return ONLY a valid JSON array of ${count} objects matching the structure below. Do not wrap the JSON in markdown code blocks (like \`\`\`json), and do not include any intro, outro, or explanation.

JSON Schema:
[
  {
    "sentence": "Example sentence in ${sourceLanguage} containing '${word}'",
    "translation": "Accurate translation in ${targetLanguage}"
  }
]`;
};
