import { Injectable, Logger } from '@nestjs/common';
import { OllamaClientService } from './ollama-client.service';
import {
  getStoryPrompt,
  getGameContentPrompt,
  getExamplesPrompt,
  ContentType,
} from '../prompts';
import { cleanResponse, cleanAndParseJson } from '../utils/ollama-utils';

interface ExampleRecord {
  sentence?: string;
  translation?: string;
}

@Injectable()
export class OllamaGenerationService {
  private readonly logger = new Logger(OllamaGenerationService.name);

  constructor(private readonly ollamaClient: OllamaClientService) {}

  async generateExamples(params: {
    word: string;
    definition?: string;
    sourceLanguage: string;
    targetLanguage: string;
    model?: string;
    count?: number;
    existingExamples?: string[];
  }): Promise<{ sentence: string; translation: string }[]> {
    const { count = 3 } = params;
    const model = await this.ollamaClient.ensureModel(params.model);

    const prompt = getExamplesPrompt({
      word: params.word,
      definition: params.definition,
      sourceLanguage: params.sourceLanguage,
      targetLanguage: params.targetLanguage,
      count,
      existingExamples: params.existingExamples,
    });

    const response = await this.ollamaClient.chat(
      model,
      [{ role: 'user', content: prompt }],
      false,
    );

    const parsed = cleanAndParseJson<ExampleRecord[]>(response.message.content);
    const examples = Array.isArray(parsed) ? parsed : [parsed];

    return examples
      .filter((ex) => ex && (ex.sentence || ex.translation))
      .map((ex) => ({
        sentence: String(ex.sentence || ''),
        translation: String(ex.translation || ''),
      }))
      .slice(0, count);
  }

  async generateContent(params: {
    topic?: string;
    sourceLanguage: string;
    isLearningMode: boolean;
    proficiencyLevel: string;
    contentType: ContentType;
    model?: string;
  }): Promise<string> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const prompt = getStoryPrompt({
      sourceLang: params.sourceLanguage,
      isLearningMode: params.isLearningMode,
      topic: params.topic,
      proficiencyLevel: params.proficiencyLevel,
      contentType: params.contentType,
    });

    const response = await this.ollamaClient.generate(model, prompt, false);
    return cleanResponse(response.response);
  }

  async generateGameContent(params: {
    topic: string;
    level: string;
    mode: string;
    sourceLanguage: string;
    targetLanguage: string;
    limit?: number;
    model?: string;
  }): Promise<string> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const prompt = getGameContentPrompt(
      params.topic,
      params.level,
      params.mode,
      params.sourceLanguage,
      params.targetLanguage,
      params.limit,
    );

    const response = await this.ollamaClient.generate(model, prompt, false);
    return cleanResponse(response.response);
  }
}
