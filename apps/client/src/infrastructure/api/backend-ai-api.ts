import { defaultClient, getAuthToken } from './api-client';
import type { WritingCorrection } from '@/types/writing';

/**
 * AI routes served by the Nest backend (`/api/*`).
 * The client never calls Ollama directly; the server uses OLLAMA_HOST.
 */
export const backendAiApi = {
  listModels: () =>
    defaultClient.get<{ models: { name: string }[] }>('/api/tags'),

  checkWriting: async (
    params: {
      text: string;
      sourceLanguage: string;
      model?: string;
      mode?: 'minimal' | 'full';
    },
    signal?: AbortSignal,
  ) =>
    defaultClient.post<{ text: string; corrections: WritingCorrection[] }>(
      '/api/check-writing',
      params,
      signal,
    ),

  generateTextStream: async (
    params: {
      prompt: string;
      model?: string;
    },
    opts: {
      signal?: AbortSignal;
      onChunk: (chunk: string, fullText: string) => void;
    },
  ): Promise<string> => {
    const baseUrl = await defaultClient.getActiveBaseUrl();
    const token = await getAuthToken();
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        model: params.model ?? '',
        prompt: params.prompt,
        stream: true,
      }),
      signal: opts.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    const processLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const chunk = JSON.parse(trimmed) as { response?: string };
        if (typeof chunk.response === 'string' && chunk.response.length > 0) {
          fullText += chunk.response;
          opts.onChunk(chunk.response, fullText);
        }
      } catch {
        // Ignore malformed NDJSON lines.
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) processLine(line);
    }
    if (buffer.trim()) processLine(buffer);

    return fullText.trim();
  },
};
