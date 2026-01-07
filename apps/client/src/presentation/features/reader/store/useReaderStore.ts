import { create } from 'zustand';
import { SelectionMode } from '../../../../core/types';
import { useTranslationStore } from './useTranslationStore';
import { getSentenceRange } from '../../../../core/utils/text-utils';

interface ReaderState {
    tokens: string[];
    currentPage: number;
    selectedIndices: Set<number>;

    text: string;
    sourceLang: string;
    targetLang: string;
    isReading: boolean;
    isGenerating: boolean;
    PAGE_SIZE: number;
    selectionMode: SelectionMode;

    setConfig: (text: string, sourceLang: string, targetLang: string) => void;
    setText: (text: string) => void;
    setSourceLang: (lang: string) => void;
    setTargetLang: (lang: string) => void;
    setIsReading: (isReading: boolean) => void;
    setIsGenerating: (isGenerating: boolean) => void;
    setSelectionMode: (mode: SelectionMode) => void;
    setPage: (page: number) => void;
    handleSelection: (globalIndex: number) => Promise<void>;
    clearSelection: () => void;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
    tokens: [],
    currentPage: 1,
    selectedIndices: new Set(),
    text: "",
    sourceLang: "Spanish",
    targetLang: "English",
    isReading: false,
    isGenerating: false,
    PAGE_SIZE: 500,
    selectionMode: SelectionMode.Word,

    setConfig: (text, sourceLang, targetLang) => {
        if (text === get().text && sourceLang === get().sourceLang && targetLang === get().targetLang) {
            return;
        }

        const tokens = text.split(/(\s+)/);

        const { closeRichInfo, clearSelectionTranslations } = useTranslationStore.getState();
        closeRichInfo();
        clearSelectionTranslations();

        set({
            text,
            sourceLang,
            targetLang,
            tokens,
            currentPage: 1,
            selectedIndices: new Set(),
        });
    },

    setText: (text) => {
        const { closeRichInfo, clearSelectionTranslations } = useTranslationStore.getState();
        closeRichInfo();
        clearSelectionTranslations();

        const tokens = text.split(/(\s+)/);
        set({
            text,
            tokens,
            currentPage: 1,
            selectedIndices: new Set(),
        });
    },

    setSourceLang: (sourceLang) => set({ sourceLang }),
    setTargetLang: (targetLang) => set({ targetLang }),
    setIsReading: (isReading) => set({ isReading }),
    setIsGenerating: (isGenerating) => set({ isGenerating }),
    setSelectionMode: (selectionMode) => set({ selectionMode }),

    setPage: (currentPage) => {
        const { tokens, PAGE_SIZE } = get();
        const totalPages = Math.ceil(tokens.length / PAGE_SIZE);
        const newPage = Math.max(1, Math.min(currentPage, totalPages));
        set({ currentPage: newPage });
    },

    handleSelection: async (globalIndex) => {
        const { selectedIndices, selectionMode, tokens } = get();

        const newSelection = new Set(selectedIndices);

        if (selectionMode === SelectionMode.Sentence) {
            const range = getSentenceRange(globalIndex, tokens);
            const start = range[0];
            const end = range[range.length - 1];

            // If the clicked token was selected, deselect the group.
            const wasSelected = newSelection.has(globalIndex);

            for (let i = start; i <= end; i++) {
                if (wasSelected) {
                    newSelection.delete(i);
                } else {
                    newSelection.add(i);
                }
            }

        } else {
            if (newSelection.has(globalIndex)) {
                newSelection.delete(globalIndex);

                // If we deselect a word, check if adjacent whitespace becomes "orphaned"
                // (i.e., not next to another selected word) and deselect it too.
                const checkAndDeselect = (idx: number) => {
                    if (!newSelection.has(idx)) return;
                    // Check if *neither* neighbor is selected
                    const prev = idx - 1;
                    const next = idx + 1;
                    const prevSelected = prev >= 0 && newSelection.has(prev);
                    const nextSelected = next < tokens.length && newSelection.has(next);

                    if (!prevSelected && !nextSelected) {
                        newSelection.delete(idx);
                    }
                };

                // Check Left
                if (globalIndex > 0) checkAndDeselect(globalIndex - 1);
                // Check Right
                if (globalIndex < tokens.length - 1) checkAndDeselect(globalIndex + 1);

            } else {
                newSelection.add(globalIndex);
            }
        }

        set({ selectedIndices: newSelection });
    },

    clearSelection: () => set({ selectedIndices: new Set() }),
}));


