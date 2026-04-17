import { Injectable, Logger } from '@nestjs/common';
import { OllamaClientService } from './ollama-client.service';
import {
  getTranslatePrompt,
  getExplainPrompt,
  getRichTranslationPrompt,
} from '../prompts';
import { cleanResponse, cleanAndParseJson } from '../utils/ollama-utils';
import { RichTranslation } from '../interfaces/ollama.interfaces';

@Injectable()
export class OllamaTranslationService {
  private readonly logger = new Logger(OllamaTranslationService.name);

  constructor(private readonly ollamaClient: OllamaClientService) {}

  async translateText(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    sourceLanguage?: string;
    model?: string;
  }): Promise<{ response: string; sourceLanguage?: string }> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const prompt = getTranslatePrompt(
      params.text,
      params.targetLanguage,
      params.context,
      params.sourceLanguage,
    );

    const isAuto = !params.sourceLanguage || params.sourceLanguage === 'Auto';
    const response = await this.ollamaClient.generate(model, prompt, false);

    if (isAuto) {
      try {
        const parsed = cleanAndParseJson<{
          detectedLanguage: string;
          translation: string;
        }>(response.response);
        return {
          response: parsed.translation,
          sourceLanguage: parsed.detectedLanguage,
        };
      } catch (e) {
        this.logger.error('Failed to parse auto-translation JSON:', e);
        // Fallback to simple cleaning if JSON parse fails
        return { response: cleanResponse(response.response) };
      }
    }

    return { response: cleanResponse(response.response) };
  }

  async explainText(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    model?: string;
  }): Promise<string> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const prompt = getExplainPrompt(
      params.text,
      params.targetLanguage,
      params.context,
    );

    const response = await this.ollamaClient.generate(model, prompt, false);
    return cleanResponse(response.response);
  }

  async getRichTranslation(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    sourceLanguage?: string;
    model?: string;
  }): Promise<RichTranslation> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const prompt = getRichTranslationPrompt(
      params.text,
      params.targetLanguage,
      params.context,
      params.sourceLanguage,
    );

    const response = await this.ollamaClient.generate(
      model,
      prompt,
      false,
      undefined,
      { num_predict: 4096 },
    );

    this.logger.log(
      `[RichTranslation] Raw Response (Length ${response.response.length}):\n${response.response.substring(0, 200)}...`,
    );

    const result = cleanAndParseJson<RichTranslation>(response.response);

    // Guard: if input is a single word but LLM returned a full sentence as translation,
    // truncate to just the first clause/phrase to avoid displaying a whole paragraph.
    const isSingleWord = !params.text.trim().includes(' ');
    const obj = result as unknown as Record<string, unknown>;
    if (
      isSingleWord &&
      typeof obj.translation === 'string' &&
      obj.translation.split(' ').length > 6
    ) {
      const short = obj.translation.split(/[,.\n]/)[0].trim();
      if (short) obj.translation = short;
    }

    this.applyVerbDiscriminator(result, params.text);

    return result;
  }

  /**
   * The prompt asks the LLM to set "isVerb" first and let it drive everything
   * verb-related. We trust that single boolean as the source of truth:
   *   - isVerb=false → strip "conjugations" and the verb-only grammar fields,
   *     no matter what the model wrote there.
   *   - isVerb=true  → keep "conjugations" only if it actually inflects the
   *     source word (stem invariant). A real paradigm shares the infinitive's
   *     stem; if it doesn't, the model conjugated the wrong language.
   */
  private applyVerbDiscriminator(
    result: RichTranslation,
    lookupText: string,
  ): void {
    const obj = result as unknown as Record<string, unknown>;
    const grammar = obj.grammar as Record<string, unknown> | undefined;

    if (obj.isVerb !== true) {
      delete obj.conjugations;
      if (grammar) {
        delete grammar.infinitive;
        delete grammar.tense;
      }
      return;
    }

    const conjugations = obj.conjugations as
      | Record<string, Array<{ conjugation?: unknown }>>
      | undefined;
    if (!conjugations || typeof conjugations !== 'object') return;

    const allForms: string[] = [];
    for (const tense of Object.values(conjugations)) {
      if (!Array.isArray(tense)) continue;
      for (const row of tense) {
        if (typeof row?.conjugation === 'string' && row.conjugation.trim()) {
          allForms.push(row.conjugation.trim().toLowerCase());
        }
      }
    }
    if (allForms.length === 0) {
      delete obj.conjugations;
      return;
    }

    const infinitive =
      typeof grammar?.infinitive === 'string' ? grammar.infinitive : '';
    const stemSource = (infinitive || lookupText || '')
      .toLowerCase()
      .replace(/[^\p{L}]/gu, '');
    if (stemSource.length < 3) return;

    // Try every 3-letter window of the infinitive as a candidate stem, not
    // just the prefix. This survives separable verbs where the prefix moves
    // ("anbauen" → "baue an") and irregular verbs where the prefix changes.
    // If any window appears in at least half of the forms, the paradigm is
    // legitimately inflecting the source word.
    const windows = new Set<string>();
    for (let i = 0; i <= stemSource.length - 3; i++) {
      windows.add(stemSource.slice(i, i + 3));
    }
    const threshold = allForms.length / 2;
    const sharesStem = [...windows].some(
      (stem) => allForms.filter((f) => f.includes(stem)).length >= threshold,
    );
    if (!sharesStem) {
      delete obj.conjugations;
    }
  }
}
