import { getApiBaseUrl } from './base-url';
import { getStoredApiUrl } from '../settings/settings.store';

export class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl;
    }

    public setBaseUrl(url: string) {
        this.baseUrl = url;
    }

    // Helper to get token from appropriate storage
    private async getAuthToken(): Promise<string | null> {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            return new Promise((resolve) => {
                chrome.storage.local.get(['flux_auth_token'], (result) => {
                    const data = result as { flux_auth_token?: string };
                    resolve(data.flux_auth_token || null);
                });
            });
        }
        return localStorage.getItem('flux_auth_token');
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const storedUrl = await getStoredApiUrl();
        const activeBaseUrl = storedUrl || this.baseUrl;
        const url = endpoint.startsWith('http') ? endpoint : `${activeBaseUrl}${endpoint}`;

        console.log(`[Flux Network Probe] Requesting: ${url}`);

        const method = options.method || 'GET';
        const body = options.body;

        // Inject JWT token from storage
        const token = await this.getAuthToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
            if (response.status === 401) {
                localStorage.removeItem('flux_auth_token');
                window.location.reload();
                throw new Error('Session expired. Please log in again.');
            }
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
