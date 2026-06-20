import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SelectionMode } from '../../../../core/types';
import { useTranslationStore } from './useTranslationStore';
import { getSentenceRange, getParagraphRange } from '../../../../core/utils/text-utils';
import { chromeStorage } from '@/lib/chrome-storage';
import { tokenizeWithMarkdown } from '../utils/tokenUtils';

interface ReaderState {
    tokens: string[];
    boldIndices: number[];
    italicIndices: number[];
    currentPage: number;
    selectedIndices: Set<number>;

    text: string;
    sourceLang: string;
    targetLang: string;
    isReading: boolean;
    isGenerating: boolean;
    PAGE_SIZE: number;
    selectionMode: SelectionMode;
    activePanel: 'DETAILS' | 'SAVED_WORDS';
    readingMode: 'STANDARD' | 'GRAMMAR';
    isZenMode: boolean;


    // Reading session
    sessionId: string | null;
    sessionTitle: string | null;

    setConfig: (text: string, sourceLang: string, targetLang: string) => void;
    setText: (text: string) => void;
    setSourceLang: (lang: string) => void;
    setTargetLang: (lang: string) => void;
    setIsReading: (isReading: boolean) => void;
    setIsGenerating: (isGenerating: boolean) => void;
    setSelectionMode: (mode: SelectionMode) => void;
    setActivePanel: (panel: 'DETAILS' | 'SAVED_WORDS') => void;
    setReadingMode: (mode: 'STANDARD' | 'GRAMMAR') => void;
    setZenMode: (zen: boolean) => void;
    toggleZenMode: () => void;
    setCurrentPage: (page: number) => void;
    handleSelection: (globalIndex: number) => Promise<void>;
    clearSelection: () => void;
    setSession: (id: string | null, title: string | null) => void;
    loadText: (text: string) => void;
    appendText: (text: string) => void;
}

export const useReaderStore = create<ReaderState>()(
    persist(
        (set, get) => ({
            tokens: [],
            boldIndices: [],
            italicIndices: [],
            currentPage: 1,
            selectedIndices: new Set(),
            text: "",
            sourceLang: "Spanish",
            targetLang: "English",
            isReading: false,
            isGenerating: false,
            PAGE_SIZE: 500,
            selectionMode: SelectionMode.Word,
            activePanel: 'DETAILS',
            readingMode: 'STANDARD',
            isZenMode: false,
            sessionId: null,
            sessionTitle: null,

            setConfig: (text, sourceLang, targetLang) => {
                if (text === get().text && sourceLang === get().sourceLang && targetLang === get().targetLang) {
                    return;
                }

                const { tokens, boldIndices, italicIndices } = tokenizeWithMarkdown(text);

                const { closeRichInfo, switchText } = useTranslationStore.getState();
                closeRichInfo();
                switchText(text);

                set({
                    text,
                    sourceLang,
                    targetLang,
                    tokens,
                    boldIndices,
                    italicIndices,
                    currentPage: 1,
                    selectedIndices: new Set(),
                });
            },

            setText: (text) => {
                const { closeRichInfo, switchText } = useTranslationStore.getState();
                closeRichInfo();
                switchText(text);

                const { tokens, boldIndices, italicIndices } = tokenizeWithMarkdown(text);
                set({
                    text,
                    tokens,
                    boldIndices,
                    italicIndices,
                    currentPage: 1,
                    selectedIndices: new Set(),
                    sessionId: null,
                    sessionTitle: null,
                });
            },

            setSourceLang: (sourceLang) => set({ sourceLang }),
            setTargetLang: (targetLang) => set({ targetLang }),
            setIsReading: (isReading) => set({ isReading }),
            setIsGenerating: (isGenerating) => set({ isGenerating }),
            setSelectionMode: (selectionMode) => set({ selectionMode }),
            setActivePanel: (activePanel) => set({ activePanel }),
            setReadingMode: (readingMode) => set({ readingMode }),
            setZenMode: (isZenMode) => set({ isZenMode }),
            toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),

            setCurrentPage: (currentPage) => {
                const { tokens, PAGE_SIZE } = get();
                const totalPages = Math.ceil(tokens.length / PAGE_SIZE);
                const newPage = Math.max(1, Math.min(currentPage, totalPages));
                set({ currentPage: newPage });
            },

            handleSelection: async (globalIndex) => {
                const { selectedIndices, selectionMode, tokens } = get();

                const newSelection = new Set(selectedIndices);

                if (selectionMode === SelectionMode.Sentence || selectionMode === SelectionMode.Paragraph) {
                    const range = selectionMode === SelectionMode.Paragraph
                        ? getParagraphRange(globalIndex, tokens)
                        : getSentenceRange(globalIndex, tokens);
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
            setSession: (sessionId, sessionTitle) => set({ sessionId, sessionTitle }),
            loadText: (text) => {
                const { closeRichInfo, switchText } = useTranslationStore.getState();
                closeRichInfo();
                switchText(text);
                const { tokens, boldIndices, italicIndices } = tokenizeWithMarkdown(text);
                set({ text, tokens, boldIndices, italicIndices, currentPage: 1, selectedIndices: new Set() });
            },
            appendText: (newText) => {
                const currentText = get().text;
                const combined = currentText ? `${currentText}\n\n${newText}` : newText;
                get().loadText(combined);
            },
        }),
        {
            name: 'reader-storage',
            storage: createJSONStorage(() => ({
                getItem: (name) => chromeStorage.getItem(name),
                setItem: (name, value) => {
                    if (useReaderStore.persist.hasHydrated()) {
                        return chromeStorage.setItem(name, value);
                    }
                    return Promise.resolve();
                },
                removeItem: (name) => chromeStorage.removeItem(name),
            })),
            partialize: (state) => ({
                text: state.text,
                sourceLang: state.sourceLang,
                targetLang: state.targetLang,
                tokens: state.tokens,
                boldIndices: state.boldIndices,
                italicIndices: state.italicIndices,
                currentPage: state.currentPage,
                sessionId: state.sessionId,
                sessionTitle: state.sessionTitle,
                readingMode: state.readingMode,
                selectionMode: state.selectionMode,
                isReading: state.isReading,
            }),
        }
    )
);

// Listen for storage changes from other contexts (like content scripts) to keep the store in sync
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes['reader-storage']) {
            useReaderStore.persist.rehydrate();
        }
    });
}
