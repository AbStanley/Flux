import type { StateCreator } from "zustand";
import type {
  IAIService,
  RichTranslationResult,
} from "../../../../../core/interfaces/IAIService";
import { ollamaApi } from "../../../../../infrastructure/api/ollama";
import {
  coreLooksLikeVerb,
  shouldFetchConjugations,
  sanitizeConjugations,
  sanitizeRichResult,
  sanitizePartialRich,
} from "./richDetailsUtils";
import { useSettingsStore } from "../../../settings/store/useSettingsStore";

export { coreLooksLikeVerb, shouldFetchConjugations };

// Per-tab AbortControllers for in-flight rich streams. Lives outside the
// store because AbortController isn't serializable and we only ever have
// one stream per tab at a time. `cancelRichLoad(id)` aborts and forgets.
const activeRichAborts = new Map<string, AbortController>();


export interface RichDetailsTab {
  id: string; // usually the 'text' being translated
  text: string;
  data: RichTranslationResult | null;
  isLoading: boolean;
  /**
   * True while the rich-translation stream is still receiving chunks,
   * including after `isLoading` has flipped to false (which happens as
   * soon as the first useful field lands so the spinner clears). Drives
   * the Stop button visibility.
   */
  isStreaming?: boolean;
  error: string | null;
  context: string;
  sourceLang: string;
  targetLang: string;
  /** Per-tab state for the on-demand conjugations fetch. */
  conjugationsLoading?: boolean;
  conjugationsError?: string | null;

  // AI dictionary explanation fields
  aiExplanation?: string;
  aiExplanationLoading?: boolean;
  aiExplanationError?: string | null;
}

/**
 * Rich translation is authoritative once fetched. Writing it into the shared
 * hover cache keeps the inline popup (on hover/click) consistent with the
 * side panel instead of showing a stale or divergent simple-translate result.
 */
const syncRichIntoHoverCache = (
  set: Parameters<StateCreator<RichDetailsSlice>>[0],
  text: string,
  targetLang: string,
  translation: string,
) => {
  if (!translation) return;
  const cacheKey = `${text.trim()}_${targetLang}`;
  set((state) => {
    const s = state as unknown as { translationCache?: Map<string, string> };
    const nextCache = new Map(s.translationCache ?? new Map());
    nextCache.set(cacheKey, translation);
    return { translationCache: nextCache } as unknown as RichDetailsSlice;
  });
};

export type RichSnapState = "peek" | "half" | "full";

export interface RichDetailsSlice {
  richDetailsTabs: RichDetailsTab[];
  activeTabId: string | null;
  isRichInfoOpen: boolean;
  snapState: RichSnapState;

  fetchRichTranslation: (
    text: string,
    context: string,
    sourceLang: string,
    targetLang: string,
    aiService: IAIService,
  ) => Promise<void>;

  closeRichInfo: () => void;
  toggleRichInfo: () => void;
  setSnapState: (state: RichSnapState) => void;

