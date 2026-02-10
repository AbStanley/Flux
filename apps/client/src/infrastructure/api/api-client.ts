import { getApiBaseUrl } from './base-url';

export class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl;
    }

    public setBaseUrl(url: string) {
        this.baseUrl = url;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        console.log(`[Flux Network Probe] Requesting: ${url}`);
        const method = options.method || 'GET';
        const body = options.body;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        // Check for extension context to avoid CORS issues and reach localhost from browser
        if (typeof chrome !== 'undefined' && chrome?.runtime?.id) {
            console.log(`[Flux Debug] ApiClient: Proxying ${method} ${url}`);
            return new Promise<T>((resolve, reject) => {
                let parsedBody: unknown = undefined;
                if (body && typeof body === 'string') {
                    try {
                        parsedBody = JSON.parse(body);
                    } catch (e) {
                        console.warn('[Flux Debug] ApiClient: Failed to parse body as JSON', e);
                        parsedBody = body;
                    }
                }

                chrome.runtime.sendMessage({
                    type: 'PROXY_REQUEST',
                    data: {
                        url,
                        method,
                        headers,
                        body: parsedBody
                    }
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('[Flux Debug] ApiClient: Extension error:', chrome.runtime.lastError.message);
                        reject(new Error(chrome.runtime.lastError.message));
                    } else if (!response) {
                        console.error('[Flux Debug] ApiClient: No response from background script');
                        reject(new Error('No response from background script'));
                    } else if (!response.success) {
                        console.error('[Flux Debug] ApiClient: Proxy failure:', response.error);
                        reject(new Error(response.error || 'Proxy request failed'));
                    } else {
                        console.log('[Flux Debug] ApiClient: Proxy success', response.data);
                        resolve(response.data as T);
                    }
                });
            });
        }

        const config: RequestInit = {
            ...options,
            headers,
        };

        const response = await fetch(url, config);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Error: ${response.status} ${text || response.statusText}`);
        }

        if (response.status === 204) {
            return {} as T;
        }

        const contentType = response.headers?.get?.('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }
        return response.text() as unknown as T;
    }

    get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
        const queryStr = params ? `?${new URLSearchParams(params)}` : '';
        return this.request<T>(`${endpoint}${queryStr}`, { method: 'GET' });
    }

    post<T>(endpoint: string, data: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    patch<T>(endpoint: string, data: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

// Singleton instance with default configuration
const defaultBaseUrl = getApiBaseUrl();
export const defaultClient = new ApiClient(defaultBaseUrl);

export const setApiClientBaseUrl = (url: string) => {
    defaultClient.setBaseUrl(url);
};
