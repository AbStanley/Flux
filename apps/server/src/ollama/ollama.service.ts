import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Ollama } from 'ollama';
import {
  GRAMMAR_ANALYSIS_PROMPT,
  getTranslatePrompt,
  getRichTranslationPrompt,
  getExplainPrompt,
  getStoryPrompt,
  getGameContentPrompt,
  getExamplesPrompt,
  ContentType,
} from './ollama.prompts';

export interface GrammarAnalysisResponse {
  grammar: {
    word: string;
    type: string;
    explanation: string;
  }[];
}

export interface RichTranslation {
  word: string;
  pronunciation: string;
  definitions: {
    type: string;
    definition: string;
    example: string;
    translation: string;
  }[];
}

@Injectable()
export class OllamaService {
  private ollama: Ollama;
  private readonly logger = new Logger(OllamaService.name);

  private readonly ollamaHost: string;

  constructor() {
    this.ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    this.ollama = new Ollama({ host: this.ollamaHost });
    this.logger.log(`Ollama Service initialized with host: ${this.ollamaHost}`);
  }

  async chat(model: string, messages: any[], stream: boolean = false) {
    try {
      this.logger.log(`Sending chat request to model: ${model}`);
      if (stream) {
        return await this.ollama.chat({
          model,
          messages,
          stream: true,
        });
      } else {
        return await this.ollama.chat({
          model,
          messages,
          stream: false,
        });
      }
    } catch (error) {
      this.logger.error('Error in chat request', error);
    }
  }

  async generate(model: string, prompt: string, stream: boolean = false) {
    try {
      this.logger.log(`Sending generate request to model: ${model}`);
      if (stream) {
        return await this.ollama.generate({
          model,
          prompt,
          stream: true,
        });
      } else {
        return await this.ollama.generate({
          model,
          prompt,
          stream: false,
        });
      }
    } catch (error) {
      this.logger.error('Error in generate request', error);
      throw error;
    }
  }

  async listTags() {
    try {
      this.logger.log('Sending list tags request');
      return await this.ollama.list();
    } catch (error) {
      this.logger.error('Error in list tags request', error);
      throw error;
    }
  }

  /**
   * Generate example sentences for a word using the LLM.
   * Returns an array of { sentence, translation } objects.
   */
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
    let { model } = params;

    model = await this.ensureModel(model);

    const prompt = getExamplesPrompt({
      word: params.word,
      definition: params.definition,
      sourceLanguage: params.sourceLanguage,
      targetLanguage: params.targetLanguage,
      count,
      existingExamples: params.existingExamples,
    });