  closeTab: (id: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (id: string) => void;
  regenerateTab: (id: string, aiService: IAIService) => Promise<void>;

  /**
   * On-demand conjugation fetch. The panel shows a "Show conjugations"
   * button for verb-like lookups in supported source languages; clicking
   * dispatches this action. Reuses the model-provided infinitive when
   * available, falling back to the raw text for single-token input.
   */
  fetchConjugationsForTab: (id: string, aiService: IAIService) => Promise<void>;

  /**
   * Aborts the in-flight rich-translation stream for a tab. Any partial
   * data already rendered stays. No-op if nothing is in flight.
   */
  cancelRichLoad: (id: string) => void;

  /**
   * Manually trigger a non-translating AI explanation of the word.
   */
  explainWordForTab: (id: string, aiService: IAIService) => Promise<void>;

  /**
   * On-demand generation of 3 additional unique examples appended to the side panel.
   */
  generateMoreExamplesForTab: (id: string) => Promise<void>;
}

async function runRichLoad(
  text: string,
  context: string,
  sourceLang: string,
  targetLang: string,
  aiService: IAIService,
  updateTab: (updater: (tab: RichDetailsTab) => RichDetailsTab) => void,
  syncHoverCache: (translation: string) => void,
  signal: AbortSignal,
): Promise<void> {
  let lastSyncedTranslation: string | null = null;

  const onPartial = (partial: Partial<RichTranslationResult>) => {
    const patch = sanitizePartialRich(partial);
    if (Object.keys(patch).length === 0) return;

    updateTab((tab) => {
      // Merge the fresh patch over whatever we already have. The
      // stream emits progressively-more-complete prefixes, so
      // fields only fill in or grow — never disappear.
      const prev = tab.data;
      const next: RichTranslationResult = {
        type: patch.type ?? prev?.type,
        isVerb: patch.isVerb ?? prev?.isVerb,
        segment: patch.segment ?? prev?.segment ?? text,
        translation: patch.translation ?? prev?.translation ?? "",
        grammar: patch.grammar ?? prev?.grammar,
        examples: patch.examples ?? prev?.examples ?? [],
        alternatives: patch.alternatives ?? prev?.alternatives ?? [],
        syntaxAnalysis: patch.syntaxAnalysis ?? prev?.syntaxAnalysis,
        grammarRules: patch.grammarRules ?? prev?.grammarRules,
        conjugations: patch.conjugations ?? prev?.conjugations,
      };
      // Clear the loading spinner as soon as we have SOME useful
      // content to render — the remaining fields fade in as they
      // arrive. Until then, keep showing the spinner.
      // If it's a verb, we wait for the conjugated translation to arrive
      // so it doesn't flash the infinitive alone.
      const becomeLoaded = next.isVerb 
        ? !!next.translationConjugated 
        : (!!next.translation || !!next.grammar);
        
      return {
        ...tab,
        data: next,
        isLoading: becomeLoaded ? false : tab.isLoading,
        error: null,
      };
    });

    if (patch.translation && patch.translation !== lastSyncedTranslation) {
      lastSyncedTranslation = patch.translation;
      syncHoverCache(patch.translation);
    }
  };

  const raw = await aiService.getRichTranslationStream(text, {
    targetLanguage: targetLang,
    context,
    sourceLanguage: sourceLang,
    signal,
    onPartial,
  });

  // Final write: run the full sanitize so missing fields get their
  // defaults (e.g. examples: []) and the UI settles on a stable shape.
  const safe = sanitizeRichResult(raw, text);
  updateTab((tab) => ({
    ...tab,
    data: safe,
    isLoading: false,
    isStreaming: false,
    error: null,
    conjugationsLoading: false,
    conjugationsError: null,
  }));
  syncHoverCache(safe.translation);
}

export const createRichDetailsSlice: StateCreator<RichDetailsSlice> = (
  set,
  get,
) => ({
  richDetailsTabs: [],
  activeTabId: null,
  isRichInfoOpen: false,
  snapState: "half",

  fetchRichTranslation: async (
    text,
    context,
    sourceLang,
    targetLang,
    aiService,
  ) => {
    const { richDetailsTabs, isRichInfoOpen, snapState } = get();
    const existingTab = richDetailsTabs.find((t) => t.id === text);

    // Auto-peek when opening a NEW selection while the panel is already
    // visible — keeps reading area unobstructed for the next selection.
    // Default to 'half' on a fresh open so the user immediately sees content.
    const nextSnap: RichSnapState = !isRichInfoOpen
      ? "half"
      : existingTab
        ? snapState
        : "peek";

    set({ isRichInfoOpen: true, snapState: nextSnap });

    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    const newTab: RichDetailsTab = {
      id: text,
      text,
      data: null,
      isLoading: true,
      isStreaming: true,
      error: null,
      context,
      sourceLang,
      targetLang,
    };

    set({
      richDetailsTabs: [...richDetailsTabs, newTab],
      activeTabId: text,
    });

    const updateTab = (updater: (tab: RichDetailsTab) => RichDetailsTab) => {
      set((state) => ({
        richDetailsTabs: state.richDetailsTabs.map((tab) =>
          tab.id === text ? updater(tab) : tab,
        ),
      }));
    };

    const controller = new AbortController();
    activeRichAborts.set(text, controller);

    try {
      await runRichLoad(
        text,
        context,
        sourceLang,
        targetLang,
        aiService,
        updateTab,
        (translation) =>
          syncRichIntoHoverCache(set, text, targetLang, translation),
        controller.signal,
      );
    } catch (error: unknown) {
      // User-triggered abort is a clean stop, not an error banner.
      if (controller.signal.aborted) {
        updateTab((tab) => ({ ...tab, isLoading: false, isStreaming: false }));
      } else {
        console.error(error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load";
        updateTab((tab) => ({ ...tab, isLoading: false, isStreaming: false, error: errorMessage }));
      }
    } finally {
      if (activeRichAborts.get(text) === controller) {
        activeRichAborts.delete(text);
      }
    }
  },

  closeTab: (id) => {
    activeRichAborts.get(id)?.abort();
    activeRichAborts.delete(id);
    set((state) => {
      const newTabs = state.richDetailsTabs.filter((t) => t.id !== id);
      let newActiveId = state.activeTabId;

      if (state.activeTabId === id) {
        newActiveId =
          newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
      }

      const isOpen = newTabs.length > 0;

      return {
        richDetailsTabs: newTabs,
        activeTabId: newActiveId,
        isRichInfoOpen: isOpen,
      };
    });
  },

  closeAllTabs: () => {
    for (const controller of activeRichAborts.values()) controller.abort();
    activeRichAborts.clear();
    set({
      richDetailsTabs: [],
      activeTabId: null,
      isRichInfoOpen: false,
    });
  },

  cancelRichLoad: (id) => {
    const controller = activeRichAborts.get(id);
    if (!controller) return;
    controller.abort();
    activeRichAborts.delete(id);
  },

  setActiveTab: (id) => {
    set({ activeTabId: id, isRichInfoOpen: true });
  },

  regenerateTab: async (id, aiService) => {
    const tab = get().richDetailsTabs.find((t) => t.id === id);
    if (!tab) return;

    const updateTab = (updater: (t: RichDetailsTab) => RichDetailsTab) => {
      set((state) => ({
        richDetailsTabs: state.richDetailsTabs.map((t) =>
          t.id === id ? updater(t) : t,
        ),
      }));
    };

    updateTab((t) => ({
      ...t,
      data: null,
      isLoading: true,
      isStreaming: true,
      error: null,
    }));

    const controller = new AbortController();
    activeRichAborts.set(id, controller);

    try {
      await runRichLoad(
        tab.text,
        tab.context,
        tab.sourceLang,
        tab.targetLang,
        aiService,
        updateTab,
        (translation) =>
          syncRichIntoHoverCache(set, tab.text, tab.targetLang, translation),
        controller.signal,
      );
    } catch (error: unknown) {
      if (controller.signal.aborted) {
        updateTab((t) => ({ ...t, isLoading: false, isStreaming: false }));
      } else {
        const errorMessage =
          error instanceof Error ? error.message : "Regeneration failed";
        updateTab((t) => ({ ...t, isLoading: false, isStreaming: false, error: errorMessage }));
      }
    } finally {
      if (activeRichAborts.get(id) === controller) {
        activeRichAborts.delete(id);
      }
    }
  },

  fetchConjugationsForTab: async (id, aiService) => {
    const tab = get().richDetailsTabs.find((t) => t.id === id);
    if (!tab || !tab.data) return;

    const updateTab = (updater: (t: RichDetailsTab) => RichDetailsTab) => {
      set((state) => ({
        richDetailsTabs: state.richDetailsTabs.map((t) =>
          t.id === id ? updater(t) : t,
        ),
      }));
    };

    const modelInfinitive = tab.data.grammar?.infinitive?.trim();
    // Never fall back to tab.text: it may be a conjugated form (e.g. "macht"),
    // which would confuse the conjugation model into guessing a different verb.
    const infinitive = modelInfinitive ?? "";
    if (!infinitive) {
      updateTab((t) => ({
        ...t,
        conjugationsError:
          "No infinitive available — the model did not identify one for this word.",
        conjugationsLoading: false,
      }));
      return;
    }

    updateTab((t) => ({
      ...t,
      conjugationsLoading: true,
      conjugationsError: null,
    }));

    try {
      const result = await aiService.getConjugationsStream(
        infinitive,
        tab.sourceLang,
        {
          onTense: (tense, rows) => {
            // Merge each tense into tab.data as it lands so the
            // table grows a row-set at a time instead of appearing
            // all at once.
            const sanitizedRows = sanitizeConjugations({ [tense]: rows });
            if (!sanitizedRows) return;
            updateTab((t) => {
              if (!t.data) return t;
              const existing = t.data.conjugations ?? {};
              return {
                ...t,
                data: {
                  ...t.data,
                  conjugations: { ...existing, ...sanitizedRows },
                },
              };
            });
          },
        },
      );
      const sanitized = sanitizeConjugations(result.conjugations);
      if (!sanitized || Object.keys(sanitized).length === 0) {
        updateTab((t) => ({
          ...t,
          conjugationsLoading: false,
          conjugationsError:
            "The model returned no conjugations for this verb.",
        }));
        return;
      }
      updateTab((t) => ({
        ...t,
        conjugationsLoading: false,
        conjugationsError: null,
        data: t.data ? { ...t.data, conjugations: sanitized } : t.data,
      }));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch conjugations";
      updateTab((t) => ({
        ...t,
        conjugationsLoading: false,
        conjugationsError: message,
      }));
    }
  },

  closeRichInfo: () => set({ isRichInfoOpen: false }),
  toggleRichInfo: () =>
    set((state) => ({ isRichInfoOpen: !state.isRichInfoOpen })),
  setSnapState: (snapState) => set({ snapState }),

  explainWordForTab: async (id, aiService) => {
    const tab = get().richDetailsTabs.find((t) => t.id === id);
    if (!tab) return;

    const updateTab = (updater: (t: RichDetailsTab) => RichDetailsTab) => {
      set((state) => ({
        richDetailsTabs: state.richDetailsTabs.map((t) =>
          t.id === id ? updater(t) : t,
        ),
      }));
    };

    updateTab((t) => ({
      ...t,
      aiExplanationLoading: true,
      aiExplanationError: null,
    }));

    try {
      const result = await aiService.explainText(
        tab.text,
        tab.sourceLang, // Request explanation in the foreign source language
        tab.context,
        tab.sourceLang,
      );
      updateTab((t) => ({
        ...t,
        aiExplanation: result,
        aiExplanationLoading: false,
      }));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to explain word";
      updateTab((t) => ({
        ...t,
        aiExplanationLoading: false,
        aiExplanationError: message,
      }));
    }
  },

  generateMoreExamplesForTab: async (id) => {
    const tab = get().richDetailsTabs.find((t) => t.id === id);
    if (!tab || !tab.data) return;

    const updateTab = (updater: (t: RichDetailsTab) => RichDetailsTab) => {
      set((state) => ({
        richDetailsTabs: state.richDetailsTabs.map((t) =>
          t.id === id ? updater(t) : t,
        ),
      }));
    };

    updateTab((t) => ({
      ...t,
      isStreaming: true,
    }));

    try {
      const existingSentencesList = (tab.data.examples || [])
        .map((ex) => ex.sentence.trim())
        .filter(Boolean);

      const model = useSettingsStore.getState().llmModel;
      const response = await ollamaApi.generateExamples({
        word: tab.text,
        definition: tab.data.translation,
        sourceLanguage: tab.sourceLang,
        targetLanguage: tab.targetLang,
        count: 3,
        existingExamples: existingSentencesList,
        model: model || undefined,
      });

      if (response && response.length > 0) {
        const newExamples = response.map((ex) => ({
          sentence: ex.sentence || "",
          translation: ex.translation || "",
        }));

        updateTab((t) => {
          if (!t.data) return t;
          return {
            ...t,
            isStreaming: false,
            data: {
              ...t.data,
              examples: [...(t.data.examples || []), ...newExamples],
            },
          };
        });
      } else {
        updateTab((t) => ({ ...t, isStreaming: false }));
      }
    } catch (err) {
      console.error("Failed to generate more examples:", err);
      updateTab((t) => ({ ...t, isStreaming: false }));
    }
  },
});
