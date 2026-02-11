import type {
  IAIService,
  RichTranslationResult,
} from "../../core/interfaces/IAIService";
import type { ContentType, ProficiencyLevel } from "../../core/types/AIConfig";
import { getApiBaseUrl, normalizeApiBaseUrl } from "../api/base-url";

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string | object;
  signal?: AbortSignal;
}

interface ChromeResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export class ServerAIService implements IAIService {
  private baseUrl: string;
  private model: string;

  constructor(
    baseUrl: string = getApiBaseUrl(),
    model: string = "translategemma:4b",
  ) {
    this.baseUrl = normalizeApiBaseUrl(baseUrl);
    this.model = model;
  }

  setModel(model: string) {
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  setBaseUrl(url: string) {
    this.baseUrl = normalizeApiBaseUrl(url);
  }

  /**
   * Environment-aware request helper.
   * If running in a Chrome Extension context, routes through background script proxy.
   * Otherwise uses standard fetch.
   */
  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const method = options.method || 'GET';
    const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined;
    const headers = options.headers || {};

    // DEBUG: Connectivity Diagnosis
    console.log(`[Flux Debug] Requesting: ${method} ${url}`);
    console.log(`[Flux Debug] Context: chrome=${typeof chrome}, runtime=${typeof chrome?.runtime}, sendMessage=${typeof chrome?.runtime?.sendMessage}`);

    // Check for Extension context
    if (typeof chrome !== 'undefined' && chrome?.runtime?.sendMessage) {
      console.log('[Flux Debug] ServerAIService: Routing via proxy:', url);
      return new Promise<T>((resolve, reject) => {
        try {
          chrome.runtime.sendMessage({
            type: 'PROXY_REQUEST',
            data: {
              url,
              method,
              headers,
              body
            }
          }, (response: ChromeResponse) => {
            // Handle message sending failure (e.g. no background script)
            if (chrome.runtime.lastError) {
              console.error('[Flux Debug] ServerAIService: Runtime.lastError:', chrome.runtime.lastError);
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (!response) {
              // This happens if the message port is closed before response
              console.error('[Flux Debug] ServerAIService: No response received (Background script dead?)');
              reject(new Error('No response from background script'));
              return;
            }

            console.log('[Flux Debug] ServerAIService: Proxy response received:', response.success);
            if (!response.success) {
              console.error('[Flux Debug] ServerAIService: proxy failure:', response.error);
              reject(new Error(response.error || 'Proxy request failed'));
            } else {
              console.log('[Flux Debug] ServerAIService: Success, data type:', typeof response.data);
              resolve(response.data as T);
            }
          });
        } catch (e) {
          console.error('[Flux Debug] sendMessage crashed:', e);
          reject(e);
        }
      });
    }

    // Standard Fetch (for web app / backend context)
    console.log('[Flux Debug] ServerAIService: Using Standard Fetch');
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: options.signal,
      body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body)
    };

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI Service Error (${response.status}): ${text || response.statusText}`);
      }

      const contentType = response.headers?.get?.('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json() as T;
      }
      return await response.text() as unknown as T;
    } catch (error) {
      console.error('[Flux Debug] Fetch Failed:', error);
      throw error;
    }
  }

  async generateText(
    prompt: string,
    options?: {
      onProgress?: (chunk: string, fullText: string) => void;
      signal?: AbortSignal;
      [key: string]: unknown;
    },
  ): Promise<string> {
    const data = await this.request<{ response: string }>('/api/generate', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
      }),
      signal: options?.signal,
    });

    return typeof data === 'string' ? data : data.response;
  }

  async translateText(
    text: string,
    targetLanguage: string = "en",
    context?: string,
    sourceLanguage?: string,
  ): Promise<string | { response: string; sourceLanguage?: string }> {
    const data = await this.request<string | { response: string; sourceLanguage?: string }>('/api/translate', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        targetLanguage,
        context,
        sourceLanguage,
        model: this.model,
      }),
    });

    if (typeof data === 'object' && data !== null && 'sourceLanguage' in data) {
      return data;
    }

    return typeof data === 'string' ? data : (data as { response: string }).response || JSON.stringify(data);
  }

  async explainText(
    text: string,
    targetLanguage: string = "en",
    context?: string,
    sourceLanguage?: string,
  ): Promise<string> {
    const data = await this.request<string | { response: string }>('/api/explain', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        targetLanguage,
        context,
        sourceLanguage,
        model: this.model,
      }),
    });

    return typeof data === 'string' ? data : (data as { response: string }).response || JSON.stringify(data);
  }

  async getRichTranslation(
    text: string,
    targetLanguage: string = "en",
    context?: string,
    sourceLanguage?: string,
  ): Promise<RichTranslationResult> {
    return this.request<RichTranslationResult>('/api/rich-translation', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        targetLanguage,
        context,
        sourceLanguage,
        model: this.model,
      }),
    });
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const data = await this.request<{ models?: { name: string }[] }>('/api/tags');
      return data?.models?.map((m) => m.name) || [];
    } catch (err) {
      console.error('[Flux Debug] getAvailableModels error:', err);
      return [];
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.request('/api/tags');
      return true;
    } catch {
      return false;
    }
  }

  async generateContent(params: {
    topic?: string;
    sourceLanguage: string;
    isLearningMode: boolean;
    proficiencyLevel: ProficiencyLevel;
    contentType: ContentType;
  }): Promise<string> {
    return this.request<string>('/api/generate-content', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...params,
        model: this.model,
      }),
    });
  }

  async generateGameContent(params: {
    topic: string;
    level: string;
    mode: string;
    sourceLanguage: string;
    targetLanguage: string;
    limit?: number;
  }): Promise<string> {
    return this.request<string>('/api/generate-game-content', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...params,
        model: this.model,
      }),
    });
  }
}

export const serverAIService = new ServerAIService();
