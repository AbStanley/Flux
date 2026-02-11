import { Injectable, Logger } from '@nestjs/common';
import { OllamaClientService } from './ollama-client.service';
import {
  getTranslatePrompt,
  getExplainPrompt,
  getRichTranslationPrompt,
} from '../prompts';
import { cleanResponse, cleanAndParseJson } from '../utils/ollama-utils';
import { RichTranslation } from '../interfaces/ollama.interfaces';

@Injectable()
export class OllamaTranslationService {
  private readonly logger = new Logger(OllamaTranslationService.name);

  constructor(private readonly ollamaClient: OllamaClientService) { }

  async translateText(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    sourceLanguage?: string;
    model?: string;
  }): Promise<{ response: string; sourceLanguage?: string }> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const prompt = getTranslatePrompt(
      params.text,
      params.targetLanguage,
      params.context,
      params.sourceLanguage,
    );

    const isAuto = !params.sourceLanguage || params.sourceLanguage === 'Auto';
    const response = await this.ollamaClient.generate(model, prompt, false);

    if (isAuto) {
      try {
        const parsed = cleanAndParseJson<{
          detectedLanguage: string;
          translation: string;
        }>(response.response);
        return {
          response: parsed.translation,
          sourceLanguage: parsed.detectedLanguage,
        };
      } catch (e) {
        this.logger.error('Failed to parse auto-translation JSON:', e);
        // Fallback to simple cleaning if JSON parse fails
        return { response: cleanResponse(response.response) };
      }
    }

    return { response: cleanResponse(response.response) };
  }

  async explainText(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    model?: string;
  }): Promise<string> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const prompt = getExplainPrompt(
      params.text,
      params.targetLanguage,
      params.context,
    );

    const response = await this.ollamaClient.generate(model, prompt, false);
    return cleanResponse(response.response);
  }

  async getRichTranslation(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    sourceLanguage?: string;
    model?: string;
  }): Promise<RichTranslation> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const prompt = getRichTranslationPrompt(
      params.text,
      params.targetLanguage,
      params.context,
      params.sourceLanguage,
    );

    const response = await this.ollamaClient.generate(
      model,
      prompt,
      false,
      'json',
      { num_predict: 4096 },
    );
    return cleanAndParseJson<RichTranslation>(response.response);
  }
}
