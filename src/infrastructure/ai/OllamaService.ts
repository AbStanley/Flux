/// <reference types="chrome" />
import type { IAIService } from '../../core/interfaces/IAIService';
import { getTranslatePrompt, getRichTranslationPrompt } from './prompts/TranslationPrompts';
import { cleanResponse, extractJson, normalizeRichTranslation } from './utils/ResponseParser';

/**
 * OllamaService: The AI Connector
 * 
 * This service implements the Hybrid Architecture pattern by detecting its environment:
 * 1. **Web App Mode**: Connects directly to localhost via `fetch()`.
 * 2. **Extension Mode**: Delegates requests to the Background Worker via `runtime.sendMessage()`
 *    to bypass browser security restrictions (CSP/CORS).
 */
export class OllamaService implements IAIService {
    private baseUrl: string;
    private model: string;

    constructor(baseUrl: string = '', model: string = 'llama2') {
        // Ensure protocol
        if (baseUrl && !baseUrl.startsWith('http')) {
            baseUrl = `http://${baseUrl}`;
        }
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }
        console.log('[OllamaService] Initializing adapter with baseUrl:', baseUrl || '(empty/relative)');
        this.baseUrl = baseUrl;
        this.model = model;
    }

    setModel(model: string) {
        this.model = model;
    }

    getModel(): string {
        return this.model;
    }

    private isExtension(): boolean {
        // Robust check for extension environment
        return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.sendMessage;
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

            // Remove custom options
            delete body.onProgress;
            delete body.signal;

            if (this.isExtension()) {
                return this.generateTextExtension(body, isStreaming, options?.onProgress);
            }

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
                                options?.onProgress?.(json.response, fullText);
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
            if (error.name === 'AbortError') throw error;
            console.error('Ollama generation failed:', error);
            throw error;
        }
    }

    private async generateTextExtension(body: any, isStreaming: boolean, onProgress?: (chunk: string, fullText: string) => void): Promise<string> {
        return new Promise((resolve, reject) => {
            const port = chrome.runtime.connect({ name: 'PROXY_STREAM_CONNECTION' });
            let fullText = '';

            port.onMessage.addListener((msg: any) => {
                if (msg.type === 'CHUNK') {
                    const lines = msg.chunk.split('\n');
                    for (const line of lines) {
                        if (!line.trim()) continue;
                        try {
                            const json = JSON.parse(line);
                            if (json.response) {
                                fullText += json.response;
                                onProgress?.(json.response, fullText);
                            }
                            if (json.done && isStreaming) {
                                resolve(fullText);
                            }
                        } catch (e) { console.warn('Parse error', e); }
                    }
                } else if (msg.type === 'DONE') {
                    resolve(fullText);
                } else if (msg.type === 'ERROR') {
                    reject(new Error(msg.error));
                }
            });

            port.postMessage({
                type: 'START_STREAM',
                data: {
                    url: `${this.baseUrl || 'http://127.0.0.1:11434'}/api/generate`,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body
                }
            });

            port.onDisconnect.addListener(() => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                }
            });
        });
    }

    async translateText(text: string, targetLanguage: string = 'en', context?: string, sourceLanguage?: string): Promise<string> {
        console.log(`[OllamaService] translateText`, { text, target: targetLanguage, source: sourceLanguage });
        const prompt = getTranslatePrompt(text, targetLanguage, context, sourceLanguage);
        const rawResponse = await this.generateText(prompt);
        return cleanResponse(rawResponse);
    }

    async getRichTranslation(text: string, targetLanguage: string = 'en', context?: string, sourceLanguage?: string): Promise<any> {
        console.log(`[OllamaService] getRichTranslation`, { text, target: targetLanguage, source: sourceLanguage });
        const prompt = getRichTranslationPrompt(text, targetLanguage, context, sourceLanguage);
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
        const url = `${this.baseUrl || 'http://127.0.0.1:11434'}/api/tags`;
        try {
            let data;
            if (this.isExtension()) {
                const response = await chrome.runtime.sendMessage({
                    type: 'PROXY_REQUEST',
                    data: { url, method: 'GET' }
                });
                if (!response.success) throw new Error(response.error);
                data = response.data;
            } else {
                const response = await fetch(url);
                if (!response.ok) return [];
                data = await response.json();
            }
            return data.models?.map((m: any) => m.name) || [];
        } catch (error) {
            console.error('Failed to fetch Ollama models:', error);
            return [];
        }
    }

    async checkHealth(): Promise<boolean> {
        const url = `${this.baseUrl || 'http://127.0.0.1:11434'}/api/tags`;
        try {
            if (this.isExtension()) {
                const response = await chrome.runtime.sendMessage({
                    type: 'PROXY_REQUEST',
                    data: { url, method: 'GET' }
                });
                return response.success;
            } else {
                const response = await fetch(url);
                return response.ok;
            }
        } catch {
            return false;
        }
    }
}
