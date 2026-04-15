import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { OllamaClientService } from './ollama-client.service';
import { WRITING_ANALYSIS_PROMPT } from '../prompts';
import { WritingAnalysisResponse, WritingCorrection } from '../interfaces/ollama.interfaces';

interface RawCorrection {
  mistake: string;
  correction: string;
  type?: string;
  explanation?: string;
}

function extractJsonArray(raw: string): RawCorrection[] {
  // Try direct parse first
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* continue */ }

  // Extract the first [...] block from the response
  const start = trimmed.indexOf('[');
  const end = trimmed.lastIndexOf(']');
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(trimmed.slice(start, end + 1));
      if (Array.isArray(parsed)) return parsed;
    } catch { /* continue */ }
  }

  return [];
}

function buildCorrections(originalText: string, raw: RawCorrection[]): WritingCorrection[] {
  const corrections: WritingCorrection[] = [];
  let searchFrom = 0;

  // Sort by order of appearance in the original text
  const withOffsets = raw
    .filter(r => r.mistake && r.correction && r.mistake !== r.correction)
    .map(r => {
      const idx = originalText.indexOf(r.mistake, searchFrom);
      if (idx === -1) return null;
      searchFrom = idx + r.mistake.length;
      return { ...r, offset: idx };
    })
    .filter((r): r is RawCorrection & { offset: number } => r !== null)
    .sort((a, b) => a.offset - b.offset);

  // Remove overlapping corrections
  let lastEnd = 0;
  for (const r of withOffsets) {
    if (r.offset < lastEnd) continue;

    const type = r.type || 'Grammar';
    corrections.push({
      type,
      shortDescription: type.toUpperCase(),
      longDescription: r.explanation || '',
      mistakeText: r.mistake,
      correctionText: r.correction,
      offset: r.offset,
      length: r.mistake.length,
    });
    lastEnd = r.offset + r.mistake.length;
  }

  return corrections;
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
      const rawCorrections = extractJsonArray(rawText);
      const corrections = buildCorrections(params.text, rawCorrections);

      return { text: params.text, corrections };
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
