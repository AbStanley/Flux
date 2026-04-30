import { create } from 'zustand';
import { wordsApi, type Word, type CreateWordRequest } from '../../../../infrastructure/api/words';

interface PaginatedState {
    items: Word[];
    total: number;
    page: number;
    hasMore: boolean;
    isLoading: boolean;
    hasLoaded: boolean;
}

const initialPaginatedState: PaginatedState = {
    items: [],
    total: 0,
    page: 1,
    hasMore: true,
    isLoading: false,
    hasLoaded: false,
};

interface WordsState {
    wordsState: PaginatedState;
    phrasesState: PaginatedState;
    error: string | null;

    fetchWords: (
        type: 'word' | 'phrase',
        page?: number,
        search?: string,
        sort?: string,
        sourceLanguage?: string,
        targetLanguage?: string
    ) => Promise<void>;

    addWord: (data: CreateWordRequest) => Promise<Word>;
    deleteWord: (id: string, type: 'word' | 'phrase') => Promise<void>;
    updateWord: (id: string, data: Partial<CreateWordRequest>) => Promise<Word>;
}

export const useWordsStore = create<WordsState>((set, get) => ({
    wordsState: { ...initialPaginatedState },
    phrasesState: { ...initialPaginatedState },
    error: null,

    fetchWords: async (type, page = 1, search, sort = 'date_desc', sourceLanguage, targetLanguage) => {
        const stateKey = type === 'word' ? 'wordsState' : 'phrasesState';

        // Prevent concurrent fetches for pagination, but allow fresh page=1 queries.
        const current = get()[stateKey];
        if (current.isLoading && page !== 1) return;

        set(state => ({
            [stateKey]: { ...state[stateKey], isLoading: true },
            error: null
        }));

        try {

            const response = await wordsApi.getAll({
                type,
                page,
                search,
                sort,
                sourceLanguage,
                targetLanguage
            });

            // Handle both new (paginated) and old (array) response formats
            let items: Word[] = [];
            let total = 0;

            interface PaginatedResponse {
                items: Word[];
                total: number;
            }

            if ('items' in response && Array.isArray((response as PaginatedResponse).items)) {
                const paginatedResponse = response as PaginatedResponse;
                items = paginatedResponse.items;
                total = paginatedResponse.total;
            } else if (Array.isArray(response)) {
                items = response as Word[];
                total = items.length;
            }

            set(state => {
                const currentItems = page === 1 ? [] : state[stateKey].items;
                const newTotalItems = currentItems.length + items.length;
                
                // Robust hasMore logic: 
                // 1. Must have returned at least one item this time
                // 2. Total items fetched must be less than the reported total
                const hasMore = items.length > 0 && newTotalItems < total;

                return {
                    [stateKey]: {
                        items: [...currentItems, ...items],
                        total,
                        page,
                        hasMore,
                        isLoading: false,
                        hasLoaded: true
                    }
                };
            });
        } catch (err) {
            set(state => ({
                error: err instanceof Error ? err.message : 'An error occurred',
                [stateKey]: { ...state[stateKey], isLoading: false, hasMore: false }
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

        try {
            const updatedWord = await wordsApi.update(id, data);
            const newType = updatedWord.type || 'word';
            const newKey = newType === 'word' ? 'wordsState' : 'phrasesState';

            set(state => {
                // Find where it was originally
                const inWords = state.wordsState.items.some(w => w.id === id);
                const inPhrases = state.phrasesState.items.some(w => w.id === id);
                const originalType = inWords ? 'word' : inPhrases ? 'phrase' : null;

                // Case 1: Type didn't change (or it wasn't found in lists)
                if (originalType === newType || !originalType) {
                    const key = originalType ? (originalType === 'word' ? 'wordsState' : 'phrasesState') : newKey;
                    
                    // If it was in the list, update it. If not, add it to the top.
                    const alreadyInList = state[key].items.some(w => w.id === id);
                    
                    return {
                        [key]: {
                            ...state[key],
                            items: alreadyInList 
                                ? state[key].items.map(w => w.id === id ? updatedWord : w)
                                : [updatedWord, ...state[key].items],
                            total: alreadyInList ? state[key].total : state[key].total + 1
                        }
                    };
                }

                // Case 2: Type changed (Word <-> Phrase)
                const oldKey = originalType === 'word' ? 'wordsState' : 'phrasesState';
                
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
