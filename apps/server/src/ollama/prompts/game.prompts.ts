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
