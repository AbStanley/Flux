import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Ollama } from 'ollama';
import {
  GRAMMAR_ANALYSIS_PROMPT,
  getTranslatePrompt,
  getRichTranslationPrompt,
  getExplainPrompt,
  getStoryPrompt,
  getGameContentPrompt,
  ContentType,
} from './ollama.prompts';

@Injectable()
export class OllamaService {
  private ollama: Ollama;
  private readonly logger = new Logger(OllamaService.name);

  constructor() {
    const host = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    this.ollama = new Ollama({ host });
    this.logger.log(`Ollama Service initialized with host: ${host}`);
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
  }): Promise<{ sentence: string; translation: string }[]> {
    const {
      word,
      definition,
      sourceLanguage,
      targetLanguage,
      count = 3,
    } = params;
    let { model } = params;

    model = await this.ensureModel(model);

    const prompt = `Generate ${count} example sentences using the word "${word}"${definition ? ` (meaning: ${definition})` : ''}.
The sentences should be in ${sourceLanguage} with translations in ${targetLanguage}.
Format your response as a JSON array with objects containing "sentence" and "translation" fields.
Only output the JSON array, nothing else.

Example format:
[{"sentence": "Example in ${sourceLanguage}", "translation": "Translation in ${targetLanguage}"}]`;

    try {
      this.logger.log(
        `Generating ${count} examples for word: ${word} using model: ${model}`,
      );
      const response = await this.ollama.generate({
        model,
        prompt,
        stream: false,
        format: 'json',
      });

      // Parse JSON from response
      const text = response.response.trim();
      // Extract JSON array from response (handle potential markdown wrapping)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        // Fallback just in case regex fails but response is valid json
        try {
          const examples = JSON.parse(text) as unknown[];
          return Array.isArray(examples)
            ? (examples.slice(0, count) as {
                sentence: string;
                translation: string;
              }[])
            : [];
        } catch {
          this.logger.warn('Could not parse JSON from LLM response:', text);
          return [];
        }
      }

      const examples = JSON.parse(jsonMatch[0]) as unknown[];
      return (Array.isArray(examples) ? examples.slice(0, count) : []) as {
        sentence: string;
        translation: string;
      }[];
    } catch (error) {
      this.logger.error('Error generating examples', error);
      throw error;
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
  }): Promise<any> {
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

  private cleanAndParseJson(text: string): any {
    // Try to find the largest outer JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // If no brace block found, check if it looks like start of JSON
      if (text.trim().startsWith('{')) {
        try {
          // Attempt to autocomplete truncated JSON (naive)
          // This often helps if just the last brace is missing
          return JSON.parse(text + '}');
        } catch {
          // Ignore error
        }

        try {
          return JSON.parse(text + ']}');
        } catch {
          // Ignore error
        }
      }

      // Try parsing whole text
      try {
        return JSON.parse(text);
      } catch {
        const snippet =
          text.length > 200 ? text.substring(0, 200) + '...' : text;
        throw new Error(`No JSON block found in response: "${snippet}"`);
      }
    }

    const jsonStr = jsonMatch[0];
    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      // Fallback: Replace all newlines with spaces to handle "Bad control character"
      try {
        const sanitized = jsonStr.replace(/\n/g, ' ');
        return JSON.parse(sanitized);
      } catch {
        // One last try: if it looks truncated, try appending brace
        try {
          return JSON.parse(jsonStr + '}');
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
  }): Promise<any> {
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

      const result = this.cleanAndParseJson(response.response) as {
        grammar?: { word: string }[];
      };

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
        throw new Error('No Ollama models available');
      }
    } catch {
      throw new Error('Ollama is not available');
    }
  }

  private cleanResponse(text: string): string {
    // It removes any thought bubbles <think>...</think> if present (common in some thinking models)
    // and generic filler "Here is the translation:" etc if logic wasn't perfect
    return text.trim();
  }
}
