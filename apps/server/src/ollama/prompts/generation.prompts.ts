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
      : 'about an engaging, culturally authentic, or unique topic';
    return `Write ${contentDescription} ${topicPhrase} in ${sourceLang}. 
The ENTIRE output (title and body) MUST be written in ${sourceLang}. 
The vocabulary, grammar structures, and complexity level MUST be appropriate for a ${proficiencyLevel} proficiency level language learner.

CRITICAL INSTRUCTIONS FOR LEARNING CONTENT:
1. Make the content versatile, engaging, and less generic (avoid repetitive patterns, clichés, or overly simple storylines). Use rich, natural language, diverse sentence structures, and contextualized vocabulary that aids acquisition.
2. Include a title starting with '## ' (e.g., '## Title').
3. Use Markdown formatting wisely and cleanly to improve structure:
   - Use bold ('**') for dialogue tags, speaker names (e.g. '**Anna:**'), or key target words.
   - Use italic ('*') for emphasis, inner thoughts, or narrator stage directions.
   - Ensure all markdown tags are properly opened and closed.
4. Output ONLY the title and the text of the story/monologue/conversation. Do NOT include any introductory or concluding remarks, translations, or English annotations.`;
  } else {
    return `Write ${contentDescription} in ${sourceLang} about a robot learning to paint. 
Include a title starting with '## '. 
Use Markdown formatting ('**' for bold, '*' for italic) cleanly and wisely to highlight key actions, dialogue tags, or expressions.
Output ONLY the title and the text. Do not include any introductory or concluding remarks or translations.`;
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
