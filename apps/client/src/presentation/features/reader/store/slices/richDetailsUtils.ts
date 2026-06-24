import type { RichTranslationResult } from "../../../../../core/interfaces/IAIService";

export * from "./verbHelpers";

/**
 * Small models occasionally emit nested objects or `null` where a JSON
 * schema asked for strings. These helpers coerce unknown payloads into safe shapes.
 */
const isPlaceholder = (s: string): boolean => {
  const normalized = s.trim().toLowerCase();
  return (
    normalized === "n/a" ||
    normalized === "none" ||
    normalized === "null" ||
    normalized === "undefined" ||
    normalized === ""
  );
};

export const asString = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  if (isPlaceholder(v)) return undefined;
  return v;
};

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
      const e = entry as Record<string, unknown>;
      const sentenceKey = Object.keys(e).find(
        (k) => k.toLowerCase().includes("sentence")
      ) || "sentence";
      const translationKey = Object.keys(e).find(
        (k) => k.toLowerCase().includes("translation")
      ) || "translation";
      const sentence = asString(e[sentenceKey]);
      const translation = asString(e[translationKey]);
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
    infinitive: dropVerbFields ? undefined : (asString(g.sourceInfinitive) ?? asString(g.infinitive)),
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
  const translationConjugated = isVerb ? asString(rawObj.translationConjugated) : undefined;
  
  const grammar = sanitizeGrammar(rawObj.grammar, isVerb);
  const translationStr = asString(raw.translation) ?? "";
  
  // Anti-hallucination: If the model placed the target language translation 
  // into the source infinitive slot, discard it.
  if (grammar?.infinitive && translationStr && grammar.infinitive.toLowerCase() === translationStr.toLowerCase()) {
    grammar.infinitive = undefined;
  }

  return {
    type: raw.type,
    isVerb,
    segment: asString(raw.segment) ?? fallbackSegment,
    translation: translationStr,
    translationConjugated,
    grammar,
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
  const translationStr = asString(r.translation);
  if (translationStr) out.translation = translationStr;
  const translationConjugated = asString(r.translationConjugated);
  if (translationConjugated && isVerb) out.translationConjugated = translationConjugated;
  const grammar = sanitizeGrammar(r.grammar, isVerb);
  
  if (grammar) {
    if (grammar.infinitive && translationStr && grammar.infinitive.toLowerCase() === translationStr.toLowerCase()) {
      grammar.infinitive = undefined;
    }
    out.grammar = grammar;
  }
  
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