    let text = '';
    try {
      this.logger.log(
        `Generating ${count} examples for word: ${params.word} using model: ${model}`,
      );
      const response = await this.ollama.chat({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        format: 'json',
        options: {
          num_ctx: 4096,
          num_predict: 2048,
          temperature: 0.8, // Slightly higher temperature for more variety
        },
      });

      text = response.message.content.trim();
      this.logger.debug(`Ollama response for examples: ${text}`);

      let parsed: any;
      try {
        parsed = this.cleanAndParseJson<any>(text);
      } catch (e: any) {
        this.logger.warn(`Initial JSON parse failed, trying object extraction: ${e.message}`);
        // Fallback: extract all {...} blocks
        const matches = text.match(/\{[\s\S]*?\}/g);
        if (matches) {
          parsed = matches.map(m => {
            try { return JSON.parse(m); } catch { return null; }
          }).filter(Boolean);
        } else {
          throw e; // Rethrow if even fallback fails
        }
      }

      // Handle both array and { examples: [...] } or { results: [...] } formats
      let examples = [];
      if (Array.isArray(parsed)) {
        examples = parsed;
      } else if (parsed && typeof parsed === 'object') {
        const arrayProp = Object.values(parsed).find((val) => Array.isArray(val));
        if (arrayProp) {
          examples = arrayProp as any[];
        } else if (parsed.sentence || parsed.translation) {
          examples = [parsed];
        }
      }

      return examples
        .filter((ex) => ex && (ex.sentence || ex.translation))
        .map((ex) => ({
          sentence: String(ex.sentence || ''),
          translation: String(ex.translation || ''),
        }))
        .slice(0, count);
    } catch (e: any) {
      this.logger.warn(
        `Failed to parse examples JSON. Response: ${text.substring(0, 500)}`,
      );
      this.logger.error('Error details:', e);
      return [];
    }
  }

  async translateText(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    sourceLanguage?: string;
    model?: string;
  }): Promise<string> {
    let { model } = params;
    const { text, targetLanguage, context, sourceLanguage } = params;
    model = await this.ensureModel(model);

    const prompt = getTranslatePrompt(
      text,
      targetLanguage,
      context,
      sourceLanguage,
    );

    this.logger.log(`Translating text with model: ${model}`);
    const response = await this.generate(model, prompt, false);

    if (typeof response === 'string') {
      return this.cleanResponse(response);
    } else if (response && 'response' in response) {
      // Should not happen as stream is false
      return this.cleanResponse(response.response);
    }
    return '';
  }

  async explainText(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    model?: string;
  }): Promise<string> {
    let { model } = params;
    const { text, targetLanguage, context } = params;
    model = await this.ensureModel(model);

    const prompt = getExplainPrompt(text, targetLanguage, context);

    this.logger.log(`Explaining text with model: ${model}`);
    const response = await this.generate(model, prompt, false);

    if (typeof response === 'string') {
      return this.cleanResponse(response);
    } else if (response && 'response' in response) {
      return this.cleanResponse(response.response);
    }
    return '';
  }

  async getRichTranslation(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    sourceLanguage?: string;
    model?: string;
  }): Promise<RichTranslation> {
    let { model } = params;
    const { text, targetLanguage, context, sourceLanguage } = params;
    model = await this.ensureModel(model);

    const prompt = getRichTranslationPrompt(
      text,
      targetLanguage,
      context,
      sourceLanguage,
    );

    this.logger.log(`Getting rich translation with model: ${model}`);

    try {
      const response = await this.ollama.generate({
        model,
        prompt,
        stream: false,
        // rich translation prompt asks for JSON, but strict format might be safer without 'json' mode if the prompt is strong,
        // but let's try 'json' mode if the model supports it well.
        // However, previous implementation didn't strictly force it via API but via prompt.
        // Let's stick to prompt + cleanup for max compatibility unless we want to enforce schema.
        // But Ollama 'format: json' is good.
        format: 'json',
        options: { num_predict: 4096 },
      });

      return this.cleanAndParseJson(response.response);
    } catch (_e) {
      this.logger.error('Error in rich translation', _e);
      throw new HttpException(
        'Failed to generate rich translation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateContent(params: {
    topic?: string;
    sourceLanguage: string;
    isLearningMode: boolean;
    proficiencyLevel: string;
    contentType: ContentType;
    model?: string;
  }): Promise<string> {
    let { model } = params;
    const {
      topic,
      sourceLanguage,
      isLearningMode,
      proficiencyLevel,
      contentType,
    } = params;
    model = await this.ensureModel(model);

    const prompt = getStoryPrompt({
      sourceLang: sourceLanguage,
      isLearningMode,
      topic,
      proficiencyLevel,
      contentType,
    });

    this.logger.log(`Generating content (${contentType}) with model: ${model}`);
    const response = await this.generate(model, prompt, false);

    if (typeof response === 'string') {
      return this.cleanResponse(response);
    } else if (response && 'response' in response) {
      return this.cleanResponse(response.response);
    }
    return '';
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
    let { model } = params;
    const { topic, level, mode, sourceLanguage, targetLanguage, limit } =
      params;
    model = await this.ensureModel(model);

    const prompt = getGameContentPrompt(
      topic,
      level,
      mode,
      sourceLanguage,
      targetLanguage,
      limit,
    );

    this.logger.log(`Generating game content (${mode}) with model: ${model}`);
    const response = await this.generate(model, prompt, false);

    if (typeof response === 'string') {
      return this.cleanResponse(response);
    } else if (response && 'response' in response) {
      return this.cleanResponse(response.response);
    }
    return '';
  }

  private cleanAndParseJson<T>(text: string): T {
    // Try to find the largest outer JSON object or array
    const jsonMatch = text.match(/[\{\[][\s\S]*[\}\]]/);
    if (!jsonMatch) {
      // If no brace block found, check if it looks like start of JSON
      const trimmed = text.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const isArray = trimmed.startsWith('[');
        try {
          // Attempt to autocomplete truncated JSON
          return JSON.parse(trimmed + (isArray ? ']' : '}')) as T;
        } catch {
          try {
            return JSON.parse(trimmed + (isArray ? '}]' : ']}')) as T;
          } catch {
            // Ignore error
          }
        }
      }

      // Try parsing whole text
      try {
        return JSON.parse(text) as T;
      } catch {
        const snippet =
          text.length > 200 ? text.substring(0, 200) + '...' : text;
        throw new Error(`No JSON block found in response: "${snippet}"`);
      }
    }

    const jsonStr = jsonMatch[0];
    try {
      return JSON.parse(jsonStr) as T;
    } catch (error) {
      // Fallback: Replace all newlines with spaces to handle "Bad control character"
      try {
        const sanitized = jsonStr.replace(/\n/g, ' ');
        return JSON.parse(sanitized) as T;
      } catch {
        // One last try: if it looks truncated, try appending brace
        try {
          return JSON.parse(jsonStr + '}') as T;
        } catch {
          throw error;
        }
      }
    }
  }

  async analyzeGrammar(params: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    model?: string;
  }): Promise<GrammarAnalysisResponse> {
    const { text, sourceLanguage, targetLanguage } = params;
    let { model } = params;

    model = await this.ensureModel(model);

    const prompt = GRAMMAR_ANALYSIS_PROMPT(
      text,
      sourceLanguage,
      targetLanguage,
    );

    try {
      this.logger.log(`Analyzing grammar for: ${text} `);
      const response = await this.ollama.generate({
        model,
        prompt,
        stream: false,
        format: 'json',
        options: {
          num_ctx: 4096, // Increase context window
          num_predict: 2048, // Allow for longer responses (grammar analysis is verbose)
        },
      });

      const result = this.cleanAndParseJson<GrammarAnalysisResponse>(
        response.response,
      );

      // Post-processing: Strict Punctuation Filter
      if (result && Array.isArray(result.grammar)) {
        result.grammar = result.grammar.filter((item) => {
          const word = item.word;
          // Keep item only if it contains at least one letter or number (Unicode aware)
          // This removes items like ".", "?", "-", "!", etc.
          return word && /[\p{L}\p{N}]/u.test(word);
        });
      }

      return result;
    } catch (error: unknown) {
      this.logger.error('Error analyzing grammar', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('connect')
      ) {
        throw new HttpException(
          'Could not connect to Ollama. Is it running?',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        `Grammar analysis failed: ${errorMessage} `,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Helper to ensure model is selected or default picked
  private async ensureModel(model?: string): Promise<string> {
    if (model) return model;

    try {
      const tags = await this.ollama.list();
      if (tags.models && tags.models.length > 0) {
        const m = tags.models[0].name;
        // this.logger.log(`Using first available model: ${m}`);
        return m;
      } else {
        this.logger.warn('Ollama reachable but no models returned by list().');
        throw new Error('No Ollama models available');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Failed to ensure/list Ollama models. Host: ${this.ollamaHost}. Error: ${msg}`);
      throw new Error(`Ollama is not available: ${msg}`);
    }
  }

  private cleanResponse(text: string): string {
    // It removes any thought bubbles <think>...</think> if present (common in some thinking models)
    // and generic filler "Here is the translation:" etc if logic wasn't perfect
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // Remove quotes if the WHOLE response is quoted
    if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length > 2) {
      cleaned = cleaned.slice(1, -1);
    }
    if (cleaned.startsWith("'") && cleaned.endsWith("'") && cleaned.length > 2) {
      cleaned = cleaned.slice(1, -1);
    }

    // Remove common prefixes
    const prefixes = [
      'Translation:', 'The translation is:', 'Here is the translation:', 'Result:', 'Answer:'
    ];
    for (const prefix of prefixes) {
      if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
        cleaned = cleaned.slice(prefix.length).trim();
      }
    }

    return cleaned;
  }
}
