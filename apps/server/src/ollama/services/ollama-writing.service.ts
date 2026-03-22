import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { OllamaClientService } from './ollama-client.service';
import { WRITING_ANALYSIS_PROMPT } from '../prompts';
import { cleanAndParseJson } from '../utils/ollama-utils';
import { WritingAnalysisResponse } from '../interfaces/ollama.interfaces';

@Injectable()
export class OllamaWritingService {
  private readonly logger = new Logger(OllamaWritingService.name);

  constructor(private readonly ollamaClient: OllamaClientService) {}

  async analyzeWriting(params: {
    text: string;
    sourceLanguage: string;
    model?: string;
  }): Promise<WritingAnalysisResponse> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const prompt = WRITING_ANALYSIS_PROMPT(params.text, params.sourceLanguage);

    try {
      this.logger.log(
        `Analyzing writing for: ${params.text.substring(0, 50)}...`,
      );
      const response = await this.ollamaClient.generate(
        model,
        prompt,
        false,
        'json',
        {
          num_ctx: 8192,
          num_predict: 4096,
        },
      );

      const rawResult = cleanAndParseJson<any>(
        response.response,
      );

      const result: WritingAnalysisResponse = {
        text: Array.isArray(rawResult?.text) 
          ? rawResult.text.join('\n') 
          : (rawResult?.text || ''),
        corrections: rawResult?.corrections || [],
      };

      return result;
    } catch (error: unknown) {
      this.logger.error('Error analyzing writing', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      throw new HttpException(
        `Writing analysis failed: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
