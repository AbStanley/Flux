import { defaultClient } from './api-client';

export interface GenerateExamplesRequest {
    word: string;
    definition?: string;
    sourceLanguage: string;
    targetLanguage: string;
    model?: string;
    count?: number;
    existingExamples?: string[];
}

export interface GeneratedExample {
    sentence: string;
    translation: string;
}

const ENDPOINT = '/api';

export const ollamaApi = {
    generateExamples: async (params: GenerateExamplesRequest): Promise<GeneratedExample[]> => {
        return defaultClient.post<GeneratedExample[]>(`${ENDPOINT}/generate-examples`, params);
    },

    listTags: async () => {
        return defaultClient.get<{ models: { name: string }[] }>(`${ENDPOINT}/tags`);
    }
};
