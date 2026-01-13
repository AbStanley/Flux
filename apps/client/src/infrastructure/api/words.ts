import { defaultClient } from './api-client';

export interface Word {
    id: string;
    text: string;
    definition?: string;
    context?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    sourceTitle?: string;
    imageUrl?: string;
    pronunciation?: string;
    createdAt: string;
    examples?: Example[];
    type?: 'word' | 'phrase';
}

export interface Example {
    id: string;
    sentence: string;
    translation?: string;
}

export interface CreateWordRequest {
    text: string;
    definition?: string;
    context?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    sourceTitle?: string;
    imageUrl?: string;
    pronunciation?: string;
    examples?: { sentence: string; translation?: string }[];
    type?: 'word' | 'phrase';
}

const ENDPOINT = '/api/words';

export const wordsApi = {
    getAll: async (params?: { sort?: string; sourceLanguage?: string; skip?: number; take?: number; type?: 'word' | 'phrase' }) => {
        const queryParams: Record<string, string> = {};
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams[key] = String(value);
                }
            });
        }
        return defaultClient.get<{ items: Word[]; total: number }>(ENDPOINT, queryParams);
    },

    create: async (data: CreateWordRequest) => {
        return defaultClient.post<Word>(ENDPOINT, data);
    },

    delete: async (id: string) => {
        return defaultClient.delete<void>(`${ENDPOINT}/${id}`);
    },

    update: async (id: string, data: Partial<CreateWordRequest>) => {
        return defaultClient.patch<Word>(`${ENDPOINT}/${id}`, data);
    }
};
