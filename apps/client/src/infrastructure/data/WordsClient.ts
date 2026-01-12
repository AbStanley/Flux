import { ApiClient } from '../api/api-client';

export interface SaveWordDTO {
    text: string;
    definition?: string;
    context?: string;
}

export class WordsClient {
    private client: ApiClient;

    constructor() {
        let baseUrl = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:3000';
        if (baseUrl.endsWith('/api/ollama')) {
            baseUrl = baseUrl.replace('/api/ollama', '');
        }
        this.client = new ApiClient(baseUrl);
    }

    async saveWord(word: SaveWordDTO): Promise<any> {
        return this.client.post('/api/words', word);
    }
}
