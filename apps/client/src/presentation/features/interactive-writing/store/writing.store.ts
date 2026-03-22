import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WritingCorrection } from '@/types/writing';

interface WritingState {
  text: string;
  corrections: WritingCorrection[];
  isAnalyzing: boolean;
  error: string | null;
  sourceLanguage: string;
  history: string[];
  lastAppliedInfo: { offset: number; length: number; timestamp: number } | null;
  ignoredOriginals: string[];
  appliedSuggestions: { original: string; suggestion: string }[];
  highlightMode: 'minimal' | 'full';
  lastPolishedText: string;

  // Actions
  setText: (text: string) => void;
  setSourceLanguage: (lang: string) => void;
  applyAnalysisResult: (text: string, corrections: WritingCorrection[]) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
  revertCorrection: (correction: WritingCorrection) => void;
  dismissCorrection: (mistakeText: string) => void;
  checkText: (text: string, language: string) => Promise<void>;
  undo: () => void;
  clearLastApplied: () => void;
  setHighlightMode: (mode: 'minimal' | 'full') => void;
}

let activeAbortController: AbortController | null = null;

export const useWritingStore = create<WritingState>()(
  persist(
    (set) => ({
      text: '',
      corrections: [],
      isAnalyzing: false,
      error: null,
      sourceLanguage: 'English',
      history: [],
      lastAppliedInfo: null,
      ignoredOriginals: [],
      appliedSuggestions: [],
      highlightMode: 'minimal',
      lastPolishedText: '',

      setText: (text) => set((state) => {
        const lastHistory = state.history[state.history.length - 1];
        // Only save to history if text is significantly different
        const newHistory = text !== lastHistory && text !== state.text
          ? [...state.history, state.text].slice(-20)
          : state.history;
        return { text, history: newHistory };
      }),

      setSourceLanguage: (sourceLanguage) => set({ sourceLanguage }),

      applyAnalysisResult: (newText, rawCorrections) => set((state) => {
        const textToUse = newText || state.text;

        const safeCorrections = (Array.isArray(rawCorrections) ? rawCorrections : (rawCorrections as Record<string, unknown>)?.corrections || []) as WritingCorrection[];
        
        let lastOldIndex = 0;

        const verifiedCorrections = safeCorrections
          .filter((c): c is WritingCorrection => c !== null && typeof c === 'object') // Ensure valid object
          .filter(c => c.mistakeText !== c.correctionText) // Filter out noise
          .map((correction, idx) => {
            if (!correction.correctionText || !correction.mistakeText) return null;
            
            // TRIM whitespace to prevent trailing/leading spaces from being highlighted
            const orig = correction.correctionText.trim(); 
            const mistakeStr = correction.mistakeText.trim();
            const actualLength = orig.length;
            if (actualLength === 0) return null; // Drop empty highlights
            
            // 1. Trust AI startIndex if valid
            if (correction.startIndex !== undefined &&
                textToUse.substring(correction.startIndex, correction.startIndex + actualLength) === orig) {
              return { ...correction, mistakeText: mistakeStr, correctionText: orig, offset: correction.startIndex, length: actualLength, originalIndex: idx } as WritingCorrection;
            }

            // 2. Establish Expected Locality relative to the OLD text
            let oldIndex = state.text.toLowerCase().indexOf(mistakeStr.toLowerCase(), lastOldIndex);
            if (oldIndex === -1) {
              // Fallback if AI skipped ahead or mutated heavily
              oldIndex = state.text.toLowerCase().indexOf(mistakeStr.toLowerCase());
              if (oldIndex === -1) oldIndex = Math.max(0, lastOldIndex);
            }
            lastOldIndex = oldIndex + mistakeStr.length;
            const expectedOffset = oldIndex;

            // 3. Find all occurrences of the corrected text in the NEW text
            const occurrences: number[] = [];
            let i = -1;
            while ((i = textToUse.indexOf(orig, i + 1)) !== -1) {
              occurrences.push(i);
            }

            // Case-Insensitive fallback occurrences
            if (occurrences.length === 0) {
              const textLower = textToUse.toLowerCase();
              const origLower = orig.toLowerCase();
              let j = -1;
              while ((j = textLower.indexOf(origLower, j + 1)) !== -1) {
                occurrences.push(j);
              }
            }

            // 4. Pick the physical occurrence closest to where the mistake used to be
            if (occurrences.length > 0) {
              let bestMatch = occurrences[0];
              let minDiff = Math.abs(bestMatch - expectedOffset);
              
              for (const pos of occurrences) {
                const diff = Math.abs(pos - expectedOffset);
                if (diff < minDiff) {
                  minDiff = diff;
                  bestMatch = pos;
                }
              }
              return { ...correction, mistakeText: mistakeStr, correctionText: orig, offset: bestMatch, length: actualLength, originalIndex: idx } as WritingCorrection;
            }

            return null; // Drop if not found anywhere in new text
          })
          .filter((c): c is WritingCorrection => c !== null);

        // Deduplicate overlapping offsets
        const uniqueOffsets = new Set<number>();
        const finalCorrections = verifiedCorrections.filter(c => {
           if (c.offset === undefined) return false;
           if (uniqueOffsets.has(c.offset)) return false;
           uniqueOffsets.add(c.offset);
           return true;
        });

        const newHistory = [...state.history, state.text].slice(-20);

        return { 
          text: textToUse, 
          corrections: finalCorrections, 
          history: newHistory,
          lastPolishedText: textToUse,
          lastAppliedInfo: null 
        };
      }),

      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

      setError: (error) => set({ error }),

      clearAll: () => set({ text: '', corrections: [], error: null, history: [], ignoredOriginals: [], appliedSuggestions: [], lastPolishedText: '' }),

      dismissCorrection: (mistakeText) => set((state) => ({
        ignoredOriginals: [...state.ignoredOriginals, mistakeText],
        corrections: state.corrections.filter(c => c.mistakeText !== mistakeText)
      })),

      setHighlightMode: (highlightMode) => set({ highlightMode }),

      revertCorrection: (correction) => set((state) => {
        const { text, corrections } = state;

        const finalOffset = correction.offset!;
        const actualText = text.slice(finalOffset, finalOffset + correction.length!);

        if (actualText.toLowerCase() !== correction.correctionText.toLowerCase()) {
          return { corrections: corrections.filter(c => c !== correction) };
        }

        const newText =
          text.slice(0, finalOffset) +
          correction.mistakeText +
          text.slice(finalOffset + correction.length!);

        const diff = correction.mistakeText.length - correction.length!;
        const newCorrections = corrections
          .filter(c => c !== correction)
          .map(c => {
            if (c.offset! > finalOffset) {
              return { ...c, offset: c.offset! + diff };
            }
            return c;
          });

        return {
          text: newText,
          corrections: newCorrections,
          history: [...state.history, text].slice(-20),
          lastAppliedInfo: { 
            offset: finalOffset, 
            length: correction.mistakeText.length, 
            timestamp: Date.now() 
          },
          appliedSuggestions: [
            ...state.appliedSuggestions, 
            { original: correction.correctionText, suggestion: correction.mistakeText }
          ].slice(-10)
        };
      }),

      clearLastApplied: () => set({ lastAppliedInfo: null }),

      undo: () => set((state) => {
        if (state.history.length === 0) return state;
        const previousText = state.history[state.history.length - 1];
        const newHistory = state.history.slice(0, -1);
        return {
          text: previousText,
          history: newHistory,
          corrections: []
        };
      }),

      checkText: async (text, language) => {
        const { setIsAnalyzing, applyAnalysisResult, setError, highlightMode } = useWritingStore.getState();
        if (!text.trim()) {
          applyAnalysisResult('', []);
          return;
        }

        if (activeAbortController) {
          activeAbortController.abort();
        }
        const myController = new AbortController();
        activeAbortController = myController;

        setIsAnalyzing(true);
        try {
          const { ollamaApi } = await import('@/infrastructure/api/ollama');
          const response = await ollamaApi.checkWriting({
            text,
            sourceLanguage: language,
            mode: highlightMode,
          }, myController.signal);

          // Use AI's text or fallback to original text if missing
          const parsedResponseText = Array.isArray(response.text) ? response.text.join(' ') : response.text;
          const finalNewText = parsedResponseText || text;
          applyAnalysisResult(finalNewText, response.corrections || []);
          useWritingStore.getState().setHighlightMode('full'); // Auto-toggle ON so user instantly sees highlights
          setError(null);
        } catch (err: unknown) {
          if (err instanceof Error && err.name === 'AbortError') {
            return; // Ignore cancellations
          }
          const errorMessage = err instanceof Error ? err.message : 'Failed to analyze writing';
          setError(errorMessage);
        } finally {
          setIsAnalyzing(false);
          if (activeAbortController === myController) {
            activeAbortController = null;
          }
        }
      },
    }),
    {
      name: 'writing-storage',
      partialize: (state) => ({ text: state.text, sourceLanguage: state.sourceLanguage }),
    }
  )
);
