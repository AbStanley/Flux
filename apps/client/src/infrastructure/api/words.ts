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
}

const ENDPOINT = '/api/words';

export const wordsApi = {
    getAll: async (params?: { sort?: string; sourceLanguage?: string }) => {
        return defaultClient.get<Word[]>(ENDPOINT, params as Record<string, string>);
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
