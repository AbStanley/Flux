import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { OllamaClientService } from './ollama-client.service';
import { GRAMMAR_ANALYSIS_PROMPT } from './ollama.prompts';
import { cleanAndParseJson } from './ollama-utils';
import { GrammarAnalysisResponse } from './interfaces';

@Injectable()
export class OllamaGrammarService {
  private readonly logger = new Logger(OllamaGrammarService.name);

  constructor(private readonly ollamaClient: OllamaClientService) {}

  async analyzeGrammar(params: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    model?: string;
  }): Promise<GrammarAnalysisResponse> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const prompt = GRAMMAR_ANALYSIS_PROMPT(
      params.text,
      params.sourceLanguage,
      params.targetLanguage,
    );

    try {
      this.logger.log(`Analyzing grammar for: ${params.text}`);
      const response = await this.ollamaClient.generate(
        model,
        prompt,
        false,
        'json',
        {
          num_ctx: 4096,
          num_predict: 2048,
        },
      );

      const result = cleanAndParseJson<GrammarAnalysisResponse>(
        response.response,
      );

      if (result && Array.isArray(result.grammar)) {
        result.grammar = result.grammar.filter((item) => {
          const word = item.word;
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
        `Grammar analysis failed: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
