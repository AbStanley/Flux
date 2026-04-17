import { Injectable, Logger } from '@nestjs/common';
import { OllamaClientService } from './ollama-client.service';
import {
  getTranslatePrompt,
  getExplainPrompt,
  getRichTranslationPrompt,
  getConjugationsPrompt,
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
    // A single-word lookup is ≤ 10 tokens; a full-sentence translation is
    // rarely more than a few hundred. 256 caps runaway generation without
    // truncating real output. temperature=0 removes sampling overhead.
    const response = await this.ollamaClient.generate(
      model,
      prompt,
      false,
      isAuto ? 'json' : undefined,
      { num_predict: 256, temperature: 0 },
    );

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

    // `format: 'json'` keeps Ollama's JSON-mode stopping behavior (closes
    // cleanly after the object) without the grammar-constrained schema that
    // was fighting the model on non-Latin scripts. The prompt is the single
    // source of shape; the server validator is the safety net.
    const response = await this.ollamaClient.generate(
      model,
      prompt,
      false,
      'json',
      { num_predict: 1024, temperature: 0 },
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

    // Gemma sometimes emits a valid JSON without the conjugations block even
    // for verbs it clearly knows how to conjugate. Fire a focused follow-up
    // call that asks for conjugations alone — less context, simpler shape,
    // much more likely to complete.
    await this.fillMissingConjugations(result, model, params.sourceLanguage);

    return result;
  }

  private async fillMissingConjugations(
    result: RichTranslation,
    model: string,
    sourceLanguage?: string,
  ): Promise<void> {
    const obj = result as unknown as Record<string, unknown>;
    if (obj.isVerb !== true) return;
    const existing = obj.conjugations as Record<string, unknown> | undefined;
    if (existing && Object.keys(existing).length > 0) return;

    const grammar = obj.grammar as Record<string, unknown> | undefined;
    const infinitive =
      typeof grammar?.infinitive === 'string' ? grammar.infinitive.trim() : '';
    const segment = typeof obj.segment === 'string' ? obj.segment.trim() : '';
    const verb = infinitive || segment;
    if (!verb) return;

    const srcLang =
      sourceLanguage && sourceLanguage !== 'Auto'
        ? sourceLanguage
        : `the language of "${verb}"`;
    const prompt = getConjugationsPrompt(verb, srcLang);

    try {
      const response = await this.ollamaClient.generate(
        model,
        prompt,
        false,
        'json',
        { num_predict: 512, temperature: 0 },
      );
      const table = cleanAndParseJson<Record<string, unknown>>(
        response.response,
      );
      if (table && typeof table === 'object' && Object.keys(table).length > 0) {
        obj.conjugations = table;
      }
    } catch (e) {
      this.logger.warn(
        `[RichTranslation] conjugation fallback failed: ${String(e)}`,
      );
    }
  }

  /**
   * The prompt + JSON schema ask the LLM to set "isVerb" first and always
   * emit "conjugations". We trust that boolean and then apply one semantic
   * check against the forms:
   *   - isVerb=false → strip "conjugations" and the verb-only grammar fields.
   *   - isVerb=true  → keep the block unless no form shares a single letter
   *     with the source word. Zero character overlap means the forms are in
   *     a different script entirely (e.g. Cyrillic source, Latin conjugated
   *     forms) — a clear wrong-language leak. Any real paradigm, even an
   *     irregular one, will share at least one letter across all forms.
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
          allForms.push(row.conjugation.toLowerCase());
        }
      }
    }
    if (allForms.length === 0) {
      delete obj.conjugations;
      return;
    }

    const infinitive =
      typeof grammar?.infinitive === 'string' ? grammar.infinitive : '';
    const source = (infinitive || lookupText || '').toLowerCase();
    const sourceLetters = new Set(source.match(/\p{L}/gu) ?? []);
    if (sourceLetters.size === 0) return;

    // If NO form shares a single letter with the source word, the model
    // emitted the conjugations in a different script (e.g. Russian lookup
    // answered with Spanish verbs). That's a wrong-language leak; drop.
    const anyFormShares = allForms.some((form) =>
      (form.match(/\p{L}/gu) ?? []).some((ch) => sourceLetters.has(ch)),
    );
    if (!anyFormShares) {
      delete obj.conjugations;
    }
  }
}
