import type {
  IAIService,
  RichTranslationResult,
  RichConjugationsResult,
} from "../../core/interfaces/IAIService";
import type { ContentType, ProficiencyLevel } from "../../core/types/AIConfig";
import { defaultClient, getAuthToken } from "../api/api-client";
import { parsePartialJson } from "../../lib/parsePartialJson";

export class ServerAIService implements IAIService {
  private model: string;

  constructor(model: string = "") {
    this.model = model;
  }

  setModel(model: string) {
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }



  async generateText(
    prompt: string,

  ): Promise<string> {
    const data = await defaultClient.post<{ response: string }>('/api/generate', {
      model: this.model,
      prompt: prompt,
      stream: false,
    });

    return typeof data === 'string' ? data : data.response;
  }

  async translateText(
    text: string,
    targetLanguage: string = "en",
    context?: string,
    sourceLanguage?: string,
  ): Promise<string | { response: string; sourceLanguage?: string }> {
    const data = await defaultClient.post<string | { response: string; sourceLanguage?: string }>('/api/translate', {
      text,
      targetLanguage,
      context,
      sourceLanguage,
      model: this.model,
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
    const data = await defaultClient.post<string | { response: string }>('/api/explain', {
      text,
      targetLanguage,
      context,
      sourceLanguage,
      model: this.model,
    });

    return typeof data === 'string' ? data : (data as { response: string }).response || JSON.stringify(data);
  }

  async getRichTranslation(
    text: string,
    targetLanguage: string = "en",
    context?: string,
    sourceLanguage?: string,
  ): Promise<RichTranslationResult> {
    return defaultClient.post<RichTranslationResult>('/api/rich-translation', {
      text,
      targetLanguage,
      context,
      sourceLanguage,
      model: this.model,
    });
  }

  async getConjugations(
    infinitive: string,
    sourceLanguage: string,
  ): Promise<RichConjugationsResult> {
    return defaultClient.post<RichConjugationsResult>('/api/rich-translation/conjugations', {
      infinitive,
      sourceLanguage,
      model: this.model,
    });
  }

  /**
   * Streams the conjugations endpoint's NDJSON response. Each line is a
   * `{tense, rows}` object as soon as that tense completes on the server.
   * Falls back to the non-streaming call on any fetch failure.
   */
  async getConjugationsStream(
    infinitive: string,
    sourceLanguage: string,
    opts: {
      signal?: AbortSignal;
      onTense: (tense: string, rows: Array<{ pronoun: string; conjugation: string }>) => void;
    },
  ): Promise<RichConjugationsResult> {
    const body = JSON.stringify({
      infinitive,
      sourceLanguage,
      model: this.model,
      stream: true,
    });

    try {
      const baseUrl = await defaultClient.getActiveBaseUrl();
      const url = `${baseUrl}/api/rich-translation/conjugations`;
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: opts.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`Stream request failed: ${res.status} ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const conjugations: RichConjugationsResult["conjugations"] = {};

      const processLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        try {
          const item = JSON.parse(trimmed) as {
            tense?: string;
            rows?: Array<{ pronoun: string; conjugation: string }>;
          };
          if (typeof item.tense === "string" && Array.isArray(item.rows) && item.rows.length > 0) {
            conjugations[item.tense] = item.rows;
            opts.onTense(item.tense, item.rows);
          }
        } catch {
          // Skip malformed lines — the next chunk may complete them.
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) processLine(line);
      }
      if (buffer.trim()) processLine(buffer);

      return { conjugations };
    } catch (err) {
      console.warn("[ServerAIService] conjugations stream failed, falling back:", err);
      const result = await this.getConjugations(infinitive, sourceLanguage);
      for (const [tense, rows] of Object.entries(result.conjugations)) {
        opts.onTense(tense, rows);
      }
      return result;
    }
  }

  /**
   * Streams the rich-translation NDJSON response directly (bypassing the
   * chrome.runtime proxy, which can't carry a ReadableStream). Each line
   * is a partial Ollama chunk; we accumulate the `response` field, run a
   * best-effort JSON parse on the cumulative text, and hand any newly-
   * completed partial to the caller's `onPartial` so the UI can render
   * fields as they land.
   *
   * On stream failure (fetch throws, non-OK status, or no body) falls
   * back to the non-streaming call and emits a single partial at the end.
   */
  async getRichTranslationStream(
    text: string,
    opts: {
      targetLanguage?: string;
      context?: string;
      sourceLanguage?: string;
      signal?: AbortSignal;
      onPartial: (partial: Partial<RichTranslationResult>) => void;
    },
  ): Promise<RichTranslationResult> {
    const targetLanguage = opts.targetLanguage ?? "en";
    const body = JSON.stringify({
      text,
      targetLanguage,
      context: opts.context,
      sourceLanguage: opts.sourceLanguage,
      model: this.model,
      stream: true,
    });

    try {
      const baseUrl = await defaultClient.getActiveBaseUrl();
      const url = `${baseUrl}/api/rich-translation`;
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: opts.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error(`Stream request failed: ${res.status} ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let lastEmitted: string | null = null;

      const emitIfChanged = () => {
        const parsed = parsePartialJson<Partial<RichTranslationResult>>(accumulated);
        if (!parsed) return;
        const snapshot = JSON.stringify(parsed);
        if (snapshot === lastEmitted) return;
        lastEmitted = snapshot;
        opts.onPartial(parsed);
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const chunk = JSON.parse(trimmed) as { response?: string; done?: boolean };
            if (typeof chunk.response === "string") {
              accumulated += chunk.response;
              emitIfChanged();
            }
          } catch {
            // Malformed line — keep going, the next chunk may complete it.
          }
        }
      }
      // Flush any leftover buffered line.
      if (buffer.trim()) {
        try {
          const chunk = JSON.parse(buffer.trim()) as { response?: string };
          if (typeof chunk.response === "string") {
            accumulated += chunk.response;
            emitIfChanged();
          }
        } catch {
          // ignore
        }
      }

      const final = parsePartialJson<RichTranslationResult>(accumulated);
      if (!final) {
        throw new Error("Stream ended with unparseable JSON");
      }
      return final;
    } catch (err) {
      console.warn("[ServerAIService] rich stream failed, falling back:", err);
      const fallback = await this.getRichTranslation(
        text,
        targetLanguage,
        opts.context,
        opts.sourceLanguage,
      );
      opts.onPartial(fallback);
      return fallback;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const data = await defaultClient.get<{ models?: { name: string }[] }>('/api/tags');
      return data?.models?.map((m) => m.name) || [];
    } catch (err) {
      console.error('[Flux Debug] getAvailableModels error:', err);
      return [];
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await defaultClient.get('/api/tags');
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
    return defaultClient.post<string>('/api/generate-content', {
      ...params,
      model: this.model,
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
    return defaultClient.post<string>('/api/generate-game-content', {
      ...params,
      model: this.model,
    });
  }
}

export const serverAIService = new ServerAIService();
