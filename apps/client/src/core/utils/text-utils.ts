// Helper to find sentence boundaries
export const getSentenceRange = (index: number, tokens: string[]): number[] => {
    // Common abbreviations that shouldn't end a sentence
    const abbreviations = new Set([
        'mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'sr.', 'jr.', 'vs.', 'etc.', 'fig.', 'al.', 'gen.', 'rep.', 'sen.', 'gov.', 'est.', 'no.', 'op.', 'vol.', 'pp.'
    ]);

    const isSentenceEnd = (token: string) => {
        const t = token.trim();
        if (!t) return false;

        // Basic punctuation check
        const hasPunctuation = /[.!?]['"”’\)]*$/.test(t);
        if (!hasPunctuation) return false;

        // Check if it's an abbreviation
        const lowerToken = t.toLowerCase();
        // Remove trailing quotes/brackets for abbreviation check
        const cleaned = lowerToken.replace(/['"”’\)]+$/, '');

        if (abbreviations.has(cleaned)) {
            return false;
        }

        return true;
    };

    // 1. Search Start (Backwards)
    let start = index;

    // Look backwards from the token *before* the current one
    let i = index - 1;
    while (i >= 0) {
        const token = tokens[i];

        // Explicit newline check
        if (token.includes('\n')) {
            start = i + 1;
            break;
        }

        // If it's a non-whitespace word, check if it ENDS a sentence
        if (token.trim()) {
            if (isSentenceEnd(token)) {
                start = i + 1;
                break;
            }
        }

        // If we reach index 0, that's the start
        if (i === 0) {
            start = 0;
        }
        i--;
    }

    // 2. Search End (Forwards)
    let end = index;

    // Look forwards starting from current
    i = index;
    while (i < tokens.length) {
        const token = tokens[i];

        // CRITICAL FIX: explicit newline check
        if (token.includes('\n')) {
            end = Math.max(index, i - 1);
            break;
        }

        if (token.trim()) {
            if (isSentenceEnd(token)) {
                end = i;
                break;
            }
        }

        // If we reach the last token
        if (i === tokens.length - 1) {
            end = i;
        }
        i++;
    }

    // Optimization: Trim leading whitespace
    while (start <= end && (!tokens[start] || !tokens[start].trim())) {
        start++;
    }

    // Optimization: Trim trailing whitespace
    while (end >= start && (!tokens[end] || !tokens[end].trim())) {
        end--;
    }

    const range: number[] = [];
    for (let k = start; k <= end; k++) {
        range.push(k);
    }
    return range;
};
