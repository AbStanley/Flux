import { ApiClient } from '../api/api-client';
import { getApiBaseUrl, normalizeApiBaseUrl } from '../api/base-url';

export interface SaveWordDTO {
    text: string;
    definition?: string;
    context?: string;
}

export class WordsClient {
    private client: ApiClient;

    constructor() {
        let baseUrl = getApiBaseUrl();
        if (!baseUrl) {
            baseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
        }
        if (baseUrl.endsWith('/api/ollama')) {
            baseUrl = baseUrl.replace('/api/ollama', '');
        }
        this.client = new ApiClient(baseUrl);
    }

    async saveWord(word: SaveWordDTO): Promise<unknown> {
        return this.client.post('/api/words', word);
    }
}
