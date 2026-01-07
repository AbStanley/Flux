
import type { StateCreator } from 'zustand';
import type { IAIService, RichTranslationResult } from '../../../../../core/interfaces/IAIService';

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

export interface RichDetailsSlice {
    richDetailsTabs: RichDetailsTab[];
    activeTabId: string | null;
    isRichInfoOpen: boolean;

    fetchRichTranslation: (
        text: string,
        context: string,
        sourceLang: string,
        targetLang: string,
        aiService: IAIService
    ) => Promise<void>;

    closeRichInfo: () => void;
    toggleRichInfo: () => void;

    closeTab: (id: string) => void;
    closeAllTabs: () => void;
    setActiveTab: (id: string) => void;
    regenerateTab: (id: string, aiService: IAIService) => Promise<void>;
}

export const createRichDetailsSlice: StateCreator<RichDetailsSlice> = (set, get) => ({
    richDetailsTabs: [],
    activeTabId: null,
    isRichInfoOpen: false,

    fetchRichTranslation: async (text, context, sourceLang, targetLang, aiService) => {
        const { richDetailsTabs } = get();
        const existingTab = richDetailsTabs.find(t => t.id === text);

        set({ isRichInfoOpen: true });

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
            const result = await aiService.getRichTranslation(text, targetLang, context, sourceLang);

            set(state => ({
                richDetailsTabs: state.richDetailsTabs.map(tab =>
                    tab.id === text
                        ? { ...tab, data: result, isLoading: false }
                        : tab
                )
            }));
        } catch (error: any) {
            console.error(error);
            set(state => ({
                richDetailsTabs: state.richDetailsTabs.map(tab =>
                    tab.id === text
                        ? { ...tab, isLoading: false, error: error.message || 'Failed to load' }
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
            const result = await aiService.getRichTranslation(tab.text, tab.targetLang, tab.context, tab.sourceLang);
            set(state => ({
                richDetailsTabs: state.richDetailsTabs.map(t =>
                    t.id === id ? { ...t, data: result, isLoading: false } : t
                )
            }));
        } catch (error: any) {
            set(state => ({
                richDetailsTabs: state.richDetailsTabs.map(t =>
                    t.id === id ? { ...t, isLoading: false, error: error.message || 'Regeneration failed' } : t
                )
            }));
        }
    },

    closeRichInfo: () => set({ isRichInfoOpen: false }),
    toggleRichInfo: () => set(state => ({ isRichInfoOpen: !state.isRichInfoOpen })),
});
