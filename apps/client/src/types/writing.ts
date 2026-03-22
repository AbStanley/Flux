export interface WritingCorrection {
  type: string;
  shortDescription: string;
  longDescription: string;
  startIndex?: number;
  endIndex?: number;
  mistakeText: string;
  correctionText: string;

  // Client-computed properties
  offset?: number;
  length?: number;
  originalIndex?: number;
}
