export interface CorrectionToken {
    kind: 'correction';
    wrong: string;
    correct: string;
    explanation: string;
}

export interface ConfirmationToken {
    kind: 'confirmation';
    text: string;
    explanation: string;
}

export interface VocabToken {
    kind: 'vocab';
    term: string;
    meaning: string;
}

export interface TextToken {
    kind: 'text';
    value: string;
}

export type Token = CorrectionToken | ConfirmationToken | VocabToken | TextToken;

function stripQuotes(s: string): string {
    return s.replace(/^[""\u201C\u201D'"]+|[""\u201C\u201D'"]+$/g, '');
}

export function parseContent(content: string): Token[] {
    const tokens: Token[] = [];
    const regex = /\[(correction|vocab):\s*(.+?)\]/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            tokens.push({ kind: 'text', value: content.slice(lastIndex, match.index) });
        }

        const type = match[1];
        const inner = match[2];

        if (type === 'correction') {
            const arrowMatch = inner.match(
                /[""\u201C]?(.+?)[""\u201D]?\s*(?:→|->|-->)+\s*[""\u201C]?(.+?)[""\u201D]?(?:\s*\|\s*(.+))?$/
            );
            if (arrowMatch) {
                const wrong = stripQuotes(arrowMatch[1].trim());
                const correct = stripQuotes(arrowMatch[2].trim());
                const explanation = stripQuotes(arrowMatch[3]?.trim() || '');
                if (wrong.toLowerCase() === correct.toLowerCase()) {
                    // No-op correction (the LLM verified the user's text was fine).
                    // Always surface a small "Looks good" chip so the user gets
                    // visible acknowledgment instead of a missing tag.
                    tokens.push({ kind: 'confirmation', text: wrong, explanation });
                } else {
                    tokens.push({
                        kind: 'correction',
                        wrong,
                        correct,
                        explanation,
                    });
                }
            } else {
                tokens.push({ kind: 'text', value: match[0] });
            }
        } else {
            const dashMatch = inner.match(/[""\u201C]?(.+?)[""\u201D]?\s*(?:—|–|-)+\s*(.+)/);
            if (dashMatch) {
                tokens.push({
                    kind: 'vocab',
                    term: stripQuotes(dashMatch[1].trim()),
                    meaning: stripQuotes(dashMatch[2].trim()),
                });
            } else {
                tokens.push({ kind: 'text', value: match[0] });
            }
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
        tokens.push({ kind: 'text', value: content.slice(lastIndex) });
    }

    return tokens;
}
