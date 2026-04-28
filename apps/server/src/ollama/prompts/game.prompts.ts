export const getGameContentPrompt = (
  topic: string,
  level: string,
  mode: string,
  sourceLang: string,
  targetLang: string,
  limit: number = 10,
  _isStreaming: boolean = false,
  sourceLangCode: string = 'en-US',
  targetLangCode: string = 'es-ES'
): string => {
  const isStoryMode = mode === 'story';
  const contextInstruction =
    mode === 'scramble'
      ? 'Generate FULL SENTENCES.'
      : 'Generate simple words or short phrases.';

  const baseInstruction = `Return strictly a JSON array of objects. Do not include markdown code blocks or any other text.`;

  if (isStoryMode) {
    return `
      Generate a short cohesive story about "${topic}" in ${targetLang} (Level: ${level}).
      Split the story into ${limit} short segments.
      For each segment, identify a key phrase or word to translate to ${sourceLang}.

      ${baseInstruction}
      Each object must have:
      - "context": The story segment in ${targetLang}.
      - "question": The key phrase/word in ${targetLang} (from the segment).
      - "answer": The translation of the key phrase/word in ${sourceLang}.
      - "target_lang_code": ALWAYS "${targetLangCode}"
      - "source_lang_code": ALWAYS "${sourceLangCode}"
      - "type": "phrase"
      
      Example:
      [
          { "context": "Había una vez un gato.", "question": "gato", "answer": "cat", "target_lang_code": "${targetLangCode}", "source_lang_code": "${sourceLangCode}", "type": "phrase" }
      ]
      `;
  } else if (mode === 'scramble') {
    return `
      For "scramble" mode, generate ${limit} FULL SENTENCES about "${topic}".
      Current Level: ${level}
      
      ${baseInstruction}
      Each object must have:
      - "question": The full sentence in ${sourceLang} (for reference/hint).
      - "answer": The full sentence in ${targetLang} (this will be scrambled).
      - "target_lang_code": ALWAYS "${targetLangCode}"
      - "source_lang_code": ALWAYS "${sourceLangCode}"
      - "context": A brief explanation of grammar or context if needed.
      - "type": "phrase"

      Example:
     [
         { "question": "The cat sleeps on the sofa.", "answer": "El gato duerme en el sofá.", "target_lang_code": "${targetLangCode}", "source_lang_code": "${sourceLangCode}", "context": "Simple present.", "type": "phrase" }
     ]
      `;
  } else {
    // Default / Multiple Choice
    return `
      TRANSLATION DIRECTION: Translate from ${targetLang} to ${sourceLang}.
      
      Generate ${limit} items for a language learning game.
      Topic: "${topic}"
      Difficulty Level: ${level}
      Game Mode: ${mode} (${contextInstruction})

      ${baseInstruction}
      Each object must have:
      - "target_text": The word or phrase in ${targetLang}.
      - "target_lang_code": ALWAYS "${targetLangCode}"
      - "source_translation": The exact translation in ${sourceLang}.
      - "source_lang_code": ALWAYS "${sourceLangCode}"
      - "context": A short example sentence using the word in ${targetLang}.
      - "type": "word" or "phrase".

      CRITICAL CONSTRAINTS:
      1. FIELD NAMES: You MUST use "target_text" and "source_translation". DO NOT use "question" or "answer".
      2. LANGUAGES: 
         - "target_text" MUST be in ${targetLang}.
         - "source_translation" MUST be in ${sourceLang} (Translation).
      3. LANGUAGE CODES: 
         - Set "target_lang_code" to "${targetLangCode}".
         - Set "source_lang_code" to "${sourceLangCode}".
      4. ANTI-REPETITION: "source_translation" MUST NOT be in ${targetLang}.

      Example:
      [
          { "target_text": "Hola", "target_lang_code": "${targetLangCode}", "source_translation": "Hello", "source_lang_code": "${sourceLangCode}", "context": "Hola, ¿cómo estás?", "type": "word" }
      ]
      `;
  }
};
