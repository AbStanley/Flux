export const WRITING_ANALYSIS_PROMPT = (
  text: string,
  sourceLanguage: string,
) => `You are an expert ${sourceLanguage} copyeditor. Find every error in the text and return corrections as a JSON array.

Text: "${text}"

Return ONLY a JSON array — no markdown fences, no commentary, no explanation outside the array.
Each element:
{
  "mistake": "exact substring copied from the input text",
  "correction": "what it should be",
  "type": "Grammar" | "Spelling" | "Punctuation" | "Fluency" | "Duplication",
  "explanation": "brief reason"
}

RULES:
1. "mistake" must be an EXACT substring of the input — same case, same whitespace, same accents.
2. Keep corrections surgical — minimum wrong words, never rewrite whole sentences.
3. Catch: grammar, spelling, punctuation, accents, verb conjugation, gender agreement, word order, duplicated words/phrases.
4. Preserve the original meaning. Never flip negatives to positives.
5. If no errors exist, return an empty array: []
6. For duplicated words like "hoy hoy", the mistake is "hoy hoy" and the correction is "hoy".

Example input: "Yo soy esta bien hoy hoy"
Example output:
[
  {"mistake":"soy esta","correction":"estoy","type":"Grammar","explanation":"Use 'estar' not 'ser' for states"},
  {"mistake":"hoy hoy","correction":"hoy","type":"Duplication","explanation":"Repeated word"}
]`;
