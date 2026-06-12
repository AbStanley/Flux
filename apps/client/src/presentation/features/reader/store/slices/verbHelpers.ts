import type { RichTranslationResult } from "../../../../../core/interfaces/IAIService";

export const isSingleToken = (text: string) => !text.trim().includes(" ");

/**
 * Client-side mirror of the server's CORE_TENSES keys. Kept here to avoid
 * speculative conjugations requests for languages the server can't answer.
 * Add a new language to both this set and CORE_TENSES when expanding.
 */
export const SUPPORTED_CONJUGATION_LANGS = new Set([
  "english",
  "spanish",
  "italian",
  "portuguese",
  "french",
  "german",
  "russian",
]);

/**
 * Matches "verb" in major language labels the model might emit for
 * `partOfSpeech`. We intentionally skip word-boundary assertions because
 * `\b` doesn't behave well across scripts (Cyrillic "глагол").
 */
export const VERB_POS_RE = /(verb|verbo|verbe|глагол)/i;

/**
 * Nouns and adjectives don't have infinitives or grammatical tenses.
 * When the model emits BOTH of those, it's describing verb morphology
 * regardless of whatever label landed in `partOfSpeech`.
 */
export const hasStrongVerbStructure = (data: RichTranslationResult): boolean => {
  const infinitive = data.grammar?.infinitive?.trim();
  const tense = data.grammar?.tense?.trim();
  return Boolean(infinitive) && Boolean(tense);
};

/**
 * Decides whether the "Show conjugations" affordance should appear.
 */
export const coreLooksLikeVerb = (data: RichTranslationResult): boolean => {
  const pos = data.grammar?.partOfSpeech;
  if (typeof pos === "string" && pos.trim()) {
    return VERB_POS_RE.test(pos);
  }
  if (data.isVerb === true) return true;
  if (data.isVerb === false) return false;
  return hasStrongVerbStructure(data);
};

export const shouldFetchConjugations = (
  data: RichTranslationResult,
  sourceLang: string,
): boolean => {
  if (!coreLooksLikeVerb(data)) return false;
  if (!sourceLang || sourceLang === "Auto") return false;
  return SUPPORTED_CONJUGATION_LANGS.has(sourceLang.toLowerCase());
};
