import { Injectable, Logger } from '@nestjs/common';
import type { GenerateResponse } from 'ollama';
import { OllamaClientService } from './ollama-client.service';
import {
  getTranslatePrompt,
  getExplainPrompt,
  getRichTranslationPrompt,
  getSingleTensePrompt,
} from '../prompts';
import { cleanResponse, cleanAndParseJson } from '../utils/ollama-utils';
import {
  RichTranslation,
  RichConjugations,
} from '../interfaces/ollama.interfaces';

type RichObj = Record<string, unknown> & {
  isVerb?: boolean;
  segment?: string;
  translation?: string;
  grammar?: Record<string, unknown> & {
    infinitive?: string;
    tense?: string;
  };
  conjugations?: Record<string, unknown>;
  examples?: unknown;
};

/**
 * Rough script detection used to spot example pairs that collapsed to the
 * same language. Returns 'latin' for ambiguous Latin-alphabet text — those
 * pairs can't be reliably distinguished without a real language detector.
 */
function detectScript(text: string): string {
  if (/[\u0400-\u04FF]/.test(text)) return 'cyrillic';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'cjk';
  if (/[\u3040-\u30FF]/.test(text)) return 'japanese';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'korean';
  if (/[\u0600-\u06FF]/.test(text)) return 'arabic';
  if (/[\u0370-\u03FF]/.test(text)) return 'greek';
  if (/[\u0590-\u05FF]/.test(text)) return 'hebrew';
  if (/[\u0E00-\u0E7F]/.test(text)) return 'thai';
  if (/[\u0900-\u097F]/.test(text)) return 'devanagari';
  if (/[a-zA-Z]/.test(text)) return 'latin';
  return 'unknown';
}

/**
 * Tense names to request per source language for the on-demand conjugations
 * fetch. Keys are lowercase language names (matched case-insensitively).
 */
