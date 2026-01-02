import type { IAIService } from '../../core/interfaces/IAIService';
import { getTranslatePrompt, getRichTranslationPrompt } from './prompts/TranslationPrompts';
import { cleanResponse, extractJson, normalizeRichTranslation } from './utils/ResponseParser';


export class OllamaService implements IAIService {
    private baseUrl: string;
    private model: string;

    constructor(baseUrl: string = '', model: string = 'llama2') {
        console.log('[OllamaService] Initializing adapter with baseUrl:', baseUrl || '(empty/relative)');
        this.baseUrl = baseUrl;
        this.model = model;
    }

    async generateText(prompt: string, options?: {
        onProgress?: (chunk: string, fullText: string) => void;
        signal?: AbortSignal;
        [key: string]: any
    }): Promise<string> {
        try {
            const isStreaming = !!options?.onProgress;

            const body = {
                model: this.model,
                prompt: prompt,
                stream: isStreaming,
                ...options
            };

            // Remove our custom options from the body sent to Ollama
            delete body.onProgress;
            delete body.signal;

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: options?.signal
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            if (isStreaming && response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullText = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const json = JSON.parse(line);
                            if (json.response) {
                                fullText += json.response;
                                options.onProgress?.(json.response, fullText);
                            }
                            if (json.done) return fullText;
                        } catch (e) {
                            console.warn('Error parsing JSON chunk', e);
                        }
                    }
                }
                return fullText;
            } else {
                const data = await response.json();
                return data.response;
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Ollama generation aborted');
                throw error;
            }
            console.error('Ollama generation failed:', error);
            throw error;
        }
    }

    async translateText(text: string, targetLanguage: string = 'en', context?: string, sourceLanguage?: string): Promise<string> {
        // DEBUGGING: Log parameters
        console.log(`[OllamaService] translateText`, { text, target: targetLanguage, source: sourceLanguage });

        const prompt = getTranslatePrompt(text, targetLanguage, context, sourceLanguage);
        const rawResponse = await this.generateText(prompt);

        return cleanResponse(rawResponse);
    }

    async getRichTranslation(text: string, targetLanguage: string = 'en', context?: string, sourceLanguage?: string): Promise<any> {
        console.log(`[OllamaService] getRichTranslation`, { text, target: targetLanguage, source: sourceLanguage });

        const prompt = getRichTranslationPrompt(text, targetLanguage, context, sourceLanguage);

        // Use a larger token limit for rich translation to ensure JSON isn't truncated
        const rawResponse = await this.generateText(prompt, { num_predict: 4096 });

        try {
            const data = extractJson(rawResponse);
            return normalizeRichTranslation(data);
        } catch (e) {
            console.error("Failed to parse rich translation JSON", rawResponse);
            throw new Error("Failed to parse rich translation response");
        }
    }


    async getAvailableModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.models?.map((m: any) => m.name) || [];
        } catch (error) {
            console.error('Failed to fetch Ollama models:', error);
            return [];
        }
    }

    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`); // Simple endpoint to check connectivity
            return response.ok;
        } catch {
            return false;
        }
    }
}
