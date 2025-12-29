import { create } from 'zustand';



interface ReaderState {
    // State
    tokens: string[];
    currentPage: number;
    selectedIndices: Set<number>;

    // Config
    text: string;
    sourceLang: string;
    targetLang: string;
    isReading: boolean;
    PAGE_SIZE: number;

    // Actions
    setConfig: (text: string, sourceLang: string, targetLang: string) => void;
    setText: (text: string) => void;
    setSourceLang: (lang: string) => void;
    setTargetLang: (lang: string) => void;
    setIsReading: (isReading: boolean) => void;
    setPage: (page: number) => void;
    handleSelection: (globalIndex: number) => Promise<void>;
}

// Helper: Group selected indices into contiguous blocks (Still used?)
// Actually, `setConfig` and `setText` used to reset translation state. I need to fix that too.

export const useReaderStore = create<ReaderState>((set, get) => ({
    // Initial State
    tokens: [],
    currentPage: 1,
    selectedIndices: new Set(),
    text: "",
    sourceLang: "Spanish",
    targetLang: "English",
    isReading: false,
    PAGE_SIZE: 500,

    // Actions
    setConfig: (text, sourceLang, targetLang) => {
        // Avoid resetting if unchanged
        if (text === get().text && sourceLang === get().sourceLang && targetLang === get().targetLang) {
            return;
        }

        const tokens = text.split(/(\s+)/);

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

    setPage: (page) => {
        const { tokens, PAGE_SIZE } = get();
        const totalPages = Math.ceil(tokens.length / PAGE_SIZE);
        const newPage = Math.max(1, Math.min(page, totalPages));
        set({ currentPage: newPage });
    },

    handleSelection: async (globalIndex) => {
        const { selectedIndices } = get();

        // Toggle selection
        const newSelection = new Set(selectedIndices);
        if (newSelection.has(globalIndex)) {
            newSelection.delete(globalIndex);
        } else {
            newSelection.add(globalIndex);
        }

        set({ selectedIndices: newSelection });
        // NOTE: Translation triggering is now handled by the View via useTranslation hook effect
    },
}));
