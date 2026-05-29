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

/**
 * Small models occasionally emit nested objects or `null` where a JSON
 * schema asked for strings. These helpers coerce unknown payloads into safe shapes.
 */
export const asString = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;

export const asStringArray = (v: unknown): string[] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const strings = v.filter((x): x is string => typeof x === "string");
  return strings.length > 0 ? strings : undefined;
};

export const asExampleArray = (
  v: unknown,
): RichTranslationResult["examples"] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const safe = v
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const e = entry as { sentence?: unknown; translation?: unknown };
      const sentence = asString(e.sentence);
      const translation = asString(e.translation);
      if (!sentence || !translation) return null;
      return { sentence, translation };
    })
    .filter((e): e is { sentence: string; translation: string } => e !== null);
  return safe.length > 0 ? safe : undefined;
};

export const sanitizeGrammar = (
  grammar: unknown,
  isVerb?: boolean,
): RichTranslationResult["grammar"] | undefined => {
  if (!grammar || typeof grammar !== "object") return undefined;
  const g = grammar as Record<string, unknown>;
  const dropVerbFields = isVerb === false;
  return {
    partOfSpeech: asString(g.partOfSpeech) ?? "",
    tense: dropVerbFields ? undefined : asString(g.tense),
    gender: asString(g.gender),
    infinitive: dropVerbFields ? undefined : asString(g.infinitive),
    explanation: asString(g.explanation) ?? "",
  } as RichTranslationResult["grammar"];
};

export const sanitizeConjugations = (
  conjugations: unknown,
): RichTranslationResult["conjugations"] | null => {
  if (!conjugations || typeof conjugations !== "object") return null;
  const out: NonNullable<RichTranslationResult["conjugations"]> = {};
  for (const [tense, rows] of Object.entries(
    conjugations as Record<string, unknown>,
  )) {
    if (!Array.isArray(rows)) continue;
    const cleanRows = rows
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as { pronoun?: unknown; conjugation?: unknown };
        const pronoun = asString(r.pronoun);
        const conjugation = asString(r.conjugation);
        if (!pronoun || !conjugation) return null;
        return { pronoun, conjugation };
      })
      .filter((r): r is { pronoun: string; conjugation: string } => r !== null);
    if (cleanRows.length > 0) out[tense] = cleanRows;
  }
  return Object.keys(out).length > 0 ? out : null;
};

export const sanitizeRichResult = (
  raw: RichTranslationResult,
  fallbackSegment: string,
): RichTranslationResult => {
  const rawObj = raw as unknown as Record<string, unknown>;
  const isVerb = typeof raw.isVerb === "boolean" ? raw.isVerb : undefined;
  return {
    type: raw.type,
    isVerb,
    segment: asString(raw.segment) ?? fallbackSegment,
    translation: asString(raw.translation) ?? "",
    grammar: sanitizeGrammar(rawObj.grammar, isVerb),
    examples: asExampleArray(rawObj.examples) ?? [],
    alternatives: asStringArray(rawObj.alternatives) ?? [],
    syntaxAnalysis: asString(rawObj.syntaxAnalysis),
    grammarRules: asStringArray(rawObj.grammarRules),
    conjugations: sanitizeConjugations(rawObj.conjugations) ?? undefined,
  };
};

export const sanitizePartialRich = (
  raw: Partial<RichTranslationResult>,
): Partial<RichTranslationResult> => {
  const r = raw as unknown as Record<string, unknown>;
  const out: Partial<RichTranslationResult> = {};
  if (raw.type) out.type = raw.type;
  const isVerb = typeof raw.isVerb === "boolean" ? raw.isVerb : undefined;
  if (typeof isVerb === "boolean") out.isVerb = isVerb;
  const segment = asString(r.segment);
  if (segment) out.segment = segment;
  const translation = asString(r.translation);
  if (translation) out.translation = translation;
  const grammar = sanitizeGrammar(r.grammar, isVerb);
  if (grammar) out.grammar = grammar;
  const examples = asExampleArray(r.examples);
  if (examples) out.examples = examples;
  const alternatives = asStringArray(r.alternatives);
  if (alternatives) out.alternatives = alternatives;
  const syntaxAnalysis = asString(r.syntaxAnalysis);
  if (syntaxAnalysis) out.syntaxAnalysis = syntaxAnalysis;
  const grammarRules = asStringArray(r.grammarRules);
  if (grammarRules) out.grammarRules = grammarRules;
  const conjugations = sanitizeConjugations(r.conjugations);
  if (conjugations) out.conjugations = conjugations;
  return out;
};