const CORE_TENSES: Readonly<Record<string, readonly string[]>> = {
  english: ['Present', 'Past', 'Future', 'Present Perfect'],
  spanish: ['Presente', 'Pretérito', 'Imperfecto', 'Futuro'],
  italian: ['Presente', 'Passato prossimo', 'Imperfetto', 'Futuro'],
  portuguese: ['Presente', 'Pretérito perfeito', 'Imperfeito', 'Futuro'],
  french: ['Présent', 'Passé composé', 'Imparfait', 'Futur'],
  german: ['Präsens', 'Präteritum', 'Perfekt', 'Futur'],
  russian: ['Настоящее', 'Прошедшее', 'Будущее'],
};

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

    const { response } = await this.ollamaClient.generate(
      model,
      prompt,
      false,
      isAuto ? 'json' : undefined,
      { num_predict: 256, temperature: 0 },
    );

    if (!isAuto) return { response: cleanResponse(response) };

    try {
      const parsed = cleanAndParseJson<{
        detectedLanguage: string;
        translation: string;
      }>(response);
      return {
        response: parsed.translation,
        sourceLanguage: parsed.detectedLanguage,
      };
    } catch (e) {
      this.logger.error('Failed to parse auto-translation JSON:', e);
      return { response: cleanResponse(response) };
    }
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
    const { response } = await this.ollamaClient.generate(model, prompt, false);
    return cleanResponse(response);
  }

  async getRichTranslation(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    sourceLanguage?: string;
    model?: string;
  }): Promise<RichTranslation> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const rich = await this.fetchRichTranslation(params, model);

    this.trimRunawayTranslation(rich, params.text);
    this.enforceVerbShape(rich);
    this.dropSameLanguageExamples(rich);

    return rich as unknown as RichTranslation;
  }

  /**
   * Streaming variant of getRichTranslation. Returns the raw Ollama chunk
   * stream — each chunk exposes a forward-prefix `response` string and a
   * `done` flag. The client best-effort-parses the cumulative response
   * and renders completed fields progressively so the popup feels alive
   * instead of waiting for the full object to close.
   */
  async getRichTranslationStream(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    sourceLanguage?: string;
    model?: string;
  }): Promise<AsyncIterable<GenerateResponse>> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const prompt = getRichTranslationPrompt(
      params.text,
      params.targetLanguage,
      params.context,
      params.sourceLanguage,
    );
    return this.ollamaClient.generate(model, prompt, true, 'json', {
      num_ctx: 2048,
      num_predict: 768,
      temperature: 0,
    });
  }

  /**
   * On-demand conjugation fetch triggered by the "Show conjugations"
   * button in the rich-details panel. Returns an empty object when the
   * source is unsupported or no infinitive was provided.
   */
  async getConjugations(params: {
    infinitive: string;
    sourceLanguage: string;
    model?: string;
  }): Promise<RichConjugations> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const verb = params.infinitive.trim();
    const tenses = CORE_TENSES[params.sourceLanguage.toLowerCase()];
    if (!verb || !tenses?.length) return { conjugations: {} };

    const results = await Promise.all(
      tenses.map((tense) =>
        this.fetchTenseRows(verb, params.sourceLanguage, tense, model),
      ),
    );

    const conjugations: RichConjugations['conjugations'] = {};
    tenses.forEach((tense, i) => {
      const rows = results[i];
      if (rows)
        conjugations[tense] = rows as Array<{
          pronoun: string;
          conjugation: string;
        }>;
    });

    return { conjugations };
  }

  /**
   * Streaming variant of getConjugations. Fires every core tense in
   * parallel and yields each one as its rows come back, so the client
   * can render the first tense table while later tenses are still
   * generating. Tenses that produced no valid rows are skipped silently.
   */
  async *getConjugationsStream(params: {
    infinitive: string;
    sourceLanguage: string;
    model?: string;
  }): AsyncGenerator<{
    tense: string;
    rows: Array<{ pronoun: string; conjugation: string }>;
  }> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const verb = params.infinitive.trim();
    const tenses = CORE_TENSES[params.sourceLanguage.toLowerCase()];
    if (!verb || !tenses?.length) return;

    // Fire all tense fetches eagerly, then emit as each resolves. Uses a
    // tiny signal/queue pattern so results come out in completion order
    // rather than tense-list order — matters when OLLAMA_NUM_PARALLEL>1.
    const queue: Array<{ tense: string; rows: unknown[] | null }> = [];
    let settled = 0;
    let notify: (() => void) | null = null;

    for (const tense of tenses) {
      this.fetchTenseRows(verb, params.sourceLanguage, tense, model)
        .then((rows) => {
          queue.push({ tense, rows });
        })
        .catch(() => {
          queue.push({ tense, rows: null });
        })
        .finally(() => {
          settled += 1;
          notify?.();
          notify = null;
        });
    }

    while (settled < tenses.length || queue.length > 0) {
      if (queue.length === 0) {
        await new Promise<void>((resolve) => {
          notify = resolve;
        });
      }
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item?.rows) continue;
        yield {
          tense: item.tense,
          rows: item.rows as Array<{ pronoun: string; conjugation: string }>,
        };
      }
    }
  }

  /**
   * Small models occasionally produce example pairs where both "sentence"
   * and "translation" are in the same language (typically the source).
   * Drop those pairs when the two fields share a detectable non-Latin script.
   * Latin-alphabet pairs (e.g., English/Spanish) can't be caught this way
   * without a real language detector — we rely on the prompt for those.
   */
  private dropSameLanguageExamples(rich: RichObj): void {
    const examples = rich.examples;
    if (!Array.isArray(examples)) return;
    const filtered = examples.filter((ex) => {
      if (!ex || typeof ex !== 'object') return false;
      const entry = ex as { sentence?: unknown; translation?: unknown };
      const sentence =
        typeof entry.sentence === 'string' ? entry.sentence.trim() : '';
      const translation =
        typeof entry.translation === 'string' ? entry.translation.trim() : '';
      if (!sentence || !translation) return false;
      const srcScript = detectScript(sentence);
      const tgtScript = detectScript(translation);
      if (
        srcScript !== 'latin' &&
        srcScript !== 'unknown' &&
        srcScript === tgtScript
      ) {
        this.logger.warn(
          `[RichTranslation] dropped same-script example (${srcScript}): "${sentence}" / "${translation}"`,
        );
        return false;
      }
      return true;
    });
    rich.examples = filtered;
  }

  private async fetchRichTranslation(
    params: {
      text: string;
      targetLanguage: string;
      context?: string;
      sourceLanguage?: string;
    },
    model: string,
  ): Promise<RichObj> {
    const prompt = getRichTranslationPrompt(
      params.text,
      params.targetLanguage,
      params.context,
      params.sourceLanguage,
    );
    const { response } = await this.ollamaClient.generate(
      model,
      prompt,
      false,
      'json',
      { num_ctx: 2048, num_predict: 768, temperature: 0 },
    );
    try {
      return cleanAndParseJson<RichObj>(response);
    } catch (e) {
      const preview =
        typeof response === 'string'
          ? response.slice(0, 500)
          : String(response);
      this.logger.error(
        `[RichTranslation] JSON parse failed. Raw (first 500 chars): ${preview}`,
      );
      throw e;
    }
  }

  /**
   * Single-word lookups occasionally come back with a full-sentence
   * translation. Keep only the first clause so the UI shows a headword.
   */
  private trimRunawayTranslation(rich: RichObj, input: string): void {
    const isSingleWord = !input.trim().includes(' ');
    const { translation } = rich;
    if (!isSingleWord || typeof translation !== 'string') return;
    if (translation.split(' ').length <= 6) return;
    const short = translation.split(/[,.\n]/)[0].trim();
    if (short) rich.translation = short;
  }

  /**
   * `isVerb` is the source of truth. For non-verbs, drop the verb-only
   * fields the prompt may still have emitted.
   */
  private enforceVerbShape(rich: RichObj): void {
    if (rich.isVerb === true) return;
    delete rich.conjugations;
    if (rich.grammar) {
      delete rich.grammar.infinitive;
      delete rich.grammar.tense;
    }
  }

  /** Returns the rows array for one tense, or null on failure / bad shape. */
  private async fetchTenseRows(
    verb: string,
    sourceLanguage: string,
    tense: string,
    model: string,
  ): Promise<unknown[] | null> {
    try {
      const { response } = await this.ollamaClient.generate(
        model,
        getSingleTensePrompt(verb, sourceLanguage, tense),
        false,
        'json',
        { num_predict: 256, temperature: 0 },
      );
      const parsed = cleanAndParseJson<{ rows?: unknown }>(response);
      const rows = parsed?.rows;
      return Array.isArray(rows) && rows.length > 0 ? rows : null;
    } catch (e) {
      this.logger.warn(
        `[RichTranslation] tense "${tense}" fetch failed: ${String(e)}`,
      );
      return null;
    }
  }
}
