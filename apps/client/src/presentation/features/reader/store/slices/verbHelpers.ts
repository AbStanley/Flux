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

const PRONOUNS = new Set([
  "ich", "du", "er", "sie", "es", "wir", "ihr", "Sie",
  "yo", "tú", "él", "ella", "usted", "nosotros", "nosotras", "vosotros", "vosotras", "ellos", "ellas", "ustedes",
  "je", "j'", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
  "io", "tu", "lui", "lei", "noi", "voi", "loro",
  "я", "ты", "он", "она", "оно", "мы", "вы", "они",
  "i", "you", "he", "she", "it", "we", "they"
]);

export const stripPronounPrefix = (text: string): string => {
  const cleaned = text.trim();
  
  // Split by separators, capturing the separators in the result
  const tokens = cleaned.split(/([\s/,()]+)/);
  
  let firstNonPronounIndex = -1;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;
    
    // If it's a separator, it's part of the prefix
    if (/^[\s/,()]+$/.test(token)) {
      continue;
    }
    
    // Check if the word is a pronoun
    const isPronoun = PRONOUNS.has(token.toLowerCase()) || 
                      (token.toLowerCase().endsWith("'") && PRONOUNS.has(token.toLowerCase().slice(0, -1))) ||
                      PRONOUNS.has(token.toLowerCase() + "'"); // handle j' etc.
                      
    if (isPronoun) {
      continue;
    }
    
    // Found the first non-pronoun word token
    firstNonPronounIndex = i;
    break;
  }
  
  if (firstNonPronounIndex > 0) {
    const remainder = tokens.slice(firstNonPronounIndex).join("").trim();
    if (remainder) {
      return remainder;
    }
  }
  
  // Fallback to strip j' if it's attached to the verb directly without separators
  if (/^j'/i.test(cleaned) && cleaned.length > 2) {
    return cleaned.slice(2).trim();
  }
  
  return cleaned;
};

