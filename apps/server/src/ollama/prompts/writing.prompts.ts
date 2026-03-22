export const WRITING_ANALYSIS_PROMPT = (
  text: string,
  sourceLanguage: string,
) => `You are an expert ${sourceLanguage} copyeditor. Your task is to completely rewrite the following text to correct any grammar, spelling, or phrasing errors.
Text: "${text}"

Provide a JSON response with the following structure:
{
  "text": [
    "The fully corrected version of the first sentence/paragraph.",
    "The fully corrected version of the second sentence/paragraph, etc..."
  ],
  "corrections": [
    {
      "type": "Grammar",
      "shortDescription": "GRAMMAR",
      "longDescription": "Brief explanation of the error",
      "mistakeText": "The original incorrect wording",
      "correctionText": "The new corrected wording that you used in the 'text' field"
    }
  ]
}

STRICT RULES:
1. COMPREHENSIVE CORRECTION: Focus on correcting Grammar, Spelling, Punctuation, and Fluency/Style errors. Categorize them correctly in the 'type' field using one of these: "Grammar", "Spelling", "Punctuation", "Fluency".
2. PRESERVE MEANING: Never change the fundamental meaning or intent of the sentence. NEVER change a negative statement to a positive one.
3. MINIMAL INTERVENTION: Only suggest a correction if a word is objectively wrong. If no errors are found, return the original text precisely as provided, and an empty array for 'corrections'.
4. STRICT CORRESPONDENCE & SURGICAL PRECISION: Every change you make to the 'text' MUST have a corresponding entry in the 'corrections' array. 'mistakeText' MUST exactly match the old text. 'correctionText' MUST exactly match the new text. CRITICAL: Keep both 'mistakeText' and 'correctionText' AS SHORT AS POSSIBLE (strictly 1-3 words). Never include surrounding correct words, whole phrases, or entire clauses. Only highlight the exact words that were modified.
5. PROCESS ENTIRE DOCUMENT: You MUST process the ENTIRE provided text, including all sentences and paragraphs. Do not truncate the output.
6. AVOID NEWLINE CRASHES: The 'text' field MUST be an ARRAY of strings, split by sentence or paragraph. Do not use literal newlines. Only output valid JSON. No markdown content.`;
