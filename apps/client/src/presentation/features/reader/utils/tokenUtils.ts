// Helper to sanitize translation objects from legacy or bad cache entries safely
export const cleanTranslationObj = (val: unknown): string | undefined => {
    if (!val) return undefined;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') {
        const obj = val as Record<string, unknown>;
        if (obj && 'response' in obj) {
            return String(obj.response);
        }
    }
    return String(val);
};

// Helper to calculate collapsed text for visual space savings
export const getCollapsedText = (
    source: string | undefined,
    translation: string | undefined,
    isHovered: boolean
): string | undefined => {
    if (isHovered || !source || !translation) return undefined;
    
    // Truncation logic: If translation is longer than source, collapse it.
    // Limit visual width to roughly source text length.
    const sourceLen = source.trim().length;
    const transLen = translation.trim().length;

    if (transLen > sourceLen + 2) {
        if (sourceLen <= 4) return;
        return translation.slice(0, sourceLen - 1);
    }
    return undefined;
};

export interface TitleAndSpacesResult {
    headerParams: Set<number>;
    skipSpaceIndices: Set<number>;
}

export const parseTitleAndSpaces = (paginatedTokens: string[]): TitleAndSpacesResult => {
    const headerParams = new Set<number>();
    const skipSpaceIndices = new Set<number>();

    let isTitlePass = false;
    let skipSpacePass = false;

    paginatedTokens.forEach((t, i) => {
        const isHeader = /^#+$/.test(t.trim());
        if (isHeader) {
            isTitlePass = true;
            skipSpacePass = true;
        } else if (skipSpacePass) {
            if (!t.trim()) {
                skipSpaceIndices.add(i);
                skipSpacePass = false;
            } else {
                skipSpacePass = false;
            }
        }

        if (t.includes('\n')) {
            isTitlePass = false;
        }

        if (isTitlePass && !isHeader) {
            headerParams.add(i);
        }
    });

    return { headerParams, skipSpaceIndices };
};

export interface TokenizeMarkdownResult {
    tokens: string[];
    boldIndices: number[];
    italicIndices: number[];
}

export const tokenizeWithMarkdown = (text: string): TokenizeMarkdownResult => {
    const rawTokens = text.split(/(\s+)/);
    const tokens: string[] = [];
    const boldIndices: number[] = [];
    const italicIndices: number[] = [];

    let isBold = false;
    let isItalic = false;

    rawTokens.forEach((rawToken) => {
        const tokenText = rawToken;
        let tokenHasBold = false;
        let tokenHasItalic = false;
        let processedText = "";
        let i = 0;

        while (i < tokenText.length) {
            if (tokenText.startsWith("**", i)) {
                isBold = !isBold;
                i += 2;
            } else if (tokenText.startsWith("*", i)) {
                isItalic = !isItalic;
                i += 1;
            } else {
                if (isBold) tokenHasBold = true;
                if (isItalic) tokenHasItalic = true;
                processedText += tokenText[i];
                i += 1;
            }
        }

        // If it's a pure whitespace token, inherit the current state
        if (!processedText.trim()) {
            tokenHasBold = isBold;
            tokenHasItalic = isItalic;
        }

        const tokenIndex = tokens.length;
        tokens.push(processedText);

        if (tokenHasBold) {
            boldIndices.push(tokenIndex);
        }
        if (tokenHasItalic) {
            italicIndices.push(tokenIndex);
        }
    });

    return { tokens, boldIndices, italicIndices };
};
