import { create } from 'zustand';
import type { IAIService, RichTranslationResult } from '../../../../core/interfaces/IAIService';

interface TranslationState {
    // Selection Translations
    selectionTranslations: Map<string, string>;

    // Hover Translation
    hoveredIndex: number | null;
    hoverTranslation: string | null;

    // Rich Info
    richTranslation: RichTranslationResult | null;
    isRichInfoOpen: boolean;
    isRichInfoLoading: boolean;

    // Actions
    translateSelection: (
        indices: Set<number>,
        tokens: string[],
        sourceLang: string,
        targetLang: string,
        aiService: IAIService,
        force?: boolean
    ) => Promise<void>;

    handleHover: (
        index: number,
        tokens: string[],
        currentPage: number,
        PAGE_SIZE: number,
        sourceLang: string,
        targetLang: string,
        aiService: IAIService
    ) => Promise<void>;

    clearHover: () => void;

    fetchRichTranslation: (
        text: string,
        context: string,
        sourceLang: string,
        targetLang: string,
        aiService: IAIService
    ) => Promise<void>;

    closeRichInfo: () => void;
    toggleRichInfo: () => void;
}

// Helper: Extract context (current line) for a given token index
// Duplicated from useReaderStore or shared? Ideally shared, but safe to duplicate for now to decouple.
const getContextForIndex = (tokens: string[], index: number): string => {
    if (index < 0 || index >= tokens.length) return '';

    let startIndex = index;
    while (startIndex > 0 && !tokens[startIndex - 1].includes('\n')) {
        startIndex--;
    }

    let endIndex = index;
    while (endIndex < tokens.length - 1 && !tokens[endIndex + 1].includes('\n')) {
        endIndex++;
    }

    return tokens.slice(startIndex, endIndex + 1).join('');
};

const getSelectionGroups = (indices: Set<number>, tokens: string[]): number[][] => {
    const sorted = Array.from(indices).sort((a, b) => a - b);
    if (sorted.length === 0) return [];

    const groups: number[][] = [];
    let currentGroup: number[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];

        // Check if there are only whitespace tokens between prev and curr
        let isContiguous = true;
        for (let k = prev + 1; k < curr; k++) {
            if (tokens[k].trim().length > 0) {
                isContiguous = false;
                break;
            }
        }

        // NEW: Break grouping if the previous token was a sentence end (punctuation)
        if (isContiguous && /[.!?]['"”’\)]*$/.test(tokens[prev].trim())) {
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
    return groups;
};

const fetchTranslationHelper = async (
    text: string,
    context: string,
    sourceLang: string,
    targetLang: string,
    aiService: IAIService
): Promise<string | null> => {
    if (!text.trim()) return null;
    try {
        return await aiService.translateText(text.trim(), targetLang, context, sourceLang);
    } catch (error: any) {
        return `Translation Error: ${error.message || 'Unknown failure'}`;
    }
};

export const useTranslationStore = create<TranslationState>((set, get) => ({
    selectionTranslations: new Map(),
    hoveredIndex: null,
    hoverTranslation: null,
    richTranslation: null,
    isRichInfoOpen: false,
    isRichInfoLoading: false,

    translateSelection: async (indices, tokens, sourceLang, targetLang, aiService, force = false) => {
        // If selection is empty, just return (don't clear cache)
        if (indices.size === 0) {
            return;
        }

        const groups = getSelectionGroups(indices, tokens);
        const currentTranslations = get().selectionTranslations;

        // Clone map only if we add new items
        let nextTranslations = new Map(currentTranslations);
        let hasChanges = false;

        await Promise.all(groups.map(async (group) => {
            if (group.length === 0) return;
            const start = group[0];
            const end = group[group.length - 1];
            const key = `${start}-${end}`;

            // Cache hit (skip if not forced)
            if (!force && nextTranslations.has(key)) {
                return;
            }

            // Fetch
            const textToTranslate = tokens.slice(start, end + 1).join('');
            const context = getContextForIndex(tokens, start);
            const result = await fetchTranslationHelper(textToTranslate, context, sourceLang, targetLang, aiService);

            if (result) {
                nextTranslations.set(key, result);
                hasChanges = true;
            }
        }));

        if (hasChanges) {
            set({ selectionTranslations: nextTranslations });
        }
    },

    handleHover: async (index, tokens, currentPage, PAGE_SIZE, sourceLang, targetLang, aiService) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const token = tokens[globalIndex];

        if (!token?.trim()) return;

        // Set hover index immediately for UI feedback
        set({ hoveredIndex: globalIndex, hoverTranslation: null });

        // Check cache (single token key)
        const key = `${globalIndex}-${globalIndex}`;
        const cache = get().selectionTranslations;

        if (cache.has(key)) {
            set({ hoverTranslation: cache.get(key)! });
            return;
        }

        const context = getContextForIndex(tokens, globalIndex);
        const result = await fetchTranslationHelper(token, context, sourceLang, targetLang, aiService);

        // Check race condition (Use globalIndex)
        if (get().hoveredIndex === globalIndex && result) {
            set({ hoverTranslation: result });

            // Cache the result!
            const newCache = new Map(get().selectionTranslations);
            // Ensure result is string (truthy check confirms it's not null/empty string, but TS might need help)
            newCache.set(key, result as string);
            set({ selectionTranslations: newCache });
        }
    },

    clearHover: () => {
        set({ hoveredIndex: null, hoverTranslation: null });
    },

    fetchRichTranslation: async (text, context, sourceLang, targetLang, aiService) => {
        set({ isRichInfoOpen: true, isRichInfoLoading: true, richTranslation: null });
        try {
            const result = await aiService.getRichTranslation(text, targetLang, context, sourceLang);
            set({ richTranslation: result, isRichInfoLoading: false });
        } catch (error) {
            console.error(error);
            set({ isRichInfoLoading: false, richTranslation: null }); // Optionally handle error state
        }
    },

    closeRichInfo: () => set({ isRichInfoOpen: false }),
    toggleRichInfo: () => set(state => ({ isRichInfoOpen: !state.isRichInfoOpen })),
}));
