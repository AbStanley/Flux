import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { OllamaClientService } from './ollama-client.service';
import { WRITING_ANALYSIS_PROMPT } from '../prompts';
import { WritingAnalysisResponse, WritingCorrection } from '../interfaces/ollama.interfaces';

interface ParsedWriting {
  cleanText: string;
  corrections: WritingCorrection[];
}

function stripQuotes(s: string): string {
  return s.replace(/^[""\u201C\u201D'"]+|[""\u201C\u201D'"]+$/g, '').trim();
}

function parseMarkerText(markerText: string, originalText: string): ParsedWriting {
  const corrections: WritingCorrection[] = [];
  let cleanText = '';

  // Flexible regex: matches [fix: "wrong" → "correct" | ...anything... ]
  // Handles: smart quotes, no quotes, →/->/->/-->, type: with slashes, missing type:
  const regex = /\[fix:\s*[""\u201C]?(.+?)[""\u201D]?\s*(?:→|->|-->)\s*[""\u201C]?(.+?)[""\u201D]?\s*(?:\|\s*(?:type:\s*)?([\w/]+))?\s*(?:\|\s*(.+?))?\s*\]/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(markerText)) !== null) {
    cleanText += markerText.slice(lastIndex, match.index);

    const wrong = stripQuotes(match[1]);
    const correct = stripQuotes(match[2]);
    const type = (match[3] || 'Grammar').split('/')[0];
    const explanation = stripQuotes(match[4] || '');

    const offset = cleanText.length;
    cleanText += correct;

    corrections.push({
      type,
      shortDescription: type.toUpperCase(),
      longDescription: explanation,
      mistakeText: wrong,
      correctionText: correct,
      startIndex: offset,
      endIndex: offset + correct.length,
      offset,
      length: correct.length,
    });

    lastIndex = match.index + match[0].length;
  }

  cleanText += markerText.slice(lastIndex);

  // Second pass: strip any remaining [fix: ...] markers the regex missed
  cleanText = cleanText.replace(/\[fix:\s*[^\]]*\]/g, '');

  if (corrections.length === 0) {
    return { cleanText: originalText, corrections: [] };
  }

  return { cleanText: cleanText.trim(), corrections };
}

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
        undefined,
        {
          num_ctx: 8192,
          num_predict: 4096,
        },
      );

      const rawText = response.response.trim();
      const { cleanText, corrections } = parseMarkerText(rawText, params.text);

      return { text: cleanText, corrections };
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
