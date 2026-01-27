import { useState, useMemo, useCallback } from 'react';

export interface ScanSentence {
    text: string;
    startIndex: number; // Index in the original tokens array
    endIndex: number;
}

export const useSentenceNavigation = (tokens: string[]) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Naive sentence detection (can be improved)
    // Reuses logic similar to existing ReaderUtils if available, but built fresh here for clarity.
    const sentences = useMemo(() => {
        const results: ScanSentence[] = [];
        let currentSentence: string[] = [];
        let startIndex = 0;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            currentSentence.push(token);

            // Check if token ends with sentence terminator
            // Ignoring internal periods like "Mr." is hard without NLP, but simple heuristic:
            // Ends with [.!?], maybe followed by quote/paren, AND is followed by whitespace/newline or End Of Text
            if (/[.!?]['"”’)]*$/.test(token)) {
                results.push({
                    text: currentSentence.join(''),
                    startIndex: startIndex,
                    endIndex: i
                });
                currentSentence = [];
                startIndex = i + 1;
            }
        }

        // Add remaining as a sentence fragment
        if (currentSentence.length > 0) {
            results.push({
                text: currentSentence.join(''),
                startIndex: startIndex,
                endIndex: tokens.length - 1
            });
        }

        // Filter empty sentences (e.g. just newlines) if desirable?
        // For now keep them to maintain text integrity
        return results.filter(s => s.text.trim().length > 0);
    }, [tokens]);

    const next = useCallback(() => {
        setCurrentIndex(prev => Math.min(prev + 1, sentences.length - 1));
    }, [sentences.length]);

    const prev = useCallback(() => {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
    }, []);

    const goTo = useCallback((index: number) => {
        if (index >= 0 && index < sentences.length) {
            setCurrentIndex(index);
        }
    }, [sentences.length]);

    const currentSentence = sentences[currentIndex] || null;

    return {
        sentences,
        currentIndex,
        currentSentence,
        next,
        prev,
        goTo,
        hasNext: currentIndex < sentences.length - 1,
        hasPrev: currentIndex > 0,
        totalSentences: sentences.length
    };
};
