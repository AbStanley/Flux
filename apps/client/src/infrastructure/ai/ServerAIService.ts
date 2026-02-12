import type {
  IAIService,
  RichTranslationResult,
} from "../../core/interfaces/IAIService";
import type { ContentType, ProficiencyLevel } from "../../core/types/AIConfig";
import { defaultClient } from "../api/api-client";

export class ServerAIService implements IAIService {
  private model: string;

  constructor(model: string = "translategemma:4b") {
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
