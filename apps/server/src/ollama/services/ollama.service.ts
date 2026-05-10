import { Injectable, Logger } from '@nestjs/common';
import type { GenerateResponse } from 'ollama';
import { OllamaClientService } from './ollama-client.service';
import { OllamaTranslationService } from './ollama-translation.service';
import { OllamaGrammarService } from './ollama-grammar.service';
import { OllamaGenerationService } from './ollama-generation.service';
import {
  GrammarAnalysisResponse,
  WritingAnalysisResponse,
  RichTranslation,
  RichConjugations,
  Message,
} from '../interfaces/ollama.interfaces';
import { OllamaWritingService } from './ollama-writing.service';
import { ContentType } from '../prompts';

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);

  constructor(
    private readonly client: OllamaClientService,
    private readonly translation: OllamaTranslationService,
    private readonly grammar: OllamaGrammarService,
    private readonly generation: OllamaGenerationService,
    private readonly writing: OllamaWritingService,
  ) {}

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
    signal?: AbortSignal;
  }) {
    return this.generation.generateExamples(params);
  }

  async translateText(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    sourceLanguage?: string;
    model?: string;
    signal?: AbortSignal;
  }): Promise<{ response: string; sourceLanguage?: string }> {
    return this.translation.translateText(params);
  }

  async explainText(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    model?: string;
    signal?: AbortSignal;
  }): Promise<string> {
    return this.translation.explainText(params);
  }

  async getRichTranslation(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    sourceLanguage?: string;
    model?: string;
    signal?: AbortSignal;
  }): Promise<RichTranslation> {
    return this.translation.getRichTranslation(params);
  }

  async getRichTranslationStream(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    sourceLanguage?: string;
    model?: string;
    signal?: AbortSignal;
  }): Promise<AsyncIterable<GenerateResponse>> {
    return this.translation.getRichTranslationStream(params);
  }

  async getConjugations(params: {
    infinitive: string;
    sourceLanguage: string;
    model?: string;
    signal?: AbortSignal;
  }): Promise<RichConjugations> {
    return this.translation.getConjugations(params);
  }

  getConjugationsStream(params: {
    infinitive: string;
    sourceLanguage: string;
    model?: string;
    signal?: AbortSignal;
  }): AsyncGenerator<{
    tense: string;
    rows: Array<{ pronoun: string; conjugation: string }>;
  }> {
    return this.translation.getConjugationsStream(params);
  }

  async generateContent(params: {
    topic?: string;
    sourceLanguage: string;
    isLearningMode: boolean;
    proficiencyLevel: string;
    contentType: ContentType;
    model?: string;
    signal?: AbortSignal;
  }): Promise<string> {
    return this.generation.generateContent(params);
  }

  async generateContentStream(params: {
    topic?: string;
    sourceLanguage: string;
    isLearningMode: boolean;
    proficiencyLevel: string;
    contentType: ContentType;
    model?: string;
    signal?: AbortSignal;
  }) {
    return this.generation.generateContentStream(params);
  }

  async generateGameContent(params: {
    topic: string;
    level: string;
    mode: string;
    sourceLanguage: string;
    targetLanguage: string;
    limit?: number;
    model?: string;
    sourceLangCode?: string;
    targetLangCode?: string;
    verb?: string;
    tense?: string;
    signal?: AbortSignal;
  }): Promise<string> {
    return this.generation.generateGameContent(params);
  }

  async generateGameContentStream(params: {
    topic: string;
    level: string;
    mode: string;
    sourceLanguage: string;
    targetLanguage: string;
    limit?: number;
    model?: string;
    sourceLangCode?: string;
    targetLangCode?: string;
    verb?: string;
    tense?: string;
    signal?: AbortSignal;
  }) {
    return this.generation.generateGameContentStream(params);
  }

  async analyzeGrammar(params: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    model?: string;
    signal?: AbortSignal;
  }): Promise<GrammarAnalysisResponse> {
    return this.grammar.analyzeGrammar(params);
  }

  async analyzeWriting(params: {
    text: string;
    sourceLanguage: string;
    model?: string;
    signal?: AbortSignal;
  }): Promise<WritingAnalysisResponse> {
    return this.writing.analyzeWriting(params);
  }
}
