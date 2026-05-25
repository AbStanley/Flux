import type { SubtitleCue } from '../services/YouTubeService';
import { YouTubeService } from '../services/YouTubeService';

interface HistoryItem {
    text: string;
    time: number;
}

/** Check if two subtitle texts are essentially the same content */
export const isTextRedundant = (a: string, b: string): boolean => {
    const na = a.replace(/[.,!?¿¡\n]/g, '').toLowerCase().trim();
    const nb = b.replace(/[.,!?¿¡\n]/g, '').toLowerCase().trim();
    return na.includes(nb) || nb.includes(na);
};

/** Find how many words overlap between the end of oldText and start of newText */
export const findWordOverlap = (oldText: string, newText: string): number => {
    const wo = oldText.split(/\s+/);
    const wn = newText.split(/\s+/);
    for (let n = Math.min(wo.length, wn.length); n > 0; n--) {
        if (wo.slice(-n).join(' ') === wn.slice(0, n).join(' ')) return n;
    }
    return 0;
};

/** Process a new DOM subtitle text into a history entry */
export const buildDomHistoryEntry = (
    newText: string,
    oldText: string,
    currentTime: number,
    isSeekEvent: boolean,
    existingHistory: HistoryItem[],
): HistoryItem | null => {
    let textToAdd = newText;

    if (!isSeekEvent && oldText && newText.startsWith(oldText)) {
        textToAdd = newText.slice(oldText.length).trim();
    } else if (!isSeekEvent && oldText) {
        const overlap = findWordOverlap(oldText, newText);
        if (overlap > 0) {
            textToAdd = newText.split(/\s+/).slice(overlap).join(' ').trim();
        }
    }

    if (!textToAdd) return null;

    // Check for duplicates
    const isDup = existingHistory.some(h =>
        Math.abs(h.time - currentTime) < 5.0 && isTextRedundant(h.text, textToAdd)
    );
    if (isDup) return null;

    return { text: textToAdd, time: currentTime };
};

/** Find the best history item to display for the given time */
export const findDisplayFromHistory = (
    history: HistoryItem[],
    time: number,
    domCue: SubtitleCue | null,
    currentTime: number,
): { current: SubtitleCue | null; prev: SubtitleCue | null } => {
    if (history.length === 0) {
        return {
            current: domCue ? { start: currentTime, duration: 0, text: domCue.text } : null,
            prev: null,
        };
    }

    let bestIdx = -1;
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].time <= time + 0.2) { bestIdx = i; break; }
    }

    if (bestIdx !== -1 && (time - history[bestIdx].time < 8.0)) {
        const item = history[bestIdx];
        const prevItem = bestIdx > 0 ? history[bestIdx - 1] : null;
        const showPrev = prevItem && !isTextRedundant(prevItem.text, item.text);

        return {
            current: { start: item.time, duration: 0, text: item.text },
            prev: showPrev && prevItem
                ? { start: prevItem.time, duration: 0, text: prevItem.text }
                : null,
        };
    }

    if (domCue) {
        return {
            current: { start: currentTime, duration: 0, text: domCue.text },
            prev: null,
        };
    }

    return { current: null, prev: null };
};

/** Read current DOM subtitle text (delegates to YouTubeService) */
export const getDomSubtitle = () => YouTubeService.getSubtitleFromDom();
