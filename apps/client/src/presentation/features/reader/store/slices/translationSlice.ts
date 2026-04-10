import type { StateCreator } from 'zustand';
import type { IAIService } from '../../../../../core/interfaces/IAIService';
import {
    getContextForIndex,
    getSelectionGroups,
    fetchTranslationHelper,
    pendingRequests,
} from './translationUtils';

export interface TranslationSlice {
    translationCache: Map<string, string>;
    selectionTranslations: Map<string, string>;
    hoveredIndex: number | null;
    hoverTranslation: string | null;
    hoverSource: 'token' | 'popup' | null;
    showTranslations: boolean;

    translateSelection: (
        indices: Set<number>,
        tokens: string[],
        sourceLang: string,
        targetLang: string,
        aiService: IAIService,
        force?: boolean,
        targetIndex?: number
    ) => Promise<void>;

    handleHover: (
        index: number,
        source: 'token' | 'popup',
        tokens: string[],
        currentPage: number,
        PAGE_SIZE: number,
        sourceLang: string,
        targetLang: string,
        aiService: IAIService
    ) => Promise<void>;

    regenerateHover: (
        index: number,
        tokens: string[],
        currentPage: number,
        PAGE_SIZE: number,
        sourceLang: string,
        targetLang: string,
        aiService: IAIService
    ) => Promise<void>;

    clearHover: () => void;
    toggleShowTranslations: () => void;
    clearSelectionTranslations: () => void;
    removeTranslation: (key: string, text?: string, targetLang?: string) => void;
}

