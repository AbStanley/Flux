import type {
  IAIService,
  RichTranslationResult,
} from "../../core/interfaces/IAIService";
import type { ContentType, ProficiencyLevel } from "../../core/types/AIConfig";

export class ServerAIService implements IAIService {
  private baseUrl: string;

  private model: string;

  constructor(
    baseUrl: string = "http://localhost:3002/api",
    model: string = "translategemma:4b",
  ) {
    this.baseUrl = baseUrl;
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
    options?: {
      onProgress?: (chunk: string, fullText: string) => void;
      signal?: AbortSignal;
      [key: string]: unknown;
    },
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: true,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(`AI Service Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  async translateText(
    text: string,
    targetLanguage: string = "en",
    context?: string,
    sourceLanguage?: string,
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/translate`, {
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

    if (!response.ok) throw new Error("Translation failed");
    return await response.text();
  }

  async explainText(
    text: string,
    targetLanguage: string = "en",
    context?: string,
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        targetLanguage,
        context,
        model: this.model,
      }),
    });

    if (!response.ok) throw new Error("Explanation failed");
    return await response.text();
  }

  async getRichTranslation(
    text: string,
    targetLanguage: string = "en",
    context?: string,
    sourceLanguage?: string,
  ): Promise<RichTranslationResult> {
    const response = await fetch(`${this.baseUrl}/rich-translation`, {
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

    if (!response.ok) throw new Error("Rich translate failed");
    return await response.json();
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`);
      if (!response.ok) return [];
      const data = await response.json();
      return data?.models?.map((m: { name: string }) => m.name) || [];
    } catch {
      return [];
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Custom method for specialized content generation (e.g. Stories)
  // This replaces the usage of 'generateText' with client-side prompts
  async generateContent(params: {
    topic?: string;
    sourceLanguage: string;
    isLearningMode: boolean;
    proficiencyLevel: ProficiencyLevel;
    contentType: ContentType;
  }): Promise<string> {
    const response = await fetch(`${this.baseUrl}/generate-content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...params,
        model: this.model,
      }),
    });

    if (!response.ok) throw new Error("Content generation failed");
    return await response.text();
  }

  async generateGameContent(params: {
    topic: string;
    level: string;
    mode: string;
    sourceLanguage: string;
    targetLanguage: string;
    limit?: number;
  }): Promise<string> {
    const response = await fetch(`${this.baseUrl}/generate-game-content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...params,
        model: this.model,
      }),
    });

    if (!response.ok) throw new Error("Game content generation failed");
    return await response.text();
  }
}

export const serverAIService = new ServerAIService();
