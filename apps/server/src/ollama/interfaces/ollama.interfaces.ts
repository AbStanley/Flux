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

export type { Message };