export const createTranslationSlice: StateCreator<TranslationSlice> = (set, get) => ({
    translationCache: new Map(), // <"text_targetLang", translation>
    selectionTranslations: new Map(),
    hoveredIndex: null,
    hoverTranslation: null,
    hoverSource: null,
    showTranslations: true,

    translateSelection: async (indices, tokens, sourceLang, targetLang, aiService, force = false, targetIndex?: number) => {
        if (indices.size === 0) return;

        const groups = getSelectionGroups(indices, tokens);
        const currentCache = get().translationCache;
        const currentTranslations = get().selectionTranslations;

        const nextTranslations = new Map(currentTranslations);
        const nextCache = new Map(currentCache);
        let updatesPending = false;

        // Groups to recursively process (from overlaps)
        const additionalGroupsToTranslate: Set<number>[] = [];

        // 1. OPTIMISTIC UPDATE
        for (const group of groups) {
            if (group.length === 0) continue;
            if (targetIndex !== undefined && !group.includes(targetIndex)) continue;

            const start = group[0];
            const end = group[group.length - 1];
            const key = `${start}-${end}`;

            if (!force && nextTranslations.has(key)) continue;

            // Cleanup subsets AND Overlaps
            for (const existingKey of nextTranslations.keys()) {
                const [exStart, exEnd] = existingKey.split('-').map(Number);

                // If it's the exact same key:
                if (existingKey === key) {
                    // If forced, we remove it to re-trigger loading state below
                    if (force) nextTranslations.delete(existingKey);
                    continue;
                }

                // SUBSET CHECK (Existing is INSIDE new): Remove it
                if (exStart >= start && exEnd <= end) {
                    nextTranslations.delete(existingKey);
                    continue;
                }

                // OVERLAP CHECK (Existing INTERSECTS new, but is not inside): Split it
                // Intersection logic: max(start1, start2) <= min(end1, end2)
                const isOverlapping = Math.max(start, exStart) <= Math.min(end, exEnd);
                if (isOverlapping) {
                    // Remove current overlapping translation
                    nextTranslations.delete(existingKey);

                    // Identify Non-Overlapping Remainder of the Existing Group
                    const remainderIndices = new Set<number>();
                    for (let i = exStart; i <= exEnd; i++) {
                        if (i < start || i > end) {
                            remainderIndices.add(i);
                        }
                    }

                    if (remainderIndices.size > 0) {
                        additionalGroupsToTranslate.push(remainderIndices);
                    }
                }
            }

            const textToTranslate = tokens.slice(start, end + 1).join('');
            const cacheKey = `${textToTranslate}_${targetLang}`;

            // If FORCE is true, we ignore the cache for the purposes of setting the placeholder
            // to show the user that something is happening within the UI.
            if (!force && nextCache.has(cacheKey)) {
                nextTranslations.set(key, nextCache.get(cacheKey)!);
            } else {
                nextTranslations.set(key, "..."); // Loading state
            }
            updatesPending = true;
        }

        if (updatesPending) {
            set({ selectionTranslations: nextTranslations });
        }

        // Trigger recursive translations for split remainders
        for (const remainder of additionalGroupsToTranslate) {
            // Fire and forget (it handles its own state updates)
            get().translateSelection(remainder, tokens, sourceLang, targetLang, aiService, false);
        }

        // 2. FETCH & RESOLVE
        // We re-read state in case it changed
        const finalTranslations = new Map(get().selectionTranslations);
        const finalCache = new Map(get().translationCache);


        await Promise.all(groups.map(async (group) => {
            if (group.length === 0) return;
            if (targetIndex !== undefined && !group.includes(targetIndex)) return;

            const start = group[0];
            const end = group[group.length - 1];
            const key = `${start}-${end}`;

            if (!finalTranslations.has(key) || finalTranslations.get(key) !== "...") {
                // If it's not in loading state, skip (unless we want to verify?)
                return;
            }

            const textToTranslate = tokens.slice(start, end + 1).join('');
            const cacheKey = `${textToTranslate}_${targetLang}`;

            // Check Cache
            // If FORCE is true, we SKIP returning from cache here, ensuring a fetch.
            if (!force && finalCache.has(cacheKey)) {
                const cachedVal = finalCache.get(cacheKey)!;
                set(state => {
                    const current = new Map(state.selectionTranslations);
                    if (current.get(key) !== cachedVal) {
                        current.set(key, cachedVal);
                        return { selectionTranslations: current };
                    }
                    return state;
                });
                return;
            }

            // Fetch or Wait for Inflight
            let result: string | null = null;

            if (pendingRequests.has(cacheKey)) {
                result = await pendingRequests.get(cacheKey)!;
            } else {
                const context = getContextForIndex(tokens, start);
                const promise = fetchTranslationHelper(textToTranslate, context, sourceLang, targetLang, aiService);
                pendingRequests.set(cacheKey, promise);
                try {
                    result = await promise;
                } finally {
                    pendingRequests.delete(cacheKey);
                }
            }

            // Apply Result Safely using Functional Set
            set((state) => {
                const currentTranslations = new Map(state.selectionTranslations);
                const currentCache = new Map(state.translationCache);
                let stateChanged = false;

                if (result) {
                    currentCache.set(cacheKey, result);

                    // Race Condition / Superset Check against LATEST state
                    let isSuperseded = false;
                    for (const existingKey of currentTranslations.keys()) {
                        const [exStart, exEnd] = existingKey.split('-').map(Number);
                        if (existingKey !== key && exStart <= start && exEnd >= end) {
                            isSuperseded = true;
                            break;
                        }
                    }

                    if (!isSuperseded) {
                        currentTranslations.set(key, result);
                        stateChanged = true;
                    } else {
                        // If superseded but still stuck in loading, remove it
                        if (currentTranslations.get(key) === "...") {
                            currentTranslations.delete(key);
                            stateChanged = true;
                        }
                    }
                } else {
                    // Failed to translate
                    currentTranslations.delete(key);
                    stateChanged = true;
                }

                if (!stateChanged) return state;

                return {
                    selectionTranslations: currentTranslations,
                    translationCache: currentCache
                };
            });
        }));
    },

    handleHover: async (index, source, tokens, currentPage, PAGE_SIZE, sourceLang, targetLang, aiService) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const token = tokens[globalIndex];
        if (!token?.trim()) return;

        set({ hoveredIndex: globalIndex, hoverTranslation: null, hoverSource: source });

        // If hovering via popup, we DO NOT fetch single word translation to avoid confusion.
        // We only want to highlight the group.
        if (source === 'popup') {
            return;
        }

        const cacheKey = `${token.trim()}_${targetLang}`;
        const currentCache = get().translationCache;

        if (currentCache.has(cacheKey)) {
            set({ hoverTranslation: currentCache.get(cacheKey)! });
            return;
        }

        let result: string | null = null;

        if (pendingRequests.has(cacheKey)) {
            result = await pendingRequests.get(cacheKey)!;
        } else {
            const context = getContextForIndex(tokens, globalIndex);
            const promise = fetchTranslationHelper(token, context, sourceLang, targetLang, aiService);
            pendingRequests.set(cacheKey, promise);
            try {
                result = await promise;
            } finally {
                pendingRequests.delete(cacheKey);
            }
        }

        if (get().hoveredIndex === globalIndex && result) {
            set(state => ({
                hoverTranslation: result,
                translationCache: new Map(state.translationCache).set(cacheKey, result!)
            }));
        }
    },

    regenerateHover: async (index, tokens, currentPage, PAGE_SIZE, sourceLang, targetLang, aiService) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const token = tokens[globalIndex];
        if (!token?.trim()) return;

        // Force Loading State for Hover
        set({ hoverTranslation: "..." });

        const context = getContextForIndex(tokens, globalIndex);
        const cacheKey = `${token.trim()}_${targetLang}`;

        // Force Fetch (bypass cache check initially)
        const result = await fetchTranslationHelper(token, context, sourceLang, targetLang, aiService);

        if (result) {
            // Update Cache AND Current Hover if still matching
            set(state => {
                const newCache = new Map(state.translationCache);
                newCache.set(cacheKey, result);

                // Only update hover display if user is still hovering same word
                if (state.hoveredIndex === globalIndex) {
                    return {
                        translationCache: newCache,
                        hoverTranslation: result
                    };
                }
                return { translationCache: newCache };
            });
        }
    },

    removeTranslation: (key: string, text?: string, targetLang?: string) => {
        const currentTranslations = get().selectionTranslations;
        const translation = currentTranslations.get(key);

        // If we are removing a translation, checking if we should cache it first
        // This handles "migrating" old persisted translations to the new cache
        let nextCache = get().translationCache;
        let cacheUpdated = false;

        if (translation && text && targetLang) {
            const cacheKey = `${text.trim()}_${targetLang}`;
            if (!nextCache.has(cacheKey)) {
                nextCache = new Map(nextCache);
                nextCache.set(cacheKey, translation);
                cacheUpdated = true;
            }
        }

        const nextTranslations = new Map(currentTranslations);
        if (nextTranslations.delete(key)) {
            set({
                selectionTranslations: nextTranslations,
                translationCache: cacheUpdated ? nextCache : nextCache // Updates if changed
            });
        }
    },

    clearHover: () => set({ hoveredIndex: null, hoverTranslation: null, hoverSource: null }),
    toggleShowTranslations: () => set(state => ({ showTranslations: !state.showTranslations })),
    clearSelectionTranslations: () => set({ selectionTranslations: new Map() }), // Optional: Clear cache here too if desired, but User wants session persistence.
});
