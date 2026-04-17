
import type { StateCreator } from 'zustand';
import type { IAIService, RichTranslationResult } from '../../../../../core/interfaces/IAIService';

/**
 * The rich-translation prompt asks the LLM to use surrounding context for
 * disambiguation, but smaller models routinely over-reach and translate the
 * whole phrase into the "translation" field. For single-token lookups we run
 * the simple translate call in parallel and trust its output as the canonical
 * word translation, since that prompt is constrained to one word.
 */
const isSingleToken = (text: string) => !text.trim().includes(' ');

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

async function fetchSimpleTranslation(
    aiService: IAIService,
    text: string,
    targetLang: string,
    context: string,
    sourceLang: string,
): Promise<string | null> {
    try {
        const raw = await aiService.translateText(text, targetLang, context, sourceLang);
        const value = typeof raw === 'string' ? raw : raw?.response;
        return value?.trim() || null;
    } catch {
        return null;
    }
}

function reconcileTranslation(
    rich: RichTranslationResult,
    simple: string | null,
    text: string,
): RichTranslationResult {
    if (!simple) return rich;
    if (!isSingleToken(text)) return rich;
    // Prefer the simple translation whenever it's plausibly word-sized,
    // since the rich prompt is the one that tends to leak the full phrase.
    if (wordCount(simple) <= 3 && wordCount(rich.translation) > wordCount(simple)) {
        return { ...rich, translation: simple };
    }
    return rich;
}

export interface RichDetailsTab {
    id: string; // usually the 'text' being translated
    text: string;
    data: RichTranslationResult | null;
    isLoading: boolean;
    error: string | null;
    context: string;
    sourceLang: string;
    targetLang: string;
}

/**
 * Rich translation is authoritative once fetched. Writing it into the shared
 * hover cache keeps the inline popup (on hover/click) consistent with the
 * side panel instead of showing a stale or divergent simple-translate result.
 */
const syncRichIntoHoverCache = (
    set: Parameters<StateCreator<RichDetailsSlice>>[0],
    text: string,
    targetLang: string,
    translation: string,
) => {
    if (!translation) return;
    const cacheKey = `${text.trim()}_${targetLang}`;
    set((state) => {
        const s = state as unknown as { translationCache?: Map<string, string> };
        const nextCache = new Map(s.translationCache ?? new Map());
        nextCache.set(cacheKey, translation);
        return { translationCache: nextCache } as unknown as RichDetailsSlice;
    });
};

export type RichSnapState = 'peek' | 'half' | 'full';

export interface RichDetailsSlice {
    richDetailsTabs: RichDetailsTab[];
    activeTabId: string | null;
    isRichInfoOpen: boolean;
    snapState: RichSnapState;

    fetchRichTranslation: (
        text: string,
        context: string,
        sourceLang: string,
        targetLang: string,
        aiService: IAIService
    ) => Promise<void>;

    closeRichInfo: () => void;
    toggleRichInfo: () => void;
    setSnapState: (state: RichSnapState) => void;

    closeTab: (id: string) => void;
    closeAllTabs: () => void;
    setActiveTab: (id: string) => void;
    regenerateTab: (id: string, aiService: IAIService) => Promise<void>;
}

export const createRichDetailsSlice: StateCreator<RichDetailsSlice> = (set, get) => ({
    richDetailsTabs: [],
    activeTabId: null,
    isRichInfoOpen: false,
    snapState: 'half',

    fetchRichTranslation: async (text, context, sourceLang, targetLang, aiService) => {
        const { richDetailsTabs, isRichInfoOpen, snapState } = get();
        const existingTab = richDetailsTabs.find(t => t.id === text);

        // Auto-peek when opening a NEW selection while the panel is already
        // visible — keeps reading area unobstructed for the next selection.
        // Default to 'half' on a fresh open so the user immediately sees content.
        const nextSnap: RichSnapState = !isRichInfoOpen
            ? 'half'
            : existingTab
                ? snapState
                : 'peek';

        set({ isRichInfoOpen: true, snapState: nextSnap });

        if (existingTab) {
            set({ activeTabId: existingTab.id });
            return;
        }

        const newTab: RichDetailsTab = {
            id: text,
            text,
            data: null,
            isLoading: true,
            error: null,
            context,
            sourceLang,
            targetLang
        };

        set({
            richDetailsTabs: [...richDetailsTabs, newTab],
            activeTabId: text
        });

        try {
            const richPromise = aiService.getRichTranslation(text, targetLang, context, sourceLang);
            const simplePromise = isSingleToken(text)
                ? fetchSimpleTranslation(aiService, text, targetLang, context, sourceLang)
                : Promise.resolve(null);

            const [richResult, simpleResult] = await Promise.all([richPromise, simplePromise]);
            const result = reconcileTranslation(richResult, simpleResult, text);

            set(state => ({
                richDetailsTabs: state.richDetailsTabs.map(tab =>
                    tab.id === text
                        ? { ...tab, data: result, isLoading: false }
                        : tab
                )
            }));

            if (result?.translation) {
                syncRichIntoHoverCache(set, text, targetLang, result.translation);
            }
        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to load';
            set(state => ({
                richDetailsTabs: state.richDetailsTabs.map(tab =>
                    tab.id === text
                        ? { ...tab, isLoading: false, error: errorMessage }
                        : tab
                )
            }));
        }
    },

    closeTab: (id) => {
        set(state => {
            const newTabs = state.richDetailsTabs.filter(t => t.id !== id);
            let newActiveId = state.activeTabId;

            if (state.activeTabId === id) {
                newActiveId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
            }

            const isOpen = newTabs.length > 0;

            return {
                richDetailsTabs: newTabs,
                activeTabId: newActiveId,
                isRichInfoOpen: isOpen
            };
        });
    },

    closeAllTabs: () => {
        set({
            richDetailsTabs: [],
            activeTabId: null,
            isRichInfoOpen: false
        });
    },

    setActiveTab: (id) => {
        set({ activeTabId: id, isRichInfoOpen: true });
    },

    regenerateTab: async (id, aiService) => {
        const tab = get().richDetailsTabs.find(t => t.id === id);
        if (!tab) return;

        set(state => ({
            richDetailsTabs: state.richDetailsTabs.map(t =>
                t.id === id ? { ...t, isLoading: true, error: null } : t
            )
        }));

        try {
            const richPromise = aiService.getRichTranslation(tab.text, tab.targetLang, tab.context, tab.sourceLang);
            const simplePromise = isSingleToken(tab.text)
                ? fetchSimpleTranslation(aiService, tab.text, tab.targetLang, tab.context, tab.sourceLang)
                : Promise.resolve(null);

            const [richResult, simpleResult] = await Promise.all([richPromise, simplePromise]);
            const result = reconcileTranslation(richResult, simpleResult, tab.text);

            set(state => ({
                richDetailsTabs: state.richDetailsTabs.map(t =>
                    t.id === id ? { ...t, data: result, isLoading: false } : t
                )
            }));

            if (result?.translation) {
                syncRichIntoHoverCache(set, tab.text, tab.targetLang, result.translation);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Regeneration failed';
            set(state => ({
                richDetailsTabs: state.richDetailsTabs.map(t =>
                    t.id === id ? { ...t, isLoading: false, error: errorMessage } : t
                )
            }));
        }
    },

    closeRichInfo: () => set({ isRichInfoOpen: false }),
    toggleRichInfo: () => set(state => ({ isRichInfoOpen: !state.isRichInfoOpen })),
    setSnapState: (snapState) => set({ snapState }),
});
