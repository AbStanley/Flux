import { create } from 'zustand';
import { createTranslationSlice } from './slices/translationSlice';
import type { TranslationSlice } from './slices/translationSlice';
import { createRichDetailsSlice } from './slices/richDetailsSlice';
import type { RichDetailsSlice, RichDetailsTab } from './slices/richDetailsSlice';

// Re-export types for consumers
export type { RichDetailsTab };

export type TranslationState = TranslationSlice & RichDetailsSlice;

export const useTranslationStore = create<TranslationState>((...a) => ({
    ...createTranslationSlice(...a),
    ...createRichDetailsSlice(...a),
}));

