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
  word: string;
  pronunciation: string;
  definitions: {
    type: string;
    definition: string;
    example: string;
    translation: string;
  }[];
}

export interface RichConjugations {
  conjugations: Record<string, Array<{ pronoun: string; conjugation: string }>>;
}

export interface TranslationResponse {
  response: string;
  sourceLanguage?: string;
}

export type { Message };
