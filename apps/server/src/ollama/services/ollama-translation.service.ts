import { Injectable, Logger } from '@nestjs/common';
import { OllamaClientService } from './ollama-client.service';
import {
  getTranslatePrompt,
  getExplainPrompt,
  getRichTranslationPrompt,
  getSingleTensePrompt,
} from '../prompts';
import { cleanResponse, cleanAndParseJson } from '../utils/ollama-utils';
import { RichTranslation } from '../interfaces/ollama.interfaces';

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
 * Tense names to request per source language for the conjugation refill flow.
 * Keys are lowercase language names (matched case-insensitively).
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

    if (this.needsConjugationRefill(rich)) {
      await this.refillConjugations(rich, model, params.sourceLanguage);
    }

    return rich as unknown as RichTranslation;
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
      { num_predict: 1024, temperature: 0 },
    );
    return cleanAndParseJson<RichObj>(response);
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

  /** A verb needs a refill when the primary call returned fewer than 2 tenses. */
  private needsConjugationRefill(rich: RichObj): boolean {
    if (rich.isVerb !== true) return false;
    const conj = rich.conjugations;
    if (!conj || typeof conj !== 'object') return true;
    return Object.keys(conj).length < 2;
  }

  /**
   * Fetch each core tense in parallel with its own focused prompt. A small
   * model that drops 3-of-4 tenses in a one-shot table reliably completes a
   * single-tense request. Successful tenses overwrite/extend whatever the
   * primary call returned; failures are silently dropped.
   */
  private async refillConjugations(
    rich: RichObj,
    model: string,
    sourceLanguage?: string,
  ): Promise<void> {
    const verb = (rich.grammar?.infinitive || rich.segment || '').trim();
    if (!verb || !sourceLanguage) return;

    const tenses = CORE_TENSES[sourceLanguage.toLowerCase()];
    if (!tenses?.length) return;

    const results = await Promise.all(
      tenses.map((tense) =>
        this.fetchTenseRows(verb, sourceLanguage, tense, model),
      ),
    );

    const filled: Record<string, unknown[]> = {};
    tenses.forEach((tense, i) => {
      const rows = results[i];
      if (rows) filled[tense] = rows;
    });

    if (Object.keys(filled).length === 0) return;
    rich.conjugations = { ...(rich.conjugations ?? {}), ...filled };
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
