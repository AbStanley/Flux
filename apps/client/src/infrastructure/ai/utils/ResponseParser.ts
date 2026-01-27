import { normalizePartOfSpeech, type GrammaticalGender, type TranslationType } from "../../../core/types/Linguistics";
import type { RichTranslationResult } from "../../../core/interfaces/IAIService";

export const cleanResponse = (response: string): string => {
    // Remove <think> blocks
    return response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
};

export const extractJson = (response: string): unknown => {
    let clean = cleanResponse(response);

    // Extract JSON block if present (Markdown code fence)
    const jsonBlockMatch = clean.match(/```json([\s\S]*?)```/);
    if (jsonBlockMatch) {
        clean = jsonBlockMatch[1];
    } else {
        // Fallback: Try to find the first '{' and last '}'
        const start = clean.indexOf('{');
        const end = clean.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            clean = clean.substring(start, end + 1);
        }
    }

    clean = clean.trim();

    try {
        return JSON.parse(clean);
    } catch (e) {
        // Fallback: simple regex extraction if JSON parse fails
        const translationMatch = response.match(/"translation":\s*"([^"]+)"/);
        const segmentMatch = response.match(/"segment":\s*"([^"]+)"/);

        if (translationMatch) {
            return {
                type: 'word', // Default fallback
                translation: translationMatch[1],
                segment: segmentMatch ? segmentMatch[1] : "",
                // Return empty structures for the rest so UI doesn't crash
                grammar: { partOfSpeech: "unknown" },
                examples: [],
                alternatives: []
            };
        }
        throw e;
    }
};

export const normalizeRichTranslation = (data: Record<string, unknown>): RichTranslationResult => {
    // Normalize type
    if (data.type) {
        const typeLower = (data.type as string).toLowerCase();
        if (typeLower === 'word' || typeLower === 'sentence') {
            data.type = typeLower as TranslationType;
        } else {
            // Default or fallback logic if needed, but for now strict check or leave as is (which TS might complain about if we returned strict type, but we return 'any')
            // Let's force it to be valid if possible, or undefined if invalid
            data.type = undefined;
        }
    }

    // Normalize examples
    if (data.examples && Array.isArray(data.examples)) {
        data.examples = data.examples.map((ex: unknown) => {
            if (typeof ex === 'string') {
                return { sentence: ex, translation: "" };
            }
            const exObj = ex as Record<string, unknown>;
            return {
                sentence: exObj.sentence || exObj.example || exObj.text || exObj.source || "",
                translation: exObj.translation || exObj.meaning || ""
            };
        }).filter((ex: unknown) => (ex as Record<string, unknown>).sentence);
    }

    // Normalize Grammar Fields
    if (data.grammar) {
        const grammar = data.grammar as Record<string, unknown>;
        if (grammar.partOfSpeech) {
            grammar.partOfSpeech = normalizePartOfSpeech(grammar.partOfSpeech as string);
        }

        // Normalize Gender to lowercase to match union
        if (grammar.gender) {
            grammar.gender = (grammar.gender as string).toLowerCase() as GrammaticalGender;
        }
    }

    // Normalize and Deduplicate Conjugations
    if (data.conjugations) {
        const conjugations = data.conjugations as Record<string, unknown>;
        for (const tense in conjugations) {
            if (Array.isArray(conjugations[tense])) {
                const forms = conjugations[tense] as Array<{ pronoun: string; conjugation: string }>;

                // Deduplicate based on pronoun + conjugation to avoid repeating "ona zavet" twice
                const seen = new Set<string>();
                conjugations[tense] = forms.filter(item => {
                    const key = `${item.pronoun?.toLowerCase()}-${item.conjugation?.toLowerCase()}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
            }
        }
    }

    return data as unknown as RichTranslationResult;
};
