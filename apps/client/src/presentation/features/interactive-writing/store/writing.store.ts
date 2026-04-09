import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WritingCorrection } from '@/types/writing';
import { backendAiApi } from '@/infrastructure/api/backend-ai-api';

interface WritingState {
  text: string;
  corrections: WritingCorrection[];
  isAnalyzing: boolean;
  error: string | null;
  sourceLanguage: string;
  evaluationModel: string;
  history: string[];
  lastAppliedInfo: { offset: number; length: number; timestamp: number } | null;
  ignoredOriginals: string[];
  appliedSuggestions: { original: string; suggestion: string }[];
  highlightMode: 'minimal' | 'full';
  lastPolishedText: string;

  // Actions
  setText: (text: string) => void;
  setSourceLanguage: (lang: string) => void;
  setEvaluationModel: (model: string) => void;
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
      evaluationModel: '',
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

      setEvaluationModel: (evaluationModel) => set({ evaluationModel }),

      applyAnalysisResult: (newText, rawCorrections) => set((state) => {
        const textToUse = newText || state.text;

        const safeCorrections = (Array.isArray(rawCorrections) ? rawCorrections : []) as WritingCorrection[];

        // Server now returns pre-computed offsets from marker parsing
        const finalCorrections = safeCorrections
          .filter((c): c is WritingCorrection =>
            c !== null &&
            typeof c === 'object' &&
            c.mistakeText !== c.correctionText &&
            !!c.correctionText &&
            !!c.mistakeText
          )
          .map((c) => ({
            ...c,
            mistakeText: c.mistakeText.trim(),
            correctionText: c.correctionText.trim(),
            offset: c.offset ?? c.startIndex ?? 0,
            length: c.length ?? c.correctionText.trim().length,
          }))
          .filter((c, _i, arr) => {
            // Deduplicate overlapping offsets
            return arr.findIndex(other => other.offset === c.offset) === arr.indexOf(c);
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
        const { setIsAnalyzing, applyAnalysisResult, setError, highlightMode, evaluationModel } =
          useWritingStore.getState();
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
          const response = await backendAiApi.checkWriting({
            text,
            sourceLanguage: language,
            mode: highlightMode,
            ...(evaluationModel.trim() ? { model: evaluationModel.trim() } : {}),
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
          // Only the active request may clear analyzing state (avoids stale runs after abort)
          if (activeAbortController === myController) {
            activeAbortController = null;
            setIsAnalyzing(false);
          }
        }
      },
    }),
    {
      name: 'writing-storage',
      partialize: (state) => ({
        text: state.text,
        sourceLanguage: state.sourceLanguage,
        evaluationModel: state.evaluationModel,
      }),
    }
  )
);
