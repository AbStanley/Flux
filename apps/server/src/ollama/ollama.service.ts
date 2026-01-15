import { Injectable, Logger } from '@nestjs/common';
import { Ollama } from 'ollama';

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
      });

      // Parse JSON from response
      const text = response.response.trim();
      // Extract JSON array from response (handle potential markdown wrapping)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        this.logger.warn('Could not parse JSON from LLM response:', text);
        return [];
      }

      const examples = JSON.parse(jsonMatch[0]);
      return examples.slice(0, count);
    } catch (error) {
      this.logger.error('Error generating examples', error);
      throw error;
    }
  }
}
