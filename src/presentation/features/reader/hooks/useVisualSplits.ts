import { useLayoutEffect, useState, type RefObject } from 'react';

interface VisualSplitParams {
    groups: number[][]; // Array of indices arrays
    selectionTranslations: Map<string, string>;
    paginatedTokens: string[]; // Or the full tokens list depending on context, assuming usage context
    currentPage: number;
    PAGE_SIZE: number;
    textAreaRef: RefObject<HTMLDivElement | null>;
}

export const useVisualSplits = ({
    groups,
    selectionTranslations,
    currentPage,
    PAGE_SIZE,
    textAreaRef
}: VisualSplitParams) => {
    const [visualGroupStarts, setVisualGroupStarts] = useState<Map<number, string>>(new Map());

    useLayoutEffect(() => {
        const calculateVisualStarts = () => {
            const newVisualStarts = new Map<number, string>();

            groups.forEach(group => {
                const start = group[0];
                const end = group[group.length - 1];
                const key = `${start}-${end}`;
                const fullTranslation = selectionTranslations.get(key);

                if (!fullTranslation) return;

                // 1. Get DOM elements
                const tokenElements: { index: number, el: HTMLElement, top: number }[] = [];
                for (let i = start; i <= end; i++) {
                    const el = document.getElementById(`token-${i}`);
                    if (el) {
                        tokenElements.push({ index: i, el, top: el.getBoundingClientRect().top });
                    }
                }

                if (tokenElements.length === 0) return;

                // 2. Group by visual line (allow small tolerance for float layout)
                const lines: { startIndex: number, count: number }[] = [];
                let currentLineStart = tokenElements[0];
                let currentCount = 1;
                let lastTop = currentLineStart.top;

                for (let i = 1; i < tokenElements.length; i++) {
                    const token = tokenElements[i];
                    if (Math.abs(token.top - lastTop) > 5) {
                        // New Line detected
                        lines.push({ startIndex: currentLineStart.index, count: currentCount });
                        currentLineStart = token;
                        currentCount = 1;
                        lastTop = token.top;
                    } else {
                        currentCount++;
                    }
                }
                // Push last line
                lines.push({ startIndex: currentLineStart.index, count: currentCount });

                // 3. Split translation string
                // Heuristic: Split proportional to token count
                const words = fullTranslation.split(' ');
                const totalTokens = tokenElements.length;

                let wordCursor = 0;
                lines.forEach((line, lineIdx) => {
                    if (lineIdx === lines.length - 1) {
                        // Last line gets the rest
                        const segment = words.slice(wordCursor).join(' ');
                        if (segment) newVisualStarts.set(line.startIndex, segment);
                    } else {
                        const lineShare = line.count / totalTokens;
                        const wordCountForLine = Math.max(1, Math.round(words.length * lineShare));
                        const segment = words.slice(wordCursor, wordCursor + wordCountForLine).join(' ');
                        if (segment) newVisualStarts.set(line.startIndex, segment);
                        wordCursor += wordCountForLine;
                    }
                });
            });

            setVisualGroupStarts(newVisualStarts);
        };

        // Initial run
        // We use requestAnimationFrame to ensure the DOM has painted/laid out before measuring
        // This is especially important for the first render
        requestAnimationFrame(calculateVisualStarts);

        // Use ResizeObserver to detect container size changes
        if (!textAreaRef.current) return;

        let resizeTimer: ReturnType<typeof setTimeout>;
        const resizeObserver = new ResizeObserver(() => {
            // Debounce the calculation to improve performance during resize
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                requestAnimationFrame(calculateVisualStarts);
            }, 50); // Small 50ms delay
        });

        resizeObserver.observe(textAreaRef.current);

        return () => {
            resizeObserver.disconnect();
            clearTimeout(resizeTimer);
        };

    }, [groups, selectionTranslations, currentPage, PAGE_SIZE]); // Deps aligned with inputs

    return visualGroupStarts;
};
