import { create } from 'zustand';
import { createTranslationSlice } from './slices/translationSlice';
import type { TranslationSlice } from './slices/translationSlice';
import { createRichDetailsSlice } from './slices/richDetailsSlice';
import type { RichDetailsSlice, RichDetailsTab } from './slices/richDetailsSlice';
import { persist } from 'zustand/middleware';
import { chromeStorage } from '@/lib/chrome-storage';

// Re-export types for consumers
export type { RichDetailsTab };

export type TranslationState = TranslationSlice & RichDetailsSlice;

export const useTranslationStore = create<TranslationState>()(
    persist(
        (...a) => ({
            ...createTranslationSlice(...a),
            ...createRichDetailsSlice(...a),
        }),
        {
            name: 'translation-storage',
            storage: {
                getItem: async (name) => {
                    const str = await chromeStorage.getItem(name);
                    if (!str) return null;
                    const parsed = JSON.parse(str);
                    return {
                        state: {
                            ...parsed.state,
                            selectionTranslations: new Map(parsed.state.selectionTranslations),
                            translationCache: new Map(parsed.state.translationCache),
                        },
                    };
                },
                setItem: async (name, value) => {
                    const str = JSON.stringify({
                        state: {
                            ...value.state,
                            selectionTranslations: Array.from(value.state.selectionTranslations.entries()),
                            translationCache: Array.from(value.state.translationCache.entries()),
                        },
                    });
                    await chromeStorage.setItem(name, str);
                },
                removeItem: async (name) => await chromeStorage.removeItem(name),
            },
            partialize: (state) => ({
                selectionTranslations: state.selectionTranslations,
                translationCache: state.translationCache,
                showTranslations: state.showTranslations
            } as Partial<TranslationState>),
        }
    )
);
