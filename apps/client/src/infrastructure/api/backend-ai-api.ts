import { defaultClient } from './api-client';
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
};
