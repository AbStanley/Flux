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
