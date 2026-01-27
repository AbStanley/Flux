import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Ollama } from 'ollama';
import { GRAMMAR_ANALYSIS_PROMPT } from './ollama.prompts';

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

    // If no model specified, try to get first available
    if (!model) {
      try {
        const tags = await this.ollama.list();
        if (tags.models && tags.models.length > 0) {
          model = tags.models[0].name;
          this.logger.log(`Using first available model: ${model}`);
        } else {
          throw new Error(
            'No Ollama models available. Please pull a model first (e.g., ollama pull llama3.2)',
          );
        }
      } catch (error) {
        this.logger.error(
          'Failed to list Ollama models - is Ollama running?',
          error,
        );
        throw new Error(
          'Ollama is not available. Please make sure Ollama is running.',
        );
      }
    }

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
          const examples = JSON.parse(text);
          return Array.isArray(examples) ? examples.slice(0, count) : [];
        } catch {
          this.logger.warn('Could not parse JSON from LLM response:', text);
          return [];
        }
      }

      const examples = JSON.parse(jsonMatch[0]);
      return examples.slice(0, count);
    } catch (error) {
      this.logger.error('Error generating examples', error);
      throw error;
    }
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
        } catch (e) { }

        try {
          return JSON.parse(text + ']}');
        } catch (e) { }
      }

      // Try parsing whole text
      try {
        return JSON.parse(text);
      } catch (e) {
        const snippet = text.length > 200 ? text.substring(0, 200) + '...' : text;
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
      } catch (e2) {
        // One last try: if it looks truncated, try appending brace
        try {
          return JSON.parse(jsonStr + '}');
        } catch (e3) {
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

    if (!model) {
      try {
        const tags = await this.ollama.list();
        if (tags.models && tags.models.length > 0) {
          model = tags.models[0].name;
        } else {
          throw new Error('No Ollama models available');
        }
      } catch (error) {
        throw new Error('Ollama is not available');
      }
    }

    const prompt = GRAMMAR_ANALYSIS_PROMPT(text, sourceLanguage, targetLanguage);



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

      const result = this.cleanAndParseJson(response.response);

      // Post-processing: Strict Punctuation Filter
      if (result && Array.isArray(result.grammar)) {
        result.grammar = result.grammar.filter((item: any) => {
          const word = item.word;
          // Keep item only if it contains at least one letter or number (Unicode aware)
          // This removes items like ".", "?", "-", "!", etc.
          return word && /[\p{L}\p{N}]/u.test(word);
        });
      }

      return result;

    } catch (error: any) {
      this.logger.error('Error analyzing grammar', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check for model not found (404) or "not found" in message
      if (error.status_code === 404 || errorMessage.includes('not found')) {
        this.logger.warn(`Model '${model}' not found, attempting fallback to first available model.`);
        try {
          const tags = await this.ollama.list();
          if (tags.models && tags.models.length > 0) {
            const fallbackModel = tags.models[0].name;
            this.logger.log(`Fallback: Retrying analysis with model '${fallbackModel}'`);

            const response = await this.ollama.generate({
              model: fallbackModel,
              prompt,
              stream: false,
              format: 'json',
              options: {
                num_ctx: 4096,
                num_predict: 2048,
              },
            });

            const result = this.cleanAndParseJson(response.response);
            if (result && Array.isArray(result.grammar)) {
              result.grammar = result.grammar.filter((item: any) => {
                const word = item.word;
                return word && /[\p{L}\p{N}]/u.test(word);
              });
            }
            return result;
          }
        } catch (fallbackError) {
          this.logger.error('Fallback attempt failed', fallbackError);
        }
      }

      if (errorMessage.includes('fetch failed') || errorMessage.includes('connect')) {
        throw new HttpException('Could not connect to Ollama. Is it running?', HttpStatus.SERVICE_UNAVAILABLE);
      }

      throw new HttpException(`Grammar analysis failed: ${errorMessage} `, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
