import { create } from 'zustand';

interface AIState {
    result: string;
    loading: boolean;
    error: string | null;
    abortController: AbortController | null;

    setResult: (result: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setAbortController: (controller: AbortController | null) => void;
    reset: () => void;
}

export const useAIStore = create<AIState>((set) => ({
    result: '',
    loading: false,
    error: null,
    abortController: null,

    setResult: (result) => set({ result }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setAbortController: (abortController) => set({ abortController }),
    reset: () => set({ result: '', loading: false, error: null, abortController: null }),
}));
