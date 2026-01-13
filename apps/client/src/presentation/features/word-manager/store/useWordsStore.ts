import { create } from 'zustand';
import { wordsApi, type Word, type CreateWordRequest } from '../../../../infrastructure/api/words';

interface PaginatedState {
    items: Word[];
    total: number;
    page: number;
    hasMore: boolean;
    isLoading: boolean;
}

const initialPaginatedState: PaginatedState = {
    items: [],
    total: 0,
    page: 1,
    hasMore: true,
    isLoading: false,
};

interface WordsState {
    wordsState: PaginatedState;
    phrasesState: PaginatedState;
    error: string | null;

    fetchWords: (type: 'word' | 'phrase', page?: number) => Promise<void>;

    addWord: (data: CreateWordRequest) => Promise<Word>;
    deleteWord: (id: string, type: 'word' | 'phrase') => Promise<void>;
    updateWord: (id: string, data: Partial<CreateWordRequest>) => Promise<Word>;
}

export const useWordsStore = create<WordsState>((set, get) => ({
    wordsState: { ...initialPaginatedState },
    phrasesState: { ...initialPaginatedState },
    error: null,

    fetchWords: async (type, page = 1) => {
        const stateKey = type === 'word' ? 'wordsState' : 'phrasesState';

        set(state => ({
            [stateKey]: { ...state[stateKey], isLoading: true },
            error: null
        }));

        try {
            const take = 10;
            const skip = (page - 1) * take;

            const response = await wordsApi.getAll({
                type,
                skip,
                take,
                sort: 'date_desc'
            });

            // Handle both new (paginated) and old (array) response formats
            let items: Word[] = [];
            let total = 0;

            if ('items' in response && Array.isArray((response as any).items)) {
                items = (response as any).items;
                total = (response as any).total;
            } else if (Array.isArray(response)) {
                items = response as Word[];
                total = items.length;
            }

            set(state => {
                const currentItems = page === 1 ? [] : state[stateKey].items;
                return {
                    [stateKey]: {
                        items: [...currentItems, ...items],
                        total,
                        page,
                        hasMore: items.length === take,
                        isLoading: false
                    }
                };
            });
        } catch (err) {
            set(state => ({
                error: err instanceof Error ? err.message : 'An error occurred',
                [stateKey]: { ...state[stateKey], isLoading: false }
            }));
        }
    },

    addWord: async (data) => {
        // Auto-detect type
        const type: 'word' | 'phrase' = data.text.trim().split(/\s+/).length > 1 ? 'phrase' : 'word';
        const dataWithType = { ...data, type };
        const stateKey = type === 'word' ? 'wordsState' : 'phrasesState';

        set({ error: null });
        try {
            const newWord = await wordsApi.create(dataWithType);

            set(state => ({
                [stateKey]: {
                    ...state[stateKey],
                    items: [newWord, ...state[stateKey].items],
                    total: state[stateKey].total + 1
                }
            }));
            return newWord;
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to add word';
            set({ error: errorMsg });
            throw err;
        }
    },

    deleteWord: async (id, type) => {
        const stateKey = type === 'word' ? 'wordsState' : 'phrasesState';
        try {
            await wordsApi.delete(id);
            set(state => ({
                [stateKey]: {
                    ...state[stateKey],
                    items: state[stateKey].items.filter(w => w.id !== id),
                    total: Math.max(0, state[stateKey].total - 1)
                }
            }));
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to delete word' });
            throw err;
        }
    },

    updateWord: async (id, data) => {
        set({ error: null });

        // We need to know the original word type to handle type switching (word -> phrase)
        const { wordsState, phrasesState } = get();
        const existingInWords = wordsState.items.find(w => w.id === id);
        const existingInPhrases = phrasesState.items.find(w => w.id === id);
        const originalType = existingInWords ? 'word' : existingInPhrases ? 'phrase' : null;

        if (!originalType) return {} as Word;

        let dataToUpdate = { ...data };
        let newType: 'word' | 'phrase' = originalType;

        if (data.text) {
            newType = data.text.trim().split(/\s+/).length > 1 ? 'phrase' : 'word';
            dataToUpdate = { ...dataToUpdate, type: newType };
        }

        try {
            const updatedWord = await wordsApi.update(id, dataToUpdate);

            set(state => {
                if (newType === originalType) {
                    const key = newType === 'word' ? 'wordsState' : 'phrasesState';
                    return {
                        [key]: {
                            ...state[key],
                            items: state[key].items.map(w => w.id === id ? updatedWord : w)
                        }
                    };
                }

                const oldKey = originalType === 'word' ? 'wordsState' : 'phrasesState';
                const newKey = newType === 'word' ? 'wordsState' : 'phrasesState';

                return {
                    [oldKey]: {
                        ...state[oldKey],
                        items: state[oldKey].items.filter(w => w.id !== id),
                        total: Math.max(0, state[oldKey].total - 1)
                    },
                    [newKey]: {
                        ...state[newKey],
                        items: [updatedWord, ...state[newKey].items],
                        total: state[newKey].total + 1
                    }
                };
            });
            return updatedWord;
        } catch (err) {
            set({ error: err instanceof Error ? err.message : 'Failed to update word' });
            throw err;
        }
    }
}));
