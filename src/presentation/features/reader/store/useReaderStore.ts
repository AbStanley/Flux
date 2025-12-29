import { create } from 'zustand';
import { SelectionMode } from '../../../../core/types'; // NEW



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
    selectionMode: SelectionMode; // Updated type

    // Actions
    setConfig: (text: string, sourceLang: string, targetLang: string) => void;
    setText: (text: string) => void;
    setSourceLang: (lang: string) => void;
    setTargetLang: (lang: string) => void;
    setIsReading: (isReading: boolean) => void;
    setSelectionMode: (mode: SelectionMode) => void;
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
    selectionMode: SelectionMode.Word,

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

            // Toggle logic: If the clicked token was selected, deselect the group.
            const wasSelected = newSelection.has(globalIndex);

            for (let i = start; i <= end; i++) {
                if (wasSelected) {
                    newSelection.delete(i);
                } else {
                    newSelection.add(i);
                }
            }

        } else {
            // Word mode (Default)
            if (newSelection.has(globalIndex)) {
                newSelection.delete(globalIndex);
            } else {
                newSelection.add(globalIndex);
            }
        }

        set({ selectedIndices: newSelection });
    },
}));

// Helper to find sentence boundaries
export const getSentenceRange = (index: number, tokens: string[]): number[] => {
    // Common abbreviations that shouldn't end a sentence
    const abbreviations = new Set([
        'mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'sr.', 'jr.', 'vs.', 'etc.', 'fig.', 'al.', 'gen.', 'rep.', 'sen.', 'gov.', 'est.', 'no.', 'op.', 'vol.', 'pp.'
    ]);

    const isSentenceEnd = (token: string) => {
        const t = token.trim();
        if (!t) return false;

        // Basic punctuation check
        const hasPunctuation = /[.!?]['"”’\)]*$/.test(t);
        if (!hasPunctuation) return false;

        // Check if it's an abbreviation
        const lowerToken = t.toLowerCase();
        // Remove trailing quotes/brackets for abbreviation check
        const cleaned = lowerToken.replace(/['"”’\)]+$/, '');

        if (abbreviations.has(cleaned)) {
            return false;
        }

        return true;
    };

    // Search start
    let start = index;
    while (start > 0) {
        // If the PREVIOUS token was an end, then start is current.
        // We need to look at non-whitespace tokens to decide
        let prevIndex = start - 1;
        while (prevIndex >= 0 && !tokens[prevIndex].trim()) {
            prevIndex--;
        }

        if (prevIndex < 0) {
            start = 0;
            break;
        }

        const prevToken = tokens[prevIndex];
        // We don't have enough context to check 'prevToken's' previous token for abbreviation 
        // effectively without linear scan, but since we are scanning linearly here:
        // ideally we check if prevToken IS a sentence end.

        // Use a simpler check for localized "previous" token or just rely on the heuristic
        if (isSentenceEnd(prevToken)) {
            break;
        }
        start--;
    }

    // Search end
    let end = index;
    while (end < tokens.length - 1) {
        const token = tokens[end];
        if (!token.trim()) {
            end++;
            continue;
        }

        if (isSentenceEnd(token)) {
            break;
        }
        end++;
    }

    // OPTIMIZATION: Trim leading whitespace from the range
    while (start < end && !tokens[start].trim()) {
        start++;
    }

    // OPTIMIZATION: Trim trailing whitespace from the range (optional, but good for UI)
    // while (end > start && !tokens[end].trim()) {
    //     end--;
    // }

    const range: number[] = [];
    for (let i = start; i <= end; i++) {
        range.push(i);
    }
    return range;
};
