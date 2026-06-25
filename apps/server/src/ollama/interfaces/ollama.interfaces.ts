import { Message } from 'ollama';

export interface WritingCorrection {
  type: string;
  shortDescription: string;
  longDescription: string;
  startIndex?: number;
  endIndex?: number;
  offset?: number;
  length?: number;
  mistakeText: string;
  correctionText: string;
}

export interface WritingAnalysisResponse {
  text: string;
  corrections: WritingCorrection[];
}

export interface GrammarAnalysisResponse {
  grammar: {
    word: string;
    type: string;
    explanation: string;
  }[];
}

export interface RichTranslation {
  type?: string;
  isVerb?: boolean;
  translation: string;
  translationConjugated?: string;
  segment: string;
  grammar?: {
    partOfSpeech: string;
    tense?: string;
    gender?: string;
    number?: string;
    infinitive?: string;
    explanation: string;
  };
  syntaxAnalysis?: string;
  grammarRules?: string[];
  examples: Array<{
    sentence: string;
    translation: string;
  }>;
  alternatives: string[];
  conjugations?: {
    [tense: string]: Array<{ pronoun: string; conjugation: string }>;
  };
}

export interface RichConjugations {
  conjugations: Record<string, Array<{ pronoun: string; conjugation: string }>>;
}

export interface TranslationResponse {
  response: string;
  sourceLanguage?: string;
}

export type { Message };
