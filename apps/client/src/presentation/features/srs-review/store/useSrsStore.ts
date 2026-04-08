import { create } from 'zustand';
import { type Word, type SrsStats, wordsApi } from '../../../../infrastructure/api/words';

interface SrsState {
    status: 'idle' | 'loading' | 'reviewing' | 'finished';
    words: Word[];
    currentIndex: number;
    isFlipped: boolean;
    stats: SrsStats | null;
    reviewedCount: number;
    error: string | null;

    // Filters
    sourceLanguage: string;
    targetLanguage: string;

    // Actions
    setFilter: (key: 'sourceLanguage' | 'targetLanguage', value: string) => void;
    loadDueWords: () => Promise<void>;
    loadStats: () => Promise<void>;
    flipCard: () => void;
    submitReview: (quality: number) => Promise<void>;
    reset: () => void;
}

export const useSrsStore = create<SrsState>()((set, get) => ({
    status: 'idle',
    words: [],
    currentIndex: 0,
    isFlipped: false,
    stats: null,
    reviewedCount: 0,
    error: null,
    sourceLanguage: '',
    targetLanguage: '',

    setFilter: (key, value) => set({ [key]: value }),

    loadDueWords: async () => {
        const { sourceLanguage, targetLanguage } = get();
        set({ status: 'loading', error: null });
        try {
            const words = await wordsApi.getDueWords({
                sourceLanguage: sourceLanguage || undefined,
                targetLanguage: targetLanguage || undefined,
                limit: 20,
            });
            if (words.length === 0) {
                set({ status: 'finished', words: [], currentIndex: 0, reviewedCount: 0 });
            } else {
                set({ status: 'reviewing', words, currentIndex: 0, isFlipped: false, reviewedCount: 0 });
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to load due words';
            set({ status: 'idle', error: msg });
        }
    },

    loadStats: async () => {
        try {
            const stats = await wordsApi.getSrsStats();
            set({ stats });
        } catch {
            // Non-critical, silently fail
        }
    },

    flipCard: () => set({ isFlipped: true }),

    submitReview: async (quality: number) => {
        const { words, currentIndex, reviewedCount } = get();
        const word = words[currentIndex];
        if (!word) return;

        try {
            await wordsApi.reviewWord(word.id, quality);
            const nextIndex = currentIndex + 1;
            const newReviewed = reviewedCount + 1;

            if (nextIndex >= words.length) {
                set({ status: 'finished', reviewedCount: newReviewed });
                // Refresh stats
                get().loadStats();
            } else {
                set({ currentIndex: nextIndex, isFlipped: false, reviewedCount: newReviewed });
            }
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to submit review';
            set({ error: msg });
        }
    },

    reset: () => set({
        status: 'idle',
        words: [],
        currentIndex: 0,
        isFlipped: false,
        reviewedCount: 0,
        error: null,
    }),
}));
