import { Injectable, Logger } from '@nestjs/common';
import type { GenerateResponse } from 'ollama';
import { OllamaClientService } from './ollama-client.service';
import {
  getTranslatePrompt,
  getExplainPrompt,
  getSingleTensePrompt,
  getRawTranslatePrompt,
} from '../prompts';
import { getRichTranslationPrompt } from '../prompts/rich-translation.prompts';
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
  ukrainian: ['Теперішній', 'Минулий', 'Майбутній'],
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
    signal?: AbortSignal;
    traceId?: string;
  }): Promise<{ response: string; sourceLanguage?: string }> {
    this.logger.debug(
      `[INCOMING PAYLOAD]\n${JSON.stringify({ ...params, signal: undefined }, null, 2)}`,
    );
    const isAuto = !params.sourceLanguage || params.sourceLanguage === 'Auto';
    const isBlock = params.text.length > 100 || params.text.includes('\n');
    const isSingleWord = !/\s/.test(params.text.trim());
    const isShortText =
      params.text.length <= 120 && !params.text.includes('\n');
    const model = await this.ollamaClient.ensureModel(params.model);

    // If the language is already known and the text is short, bypass JSON mode to optimize latency.
    if (isShortText && !isAuto) {
      const prompt = getRawTranslatePrompt(
        params.text,
        params.targetLanguage,
        params.context,
        params.sourceLanguage,
      );
      this.logger.debug(`[RAW TRANSLATE PROMPT]\n${prompt}`);
      const generateResult = await this.ollamaClient.generate(
        model,
        prompt,
        false,
        undefined, // bypass JSON constrained decoding
        {
          num_predict: isSingleWord ? 16 : 128, // limit tokens generated depending on single word vs phrase
          num_ctx: isSingleWord ? 512 : 1024, // small context window to speed up prefill
          temperature: 0,
        },
        params.signal,
        params.traceId,
      );
      const response = generateResult.response;
      this.logger.debug(`[RAW TRANSLATE RESPONSE]\n${response}`);
      const cleaned = cleanResponse(response, { multiline: false });
      return {
        response: this.trimContextBleed(cleaned, params.text),
        sourceLanguage: params.sourceLanguage,
      };
    }

    // Fallback to original JSON mode (or raw block mode) when language is Auto or is a block
    const prompt = getTranslatePrompt(
      params.text,
      params.targetLanguage,
      params.context, // Pass context exactly as it is, punctuation is critical for the LLM
      params.sourceLanguage,
    );
    this.logger.debug(`[TRANSLATE PROMPT]\n${prompt}`);
    const generateResult = await this.ollamaClient.generate(
      model,
      prompt,
      false,
      isBlock
        ? undefined
        : {
            type: 'object',
            properties: {
              detectedLanguage: { type: 'string' },
              translation: { type: 'string' },
            },
            required: ['detectedLanguage', 'translation'],
          },
      {
        num_predict: isBlock ? 2048 : 64,
        temperature: 0,
      },
      params.signal,
      params.traceId,
    );
    const response = generateResult.response;
    this.logger.debug(`[TRANSLATE RESPONSE]\n${response}`);

    if (isBlock) {
      const cleaned = cleanResponse(response, { multiline: true });
      return { response: this.trimContextBleed(cleaned, params.text) };
    }

    try {
      const parsed = cleanAndParseJson<{
        translation: string;
        detectedLanguage?: string;
      }>(response);
      return {
        response: this.trimContextBleed(parsed.translation, params.text),
        sourceLanguage: parsed.detectedLanguage,
      };
    } catch (e) {
      this.logger.error('Failed to parse single-word translation JSON:', e);
      const cleaned = cleanResponse(response, { multiline: false });
      return { response: this.trimContextBleed(cleaned, params.text) };
    }
  }

  /**
   * Aggressively strip common context-bleed prefixes (like "Something " or "Algo ")
   * when the input was a single word but the model included surrounding context.
   */
  private trimContextBleed(translation: string, original: string): string {
    const isSingleWord = !original.trim().includes(' ');
    if (!isSingleWord || !translation) return translation;

    let cleaned = translation;

    // Strip leading inverted punctuation (¿, ¡) if the original didn't have it
    if (
      (cleaned.startsWith('¿') || cleaned.startsWith('¡')) &&
      !(original.startsWith('¿') || original.startsWith('¡'))
    ) {
      cleaned = cleaned.slice(1).trim();
    }

    // Strip trailing punctuation if the original didn't have it
    const lastCleanedChar = cleaned.slice(-1);
    const lastOriginalChar = original.trim().slice(-1);
    if (
      ['.', ',', '?', '!', ';', ':'].includes(lastCleanedChar) &&
      lastOriginalChar !== lastCleanedChar
    ) {
      cleaned = cleaned.slice(0, -1).trim();
    }

    // Restore capitalized first letter if original was capitalized
    if (original[0] === original[0].toUpperCase() && cleaned[0]) {
      cleaned = cleaned[0].toUpperCase() + cleaned.slice(1);
    }

    return cleaned;
  }

  async explainText(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    model?: string;
    signal?: AbortSignal;
    traceId?: string;
  }): Promise<string> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const prompt = getExplainPrompt(
      params.text,
      params.targetLanguage,
      params.context,
    );
    const { response } = await this.ollamaClient.generate(
      model,
      prompt,
      false,
      undefined,
      undefined,
      params.signal,
      params.traceId,
    );
    return cleanResponse(response);
  }

  async getRichTranslation(params: {
    text: string;
    targetLanguage: string;
    context?: string;
    sourceLanguage?: string;
    model?: string;
    signal?: AbortSignal;
    traceId?: string;
    regenerate?: boolean;
    preferredTranslation?: string;
  }): Promise<RichTranslation> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const rich = await this.fetchRichTranslation(
      {
        ...params,
        context: params.context,
      },
      model,
      params.traceId,
    );

    this.trimRunawayTranslation(rich, params.text);
    this.enforceVerbShape(rich);
    this.stripPronounPrefix(rich, params.text);

    const sourceLanguage =
      params.sourceLanguage && params.sourceLanguage !== 'Auto'
        ? params.sourceLanguage
        : 'English';
    await this.dropSameLanguageExamples(
      rich,
      sourceLanguage,
      params.targetLanguage,
      model,
    );

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
    signal?: AbortSignal;
    traceId?: string;
    regenerate?: boolean;
    preferredTranslation?: string;
  }): Promise<AsyncIterable<GenerateResponse>> {
    const model = await this.ollamaClient.ensureModel(params.model);
    // Generate prompt with preferred target alignment hint
    const prompt = getRichTranslationPrompt(
      params.text,
      params.targetLanguage,
      params.context,
      params.sourceLanguage,
      params.preferredTranslation,
    );
    this.logger.debug(`[RICH TRANSLATION PROMPT]\n${prompt}`);

    const stream = await this.ollamaClient.generate(
      model,
      prompt,
      true,
      'json',
      {
        num_ctx: 2048,
        num_predict: 768,
        temperature: params.regenerate ? 0.3 : 0,
      },
      params.signal,
      params.traceId,
    );

    const logger = this.logger;
    return (async function* () {
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk.response;
        yield chunk;
      }
      logger.debug(`[RICH TRANSLATION RESPONSE]\n${fullResponse}`);
    })();
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
    signal?: AbortSignal;
    traceId?: string;
  }): Promise<RichConjugations> {
    const model = await this.ollamaClient.ensureModel(params.model);
    const verb = params.infinitive.trim();
    const tenses = CORE_TENSES[params.sourceLanguage.toLowerCase()];
    if (!verb || !tenses?.length) return { conjugations: {} };

    const results = await Promise.all(
      tenses.map((tense) =>
        this.fetchTenseRows(
          verb,
          params.sourceLanguage,
          tense,
          model,
          params.signal,
          params.traceId,
        ),
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
    signal?: AbortSignal;
    traceId?: string;
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
      if (params.signal?.aborted) break;
      this.fetchTenseRows(
        verb,
        params.sourceLanguage,
        tense,
        model,
        params.signal,
        params.traceId,
      )
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
  private async dropSameLanguageExamples(
    rich: RichObj,
    sourceLanguage: string,
    targetLanguage: string,
    model: string,
  ): Promise<void> {
    const examples = rich.examples;
    if (!Array.isArray(examples)) return;
    const mappedAndFiltered: any[] = [];

    const segment = typeof rich.segment === 'string' ? rich.segment : '';

    for (const ex of examples) {
      if (!ex || typeof ex !== 'object') continue;
      const entry = ex as Record<string, unknown>;
      const sentenceKey =
        Object.keys(entry).find((k) => k.toLowerCase().includes('sentence')) ||
        'sentence';
      const translationKey =
        Object.keys(entry).find((k) =>
          k.toLowerCase().includes('translation'),
        ) || 'translation';

      const sentenceVal = entry[sentenceKey];
      const translationVal = entry[translationKey];
      let sentence = typeof sentenceVal === 'string' ? sentenceVal.trim() : '';
      let translation =
        typeof translationVal === 'string' ? translationVal.trim() : '';
      if (!sentence || !translation) continue;

      const srcScript = detectScript(sentence);
      const tgtScript = detectScript(translation);
      const isScriptConflict =
        srcScript !== 'latin' &&
        srcScript !== 'unknown' &&
        srcScript === tgtScript;

      // Word overlap check (for latin or other scripts)
      const cleanWords = (text: string) =>
        text
          .toLowerCase()
          .replace(/[.,/#!$%^&*;:{}=\-_`~()?'"]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 1);

      const wordsSrc = cleanWords(sentence);
      const wordsTgt = cleanWords(translation);
      let isOverlapConflict = false;
      if (wordsSrc.length > 0 && wordsTgt.length > 0) {
        const setSrc = new Set(wordsSrc);
        let commonCount = 0;
        for (const w of wordsTgt) {
          if (setSrc.has(w)) commonCount++;
        }
        const overlap =
          commonCount / Math.max(wordsSrc.length, wordsTgt.length);
        if (overlap > 0.85) {
          isOverlapConflict = true;
        }
      }

      if (isScriptConflict || isOverlapConflict) {
        this.logger.log(
          `[RichTranslation] Healing same-language example: "${sentence}" / "${translation}"`,
        );
        const cleanSegment = segment.toLowerCase().trim();
        const containsSegment = sentence.toLowerCase().includes(cleanSegment);

        try {
          if (containsSegment) {
            // Both are in the source language. Translate to target language.
            const res = await this.translateText({
              text: sentence,
              targetLanguage,
              sourceLanguage,
              model,
            });
            translation = res.response.trim();
          } else {
            // Both are in target language. Translate to source language.
            const res = await this.translateText({
              text: translation,
              targetLanguage: sourceLanguage,
              sourceLanguage: targetLanguage,
              model,
            });
            sentence = res.response.trim();
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Failed to heal same-language example: ${errMsg}`);
        }
      }

      mappedAndFiltered.push({ sentence, translation });
    }

    rich.examples = mappedAndFiltered;
  }

  private async fetchRichTranslation(
    params: {
      text: string;
      targetLanguage: string;
      context?: string;
      sourceLanguage?: string;
      signal?: AbortSignal;
      regenerate?: boolean;
      preferredTranslation?: string;
    },
    model: string,
    traceId?: string,
  ): Promise<RichObj> {
    // Generate prompt with preferred target alignment hint for static fetch
    const prompt = getRichTranslationPrompt(
      params.text,
      params.targetLanguage,
      params.context,
      params.sourceLanguage,
      params.preferredTranslation,
    );
    const { response } = await this.ollamaClient.generate(
      model,
      prompt,
      false,
      'json',
      {
        num_ctx: 2048,
        num_predict: 768,
        temperature: params.regenerate ? 0.3 : 0,
      },
      params.signal,
      traceId,
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
    if (rich.isVerb !== true) {
      delete rich.conjugations;
      delete (rich as Record<string, unknown>).translationConjugated;
      delete (rich as Record<string, unknown>)._verbAnalysis;
      if (rich.grammar) {
        delete rich.grammar.infinitive;
        delete rich.grammar.sourceInfinitive;
        delete rich.grammar.tense;
      }
    }

    // Recursively delete properties with values like 'n/a', 'none', or empty strings
    const cleanObject = (obj: Record<string, unknown>) => {
      if (!obj || typeof obj !== 'object') return;
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === 'string') {
          const lower = val.trim().toLowerCase();
          if (lower === 'n/a' || lower === 'none' || lower === '') {
            delete obj[key];
          }
        } else if (typeof val === 'object' && val !== null) {
          cleanObject(val as Record<string, unknown>);
        }
      }
    };
    cleanObject(rich as Record<string, unknown>);

    if (rich._verbAnalysis && Object.keys(rich._verbAnalysis).length === 0) {
      delete rich._verbAnalysis;
    }
    if (rich.grammar && Object.keys(rich.grammar).length === 0) {
      delete rich.grammar;
    }
  }

  private stripPronounPrefix(rich: RichObj, input: string): void {
    const isSingleWord = !input.trim().includes(' ');
    if (!isSingleWord) return;

    const pronouns = new Set([
      'ich',
      'du',
      'er',
      'sie',
      'es',
      'wir',
      'ihr',
      'Sie',
      'yo',
      'tú',
      'él',
      'ella',
      'usted',
      'nosotros',
      'nosotras',
      'vosotros',
      'vosotras',
      'ellos',
      'ellas',
      'ustedes',
      'je',
      "j'",
      'tu',
      'il',
      'elle',
      'on',
      'nous',
      'vous',
      'ils',
      'elles',
      'io',
      'tu',
      'lui',
      'lei',
      'noi',
      'voi',
      'loro',
      'я',
      'ты',
      'он',
      'она',
      'оно',
      'мы',
      'вы',
      'они',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
    ]);

    const strip = (text: unknown): string => {
      if (typeof text !== 'string') return '';
      const cleaned = text.trim();
      const tokens = cleaned.split(/([\s/,()]+)/);
      let firstNonPronounIndex = -1;
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!token) continue;
        if (/^[\s/,()]+$/.test(token)) continue;
        const isPronoun =
          pronouns.has(token.toLowerCase()) ||
          (token.toLowerCase().endsWith("'") &&
            pronouns.has(token.toLowerCase().slice(0, -1))) ||
          pronouns.has(token.toLowerCase() + "'");
        if (isPronoun) continue;
        firstNonPronounIndex = i;
        break;
      }
      if (firstNonPronounIndex > 0) {
        const remainder = tokens.slice(firstNonPronounIndex).join('').trim();
        if (remainder) return remainder;
      }
      if (/^j'/i.test(cleaned) && cleaned.length > 2) {
        return cleaned.slice(2).trim();
      }
      return cleaned;
    };

    if (rich.translationConjugated) {
      rich.translationConjugated = strip(rich.translationConjugated);
    }
    if (rich.translation) {
      rich.translation = strip(rich.translation);
    }
  }

  /** Returns the rows array for one tense, or null on failure / bad shape. */
  private async fetchTenseRows(
    verb: string,
    sourceLanguage: string,
    tense: string,
    model: string,
    signal?: AbortSignal,
    traceId?: string,
  ): Promise<unknown[] | null> {
    try {
      const { response } = await this.ollamaClient.generate(
        model,
        getSingleTensePrompt(verb, sourceLanguage, tense),
        false,
        'json',
        { num_predict: 256, temperature: 0 },
        signal,
        traceId,
      );
      const preview =
        typeof response === 'string'
          ? response.slice(0, 300).replace(/\s+/g, ' ')
          : String(response);
      this.logger.log(
        `[Conjugations] verb="${verb}" tense="${tense}" raw: ${preview}`,
      );
      let parsed: { rows?: unknown } | null = null;
      try {
        parsed = cleanAndParseJson<{ rows?: unknown }>(response);
      } catch (parseErr) {
        this.logger.warn(
          `[Conjugations] verb="${verb}" tense="${tense}" JSON parse failed: ${String(parseErr)}`,
        );
        return null;
      }
      const rows = parsed?.rows;
      if (!Array.isArray(rows) || rows.length === 0) {
        this.logger.warn(
          `[Conjugations] verb="${verb}" tense="${tense}" produced ${
            Array.isArray(rows) ? 'empty rows array' : `rows=${typeof rows}`
          }`,
        );
        return null;
      }
      return rows as unknown[];
    } catch (e) {
      this.logger.warn(
        `[Conjugations] verb="${verb}" tense="${tense}" fetch failed: ${String(e)}`,
      );
      return null;
    }
  }
}
