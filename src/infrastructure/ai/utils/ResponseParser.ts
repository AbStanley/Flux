export const cleanResponse = (response: string): string => {
    // Remove <think> blocks
    return response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
};

export const extractJson = (response: string): any => {
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
                translation: translationMatch[1],
                segment: segmentMatch ? segmentMatch[1] : "",
                // Return empty structures for the rest so UI doesn't crash
                grammar: { partOfSpeech: "Unknown" },
                examples: [],
                alternatives: []
            };
        }
        throw e;
    }
};

export const normalizeRichTranslation = (data: any): any => {
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
};
