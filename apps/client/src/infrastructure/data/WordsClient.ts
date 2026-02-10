import { ApiClient } from '../api/api-client';

export interface SaveWordDTO {
    text: string;
    definition?: string;
    context?: string;
}

export class WordsClient {
    private client: ApiClient;

    constructor() {
        let baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_OLLAMA_URL;
        if (!baseUrl) {
            baseUrl = 'http://localhost:3000';
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
