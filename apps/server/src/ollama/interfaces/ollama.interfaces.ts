import { Message } from 'ollama';

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

export interface TranslationResponse {
  response: string;
  sourceLanguage?: string;
}

export type { Message };
