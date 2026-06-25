import type { StateCreator } from 'zustand';
import type { IAIService } from '../../../../../core/interfaces/IAIService';
import {
    getContextForIndex,
    getSelectionGroups,
    fetchTranslationHelper,
    pendingRequests,
    stripPunctuation,
} from './translationUtils';

export interface TranslationSlice {
    translationCache: Map<string, string>;
    selectionTranslations: Map<string, string>;
    hoveredIndex: number | null;
    hoverTranslation: string | null;
    hoverSource: 'token' | 'popup' | null;
    showTranslations: boolean;
    hoverAbortController: AbortController | null;

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
    clearSelectionTranslations: (tokens?: string[], targetLang?: string) => void;
    removeTranslation: (key: string, text?: string, targetLang?: string) => void;
    savedTranslationsByText: Record<string, [string, string][]>;
    currentTextHash: string | null;
    switchText: (text: string) => void;
}

export const createTranslationSlice: StateCreator<TranslationSlice> = (set, get) => ({
    translationCache: new Map(), // <"text_targetLang", translation>
    selectionTranslations: new Map(),
    savedTranslationsByText: {},
    currentTextHash: null,
    hoveredIndex: null,
    hoverTranslation: null,
    hoverSource: null,
    showTranslations: true,
    hoverAbortController: null,

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
            const strippedText = stripPunctuation(textToTranslate);
            const cacheKey = `${strippedText}_${targetLang}`;

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
        // We use the nextTranslations map directly to ensure we have the correct,
        // up-to-date state without relying on synchronous store updates.
        const finalCache = new Map(get().translationCache);


        await Promise.all(groups.map(async (group) => {
            if (group.length === 0) return;
            if (targetIndex !== undefined && !group.includes(targetIndex)) return;

            const start = group[0];
            const end = group[group.length - 1];
            const key = `${start}-${end}`;

            if (!nextTranslations.has(key) || nextTranslations.get(key) !== "...") {
                // If it's not in loading state, skip (unless we want to verify?)
                return;
            }

            const textToTranslate = tokens.slice(start, end + 1).join('');
            const strippedText = stripPunctuation(textToTranslate);
            const cacheKey = `${strippedText}_${targetLang}`;

            // Check Cache
            // If FORCE is true, we SKIP returning from cache here, ensuring a fetch.
            if (!force && finalCache.has(cacheKey)) {
                const cachedVal = finalCache.get(cacheKey)!;
                set(state => {
                    const current = new Map(state.selectionTranslations);
                    if (!current.has(key)) {
                        return state;
                    }
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
                const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
                const context = getContextForIndex(tokens, start);
                const promise = fetchTranslationHelper(textToTranslate, context, sourceLang, targetLang, aiService, 3, undefined, traceId);
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
                let cacheChanged = false;

                if (result) {
                    currentCache.set(cacheKey, result);
                    cacheChanged = true;

                    if (currentTranslations.has(key)) {
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
                    }
                } else {
                    // Failed to translate
                    if (currentTranslations.has(key)) {
                        currentTranslations.delete(key);
                        stateChanged = true;
                    }
                }

                if (!stateChanged && !cacheChanged) return state;

                const nextState: Partial<TranslationSlice> = {};
                if (stateChanged) nextState.selectionTranslations = currentTranslations;
                if (cacheChanged) nextState.translationCache = currentCache;
                return nextState;
            });
        }));
    },

    handleHover: async (index, source, tokens, currentPage, PAGE_SIZE, sourceLang, targetLang, aiService) => {
        const prevController = get().hoverAbortController;
        if (prevController) {
            prevController.abort();
        }

        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const rawToken = tokens[globalIndex];
        if (!rawToken?.trim()) {
            set({ hoverAbortController: null });
            return;
        }
        const token = stripPunctuation(rawToken);
        if (!token) {
            set({ hoverAbortController: null });
            return;
        }

        const controller = new AbortController();
        set({ hoveredIndex: globalIndex, hoverTranslation: null, hoverSource: source, hoverAbortController: controller });

        // If hovering via popup, we DO NOT fetch single word translation to avoid confusion.
        // We only want to highlight the group.
        if (source === 'popup') {
            return;
        }

        const cacheKey = `${token}_${targetLang}`;
        const currentCache = get().translationCache;

        if (currentCache.has(cacheKey)) {
            set({ hoverTranslation: currentCache.get(cacheKey)!, hoverAbortController: null });
            return;
        }

        let result: string | null = null;

        if (pendingRequests.has(cacheKey)) {
            result = await pendingRequests.get(cacheKey)!;
        } else {
            const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
            const context = getContextForIndex(tokens, globalIndex);
            const promise = fetchTranslationHelper(token, context, sourceLang, targetLang, aiService, 3, controller.signal, traceId);
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
                translationCache: new Map(state.translationCache).set(cacheKey, result!),
                hoverAbortController: state.hoverAbortController === controller ? null : state.hoverAbortController
            }));
        } else {
            set(state => ({
                hoverAbortController: state.hoverAbortController === controller ? null : state.hoverAbortController
            }));
        }
    },

    regenerateHover: async (index, tokens, currentPage, PAGE_SIZE, sourceLang, targetLang, aiService) => {
        const prevController = get().hoverAbortController;
        if (prevController) {
            prevController.abort();
        }

        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const rawToken = tokens[globalIndex];
        if (!rawToken?.trim()) {
            set({ hoverAbortController: null });
            return;
        }
        const token = stripPunctuation(rawToken);
        if (!token) {
            set({ hoverAbortController: null });
            return;
        }

        const controller = new AbortController();
        // Force Loading State for Hover
        set({ hoverTranslation: "...", hoverAbortController: controller });

        const context = getContextForIndex(tokens, globalIndex);
        const cacheKey = `${token}_${targetLang}`;
        const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

        // Force Fetch (bypass cache check initially)
        const result = await fetchTranslationHelper(token, context, sourceLang, targetLang, aiService, 3, controller.signal, traceId);

        set(state => {
            const newCache = new Map(state.translationCache);
            if (result) {
                newCache.set(cacheKey, result);
            }

            const isStillCurrent = state.hoveredIndex === globalIndex;
            const nextAbortController = state.hoverAbortController === controller ? null : state.hoverAbortController;

            if (isStillCurrent && result) {
                return {
                    translationCache: newCache,
                    hoverTranslation: result,
                    hoverAbortController: nextAbortController
                };
            }
            return {
                translationCache: newCache,
                hoverAbortController: nextAbortController
            };
        });
    },

    removeTranslation: (key: string, text?: string, targetLang?: string) => {
        const currentTranslations = get().selectionTranslations;
        const translation = currentTranslations.get(key);

        // If we are removing a translation, checking if we should cache it first
        // This handles "migrating" old persisted translations to the new cache
        let nextCache = get().translationCache;
        let cacheUpdated = false;

        if (translation && text && targetLang) {
            const cacheKey = `${stripPunctuation(text)}_${targetLang}`;
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

    clearHover: () => {
        const prevController = get().hoverAbortController;
        if (prevController) {
            prevController.abort();
        }
        set({ hoveredIndex: null, hoverTranslation: null, hoverSource: null, hoverAbortController: null });
    },
    toggleShowTranslations: () => set(state => ({ showTranslations: !state.showTranslations })),
    clearSelectionTranslations: (tokens?: string[], targetLang?: string) => set(state => {
        if (!tokens || !targetLang) {
            return { selectionTranslations: new Map() };
        }
        
        const nextCache = new Map(state.translationCache);
        for (const key of state.selectionTranslations.keys()) {
            const [start, end] = key.split('-').map(Number);
            const textToTranslate = tokens.slice(start, end + 1).join('');
            const cacheKey = `${stripPunctuation(textToTranslate)}_${targetLang}`;
            nextCache.delete(cacheKey);
        }

        return {
            selectionTranslations: new Map(),
            translationCache: nextCache
        };
    }),
    switchText: (text: string) => set(state => {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = (hash << 5) - hash + text.charCodeAt(i);
            hash |= 0;
        }
        const newHash = hash.toString(36);

        if (state.currentTextHash === newHash) return state;

        const nextSaved = { ...state.savedTranslationsByText };
        if (state.currentTextHash) {
            nextSaved[state.currentTextHash] = Array.from(state.selectionTranslations.entries());
        }

        const newTranslations = new Map(nextSaved[newHash] || []);
        
        return {
            savedTranslationsByText: nextSaved,
            currentTextHash: newHash,
            selectionTranslations: newTranslations,
        };
    }),
});

