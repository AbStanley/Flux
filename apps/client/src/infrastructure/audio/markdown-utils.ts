/**
 * Strips markdown and HTML formatting from raw text, returning a clean text
 * and an indexMap that maps each character in cleanText back to its index in rawText.
 */
export function stripMarkdown(rawText: string): { cleanText: string; indexMap: number[] } {
    let cleanText = "";
    const indexMap: number[] = [];
    let i = 0;
    const len = rawText.length;

    while (i < len) {
        // 1. Skip Image markdown: ![alt](url)
        if (rawText.startsWith("![", i)) {
            const closeBracket = rawText.indexOf("]", i + 2);
            if (closeBracket !== -1 && rawText[closeBracket + 1] === "(") {
                const closeParen = rawText.indexOf(")", closeBracket + 2);
                if (closeParen !== -1) {
                    i = closeParen + 1;
                    continue;
                }
            }
        }

        // 2. Link markdown: [text](url) -> keep text, skip (url)
        if (rawText[i] === "[") {
            const closeBracket = rawText.indexOf("]", i + 1);
            if (closeBracket !== -1 && rawText[closeBracket + 1] === "(") {
                const closeParen = rawText.indexOf(")", closeBracket + 2);
                if (closeParen !== -1) {
                    i++;
                    while (i < closeBracket) {
                        cleanText += rawText[i];
                        indexMap.push(i);
                        i++;
                    }
                    i = closeParen + 1;
                    continue;
                }
            }
        }

        // 3. Skip bold/italic markers: **, __, *, _, ~~, `
        if (rawText.startsWith("**", i) || rawText.startsWith("__", i) || rawText.startsWith("~~", i)) {
            i += 2;
            continue;
        }
        if (rawText[i] === "*" || rawText[i] === "_" || rawText[i] === "`") {
            i++;
            continue;
        }

        // 4. Skip headers: # at start of line or text
        if (rawText[i] === "#") {
            let isHeader = false;
            if (i === 0) {
                isHeader = true;
            } else {
                let prev = i - 1;
                while (prev >= 0 && (rawText[prev] === " " || rawText[prev] === "\t")) {
                    prev--;
                }
                if (prev < 0 || rawText[prev] === "\n" || rawText[prev] === "\r") {
                    isHeader = true;
                }
            }
            if (isHeader) {
                while (i < len && rawText[i] === "#") {
                    i++;
                }
                if (i < len && rawText[i] === " ") {
                    i++;
                }
                continue;
            }
        }

        // 5. Skip HTML tags: <tag> -> skip completely
        if (rawText[i] === "<") {
            const closeAngle = rawText.indexOf(">", i + 1);
            if (closeAngle !== -1) {
                const content = rawText.slice(i + 1, closeAngle).trim();
                if (/^[a-zA-Z/!]/.test(content)) {
                    i = closeAngle + 1;
                    continue;
                }
            }
        }

        // 6. Default: copy character
        cleanText += rawText[i];
        indexMap.push(i);
        i++;
    }

    return { cleanText, indexMap };
}
