import { useState, useCallback } from 'react';
import { isTextRedundant } from './useYouTubeSubtitleHelpers';

export interface HistoryItem {
    text: string;
    time: number;
}

/**
 * Isolated history state management hook for YouTube subtitles.
 * Provides robust duplicate prevention, rolling updates, and chronologically-based comparison
 * to support seeking back and re-watching sections cleanly.
 */
export function useYouTubeHistory() {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    const addToHistory = useCallback((text: string, time: number) => {
        setHistory(h => {
            // Check for exact time match or very similar entry already present
            if (h.some(item => Math.abs(item.time - time) < 0.1 || (Math.abs(item.time - time) < 2.0 && item.text === text))) {
                return h;
            }
            const next = [...h, { text, time }].sort((a, b) => a.time - b.time);
            return next.slice(-1000);
        });
    }, []);

    const updateHistoryFromDom = useCallback((newText: string, ct: number) => {
        setHistory(prev => {
            if (prev.length === 0) return [{ text: newText, time: ct }];

            // Find the index of the closest past item in history (largest time <= ct + 0.5)
            let lastPastIdx = -1;
            for (let i = prev.length - 1; i >= 0; i--) {
                if (prev[i].time <= ct + 0.5) {
                    lastPastIdx = i;
                    break;
                }
            }

            // If we found a past item, compare against it
            if (lastPastIdx !== -1) {
                const lastPast = prev[lastPastIdx];
                if (isTextRedundant(lastPast.text, newText)) {
                    if (newText.length <= lastPast.text.length) {
                        return prev;
                    }
                    const next = [...prev];
                    next[lastPastIdx] = { ...lastPast, text: newText };
                    return next;
                }
            }

            // Safety duplicate check: if there is ANY entry within 5.0 seconds that has redundant text
            const isDup = prev.some(h => Math.abs(h.time - ct) < 5.0 && isTextRedundant(h.text, newText));
            if (isDup) {
                return prev;
            }

            // Create a new entry
            const next = [...prev, { text: newText, time: ct }].sort((a, b) => a.time - b.time);
            return next.slice(-1000);
        });
    }, []);

    return {
        history,
        clearHistory,
        addToHistory,
        updateHistoryFromDom,
    };
}
