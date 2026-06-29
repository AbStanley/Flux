
import type { IAIService } from '../../../../../core/interfaces/IAIService';

/**
 * Module-level dedup cache for in-flight translation requests.
 * Must remain module-level so deduplication works across concurrent calls.
 */
export const pendingRequests = new Map<string, Promise<string | null>>();

/**
 * Extracts a sentence-like context window around the given token index.
 * Uses ±25 tokens, refined to sentence boundaries when possible.
 */
export const getContextForIndex = (tokens: string[], index: number): string => {
    if (index < 0 || index >= tokens.length) return '';

    const WINDOW_SIZE = 25;
    const start = Math.max(0, index - WINDOW_SIZE);
    const end = Math.min(tokens.length - 1, index + WINDOW_SIZE);

    let refinedStart = start;
    for (let i = index - 1; i >= start; i--) {
        if (/[.!?\n]/.test(tokens[i])) {
            refinedStart = i + 1;
            break;
        }
    }

    let refinedEnd = end;
    for (let i = index; i <= end; i++) {
        if (/[.!?\n]/.test(tokens[i])) {
            refinedEnd = i;
            break;
        }
    }

    return tokens.slice(refinedStart, refinedEnd + 1).join('').trim();
};

/**
 * Groups a set of selected token indices into contiguous ranges.
 * Punctuation / whitespace / symbols between indices are treated as bridgeable gaps;
 * only actual word-like content or newlines break contiguity.
 */
export const getSelectionGroups = (indices: Set<number>, tokens: string[]): number[][] => {
    const sorted = Array.from(indices).sort((a, b) => a - b);
    if (sorted.length === 0) return [];

    const groups: number[][] = [];
    let currentGroup: number[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        let isContiguous = true;

        // Check if the previous token ends a sentence/phrase
        // or if we are crossing a sentence boundary
        if (/[.!?;:…]["'»\]})]*\s*$/.test(tokens[prev])) {
            isContiguous = false;
        }

        if (isContiguous) {
            for (let k = prev + 1; k < curr; k++) {
                const hasContent = /[\p{L}\p{N}]/u.test(tokens[k]);
                // Any sentence boundary punctuation in the gap also breaks contiguity
                const hasBoundary = /[.!?;:…¡¿]/.test(tokens[k]); 
                if (hasContent || tokens[k].includes('\n') || hasBoundary) {
                    isContiguous = false;
                    break;
                }
            }
        }

        // Check if current token starts with inverted punctuation (Spanish)
        if (isContiguous && /^\s*["'«[{(]*[¡¿]/.test(tokens[curr])) {
            isContiguous = false;
        }

        if (isContiguous) {
            currentGroup.push(curr);
        } else {
            groups.push(currentGroup);
            currentGroup = [curr];
        }
    }

    groups.push(currentGroup);
    return groups
        .map(group => {
            let start = 0;
            while (start < group.length && !tokens[group[start]].trim()) {
                start++;
            }
            let end = group.length - 1;
            while (end >= start && !tokens[group[end]].trim()) {
                end--;
            }
            return group.slice(start, end + 1);
        })
        .filter(group => group.length > 0);
};

/**
 * Fetches a translation with configurable timeout and retry count.
 * Increased to 30s default to handle slower Ollama/LLM responses.
 * Returns null on exhausted retries or empty input.
 */
export const fetchTranslationHelper = async (
    text: string,
    context: string,
    sourceLang: string,
    targetLang: string,
    aiService: IAIService,
    retries = 3,
    signal?: AbortSignal,
    traceId?: string,
): Promise<string | null> => {
    if (!text.trim()) return null;

    let attempt = 0;
    while (attempt < retries) {
        if (signal?.aborted) return null;

        const attemptController = new AbortController();
        const onParentAbort = () => attemptController.abort();

        if (signal) {
            signal.addEventListener("abort", onParentAbort);
        }

        try {
            const result = await aiService.translateText(
                text.trim(),
                targetLang,
                context,
                sourceLang,
                attemptController.signal,
                traceId
            );
            if (typeof result === 'object' && result !== null && 'response' in result) {
                return (result as { response: string }).response;
            }
            return result as string;
        } catch (error: unknown) {
            attempt++;
            
            // If the parent request was aborted (user hovered off or re-triggered), exit immediately
            if (signal?.aborted) return null;

            const errorMsg = error instanceof Error ? error.message : String(error);
            console.warn(`Translation attempt ${attempt} failed:`, errorMsg);

            // Immediately fail and alert on quota limit/throttling errors to avoid useless retries
            const isLimitError = errorMsg.toLowerCase().includes('limit') || 
                                 errorMsg.toLowerCase().includes('throttler') || 
                                 errorMsg.toLowerCase().includes('too many requests');
            if (isLimitError) {
                alert(errorMsg);
                return null;
            }

            if (attempt >= retries) {
                console.error(`Translation failed after ${retries} retries for text: "${text}"`);
                return null;
            }

            // Exponential backoff: 500ms, 1s, 1.5s, etc.
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        } finally {
            if (signal) {
                signal.removeEventListener("abort", onParentAbort);
            }
        }
    }

    return null;
};

/** Strip leading/trailing punctuation so translations and cache keys are clean */
export const stripPunctuation = (s: string): string =>
    s.replace(/^[\s.,;:!?¡¿"""''«»()[\]{}\-–—…]+|[\s.,;:!?¡¿"""''«»()[\]{}\-–—…]+$/g, '');
