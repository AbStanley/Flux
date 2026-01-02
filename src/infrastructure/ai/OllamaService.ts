import type { IAIService } from '../../core/interfaces/IAIService';

export class OllamaService implements IAIService {
    private baseUrl: string;
    private model: string;

    constructor(baseUrl: string = '', model: string = 'llama2') {
        console.log('[OllamaService] Initializing adapter with baseUrl:', baseUrl || '(empty/relative)');
        this.baseUrl = baseUrl;
        this.model = model;
    }

    async generateText(prompt: string, options?: {
        onProgress?: (chunk: string, fullText: string) => void;
        signal?: AbortSignal;
        [key: string]: any
    }): Promise<string> {
        try {
            const isStreaming = !!options?.onProgress;

            const body = {
                model: this.model,
                prompt: prompt,
                stream: isStreaming,
                ...options
            };

            // Remove our custom options from the body sent to Ollama
            delete body.onProgress;
            delete body.signal;

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: options?.signal
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            if (isStreaming && response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullText = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const json = JSON.parse(line);
                            if (json.response) {
                                fullText += json.response;
                                options.onProgress?.(json.response, fullText);
                            }
                            if (json.done) return fullText;
                        } catch (e) {
                            console.warn('Error parsing JSON chunk', e);
                        }
                    }
                }
                return fullText;
            } else {
                const data = await response.json();
                return data.response;
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Ollama generation aborted');
                throw error;
            }
            console.error('Ollama generation failed:', error);
            throw error;
        }
    }

    async translateText(text: string, targetLanguage: string = 'en', context?: string, sourceLanguage?: string): Promise<string> {
        // Ollama translation usually requires a specific prompt engineering or a translation model.
        // DEBUGGING: Log parameters
        console.log(`[OllamaService] translateText`, { text, target: targetLanguage, source: sourceLanguage });

        const fromLang = (sourceLanguage && sourceLanguage !== 'Auto') ? `from ${sourceLanguage} ` : '';

        // Dictionary-style prompt to force isolation
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
(Just the translation text)`;

        if (context) {
            prompt += `\n\nContext: "${context}"`;
            prompt += `\nTarget Text: "${text}"`;
        } else {
            prompt += `\n\nTarget Text: "${text}"`;
        }

        const rawResponse = await this.generateText(prompt);

        // Post-processing to remove <think> blocks and whitespace
        return rawResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    }

    async getRichTranslation(text: string, targetLanguage: string = 'en', context?: string, sourceLanguage?: string): Promise<any> {
        console.log(`[OllamaService] getRichTranslation`, { text, target: targetLanguage, source: sourceLanguage });

        const fromLang = (sourceLanguage && sourceLanguage !== 'Auto') ? `from ${sourceLanguage} ` : '';

        const prompt = `Role: Expert Linguist and Translator.
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

        // Use a larger token limit for rich translation to ensure JSON isn't truncated
        const rawResponse = await this.generateText(prompt, { num_predict: 4096 });

        // Robust JSON extraction
        // 1. Remove <think> blocks
        let cleanResponse = rawResponse.replace(/<think>[\s\S]*?<\/think>/g, '');

        // 2. Extract JSON block if present (Markdown code fence)
        const jsonBlockMatch = cleanResponse.match(/```json([\s\S]*?)```/);
        if (jsonBlockMatch) {
            cleanResponse = jsonBlockMatch[1];
        } else {
            // Fallback: Try to find the first '{' and last '}'
            const start = cleanResponse.indexOf('{');
            const end = cleanResponse.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                cleanResponse = cleanResponse.substring(start, end + 1);
            }
        }

        cleanResponse = cleanResponse.trim();



        try {
            const data = JSON.parse(cleanResponse);

            // Post-processing to normalize data structures
            if (data.examples && Array.isArray(data.examples)) {
                data.examples = data.examples.map((ex: any) => {
                    if (typeof ex === 'string') {
                        return { sentence: ex, translation: "" };
                    }
                    return {
                        sentence: ex.sentence || ex.example || ex.text || ex.source || "",
                        translation: ex.translation || ex.meaning || ""
                    };
                }).filter((ex: any) => ex.sentence);
            }

            return data;
        } catch (e) {
            console.warn("Initial JSON parse failed, attempting fallback extraction...", e);

            // Fallback: Use Regex to at least extract translation and main parts if JSON is completely broken
            const translationMatch = rawResponse.match(/"translation":\s*"([^"]+)"/);
            const segmentMatch = rawResponse.match(/"segment":\s*"([^"]+)"/);

            if (translationMatch) {
                return {
                    translation: translationMatch[1],
                    segment: segmentMatch ? segmentMatch[1] : text,
                    // Return empty structures for the rest so UI doesn't crash
                    grammar: { partOfSpeech: "Unknown" },
                    examples: [],
                    alternatives: []
                };
            }

            console.error("Failed to parse rich translation JSON", rawResponse);
            throw new Error("Failed to parse rich translation response and fallback failed");
        }
    }

    async getAvailableModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.models?.map((m: any) => m.name) || [];
        } catch (error) {
            console.error('Failed to fetch Ollama models:', error);
            return [];
        }
    }

    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`); // Simple endpoint to check connectivity
            return response.ok;
        } catch {
            return false;
        }
    }
}
