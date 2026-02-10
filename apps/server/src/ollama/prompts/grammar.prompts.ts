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
