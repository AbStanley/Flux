
import type { StateCreator } from 'zustand';
import type { IAIService } from '../../../../../core/interfaces/IAIService';

export interface TranslationSlice {
    selectionTranslations: Map<string, string>;
    hoveredIndex: number | null;
    hoverTranslation: string | null;
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
}

// Helpers
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
        let isContiguous = true;
        for (let k = prev + 1; k < curr; k++) {
            if (tokens[k].trim().length > 0 || tokens[k].includes('\n')) {
                isContiguous = false;
                break;
            }
        }
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

const pendingRequests = new Set<string>();

export const createTranslationSlice: StateCreator<TranslationSlice> = (set, get) => ({
    selectionTranslations: new Map(),
    hoveredIndex: null,
    hoverTranslation: null,
    showTranslations: true,

    translateSelection: async (indices, tokens, sourceLang, targetLang, aiService, force = false, targetIndex?: number) => {
        if (indices.size === 0) return;

        const groups = getSelectionGroups(indices, tokens);
        const currentTranslations = get().selectionTranslations;
        let nextTranslations = new Map(currentTranslations);
        let hasChanges = false;

        await Promise.all(groups.map(async (group) => {
            if (group.length === 0) return;
            if (targetIndex !== undefined && !group.includes(targetIndex)) return;

            const start = group[0];
            const end = group[group.length - 1];
            const key = `${start}-${end}`;

            if (!force && nextTranslations.has(key)) return;

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

        set({ hoveredIndex: globalIndex, hoverTranslation: null });

        const key = `${globalIndex}-${globalIndex}`;
        const cache = get().selectionTranslations;

        if (cache.has(key)) {
            set({ hoverTranslation: cache.get(key)! });
            return;
        }

        if (pendingRequests.has(key)) return;

        pendingRequests.add(key);
        const context = getContextForIndex(tokens, globalIndex);

        try {
            const result = await fetchTranslationHelper(token, context, sourceLang, targetLang, aiService);
            if (get().hoveredIndex === globalIndex && result) {
                set({ hoverTranslation: result });
            }
            if (result) {
                const newCache = new Map(get().selectionTranslations);
                newCache.set(key, result);
                set({ selectionTranslations: newCache });
            }
        } finally {
            pendingRequests.delete(key);
        }
    },

    clearHover: () => set({ hoveredIndex: null, hoverTranslation: null }),
    toggleShowTranslations: () => set(state => ({ showTranslations: !state.showTranslations })),
    clearSelectionTranslations: () => set({ selectionTranslations: new Map() }),
});
