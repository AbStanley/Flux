import { Injectable, Logger } from '@nestjs/common';
import { OllamaClientService } from './ollama-client.service';
import { OllamaTranslationService } from './ollama-translation.service';
import { OllamaGrammarService } from './ollama-grammar.service';
import { OllamaGenerationService } from './ollama-generation.service';
import {
  GrammarAnalysisResponse,
  RichTranslation,
  Message,
} from '../interfaces/ollama.interfaces';
import { ContentType } from '../prompts';

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);

  constructor(
    private readonly client: OllamaClientService,
    private readonly translation: OllamaTranslationService,
    private readonly grammar: OllamaGrammarService,
    private readonly generation: OllamaGenerationService,
  ) { }

  async chat(model: string, messages: Message[], stream: boolean = false) {
    return this.client.chat(model, messages, stream);
  }

  async generate(model: string, prompt: string, stream: boolean = false) {
    return this.client.generate(model, prompt, stream);
  }

  async listTags() {
    return this.client.listTags();
  }

  async generateExamples(params: {
    word: string;
    definition?: string;
    sourceLanguage: string;
    targetLanguage: string;
    model?: string;
    count?: number;
    existingExamples?: string[];
  }) {
    return this.generation.generateExamples(params);
  }

  async translateText(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    sourceLanguage?: string;
    model?: string;
  }): Promise<{ response: string; sourceLanguage?: string }> {
    return this.translation.translateText(params);
  }

  async explainText(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    model?: string;
  }): Promise<string> {
    return this.translation.explainText(params);
  }

  async getRichTranslation(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    sourceLanguage?: string;
    model?: string;
  }): Promise<RichTranslation> {
    return this.translation.getRichTranslation(params);
  }

  async generateContent(params: {
    topic?: string;
    sourceLanguage: string;
    isLearningMode: boolean;
    proficiencyLevel: string;
    contentType: ContentType;
    model?: string;
  }): Promise<string> {
    return this.generation.generateContent(params);
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
    return this.generation.generateGameContent(params);
  }

  async analyzeGrammar(params: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    model?: string;
  }): Promise<GrammarAnalysisResponse> {
    return this.grammar.analyzeGrammar(params);
  }
}
