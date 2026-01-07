/// <reference types="chrome" />

export class OllamaTransport {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private isExtension(): boolean {
        return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.sendMessage;
    }

    private get apiBaseUrl(): string {
        if (this.baseUrl) return this.baseUrl;
        return this.isExtension() ? 'http://127.0.0.1:11434' : '';
    }

    async getTags(): Promise<any> {
        const url = `${this.apiBaseUrl}/api/tags`;
        try {
            if (this.isExtension()) {
                const response = await chrome.runtime.sendMessage({
                    type: 'PROXY_REQUEST',
                    data: { url, method: 'GET' }
                });
                if (!response.success) throw new Error(response.error);
                return response.data;
            } else {
                const response = await fetch(url);
                if (!response.ok) return null;
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to fetch Ollama tags:', error);
            throw error;
        }
    }

    async generate(body: any, options?: {
        onProgress?: (chunk: string, fullText: string) => void;
        signal?: AbortSignal;
    }): Promise<string> {
        const isStreaming = !!options?.onProgress;
        const requestBody = {
            ...body,
            stream: isStreaming
        };

        if (this.isExtension()) {
            return this.generateExtension(requestBody, isStreaming, options?.onProgress);
        }

        const url = `${this.apiBaseUrl}/api/generate`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
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
    }

    private async generateExtension(body: any, isStreaming: boolean, onProgress?: (chunk: string, fullText: string) => void): Promise<string> {
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
                    url: `${this.apiBaseUrl}/api/generate`,
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
}
