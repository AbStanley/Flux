import type { StateCreator } from "zustand";
import type {
  IAIService,
  RichTranslationResult,
} from "../../../../../core/interfaces/IAIService";

const isSingleToken = (text: string) => !text.trim().includes(" ");

/**
 * Client-side mirror of the server's CORE_TENSES keys. Kept here to avoid
 * speculative conjugations requests for languages the server can't answer.
 * Add a new language to both this set and CORE_TENSES when expanding.
 */
const SUPPORTED_CONJUGATION_LANGS = new Set([
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
const VERB_POS_RE = /(verb|verbo|verbe|глагол)/i;

/**
 * Nouns and adjectives don't have infinitives or grammatical tenses.
 * When the model emits BOTH of those, it's describing verb morphology
 * regardless of whatever label landed in `partOfSpeech`.
 */
const hasStrongVerbStructure = (data: RichTranslationResult): boolean => {
  const infinitive = data.grammar?.infinitive?.trim();
  const tense = data.grammar?.tense?.trim();
  return Boolean(infinitive) && Boolean(tense);
};

/**
 * Decides whether the "Show conjugations" affordance should appear.
 *
 * When the model sets `isVerb` explicitly, respect it — that's the
 * cleanest signal we have. Small models routinely emit a spurious
 * `infinitive` on real nouns (e.g. Russian "интерпретации" → "интерпре-
 * тировать", a related verb that's NOT this word) so we must NOT override
 * an explicit isVerb=false with structural evidence.
 *
 * When `isVerb` is absent, fall back to `partOfSpeech`, then to structure
 * (infinitive + tense both present). Structure-override here covers the
 * case where the model classifies a verb as "sustantivo" but still fills
 * the verb-only grammar fields.
 */
const coreLooksLikeVerb = (data: RichTranslationResult): boolean => {
  if (data.isVerb === true) return true;
  if (data.isVerb === false) return false;

  const pos = data.grammar?.partOfSpeech;
  if (typeof pos === "string" && pos.trim()) {
    if (VERB_POS_RE.test(pos)) return true;
    return hasStrongVerbStructure(data);
  }
  return hasStrongVerbStructure(data);
};

const shouldFetchConjugations = (
  data: RichTranslationResult,
  sourceLang: string,
): boolean => {
  if (!coreLooksLikeVerb(data)) return false;
  if (!sourceLang || sourceLang === "Auto") return false;
  return SUPPORTED_CONJUGATION_LANGS.has(sourceLang.toLowerCase());
};

// Re-exported so components can decide whether to render the "Show
// conjugations" affordance without duplicating the heuristic.
export { coreLooksLikeVerb, shouldFetchConjugations };

/**
 * Small models occasionally emit nested objects or `null` where a JSON
 * schema asked for strings. React refuses to render those into text nodes
 * and throws "An error occurred in the <span> component". These helpers
 * coerce unknown payloads into safe shapes before they reach the UI.
 */
const asString = (v: unknown): string | undefined =>
  typeof v === "string" ? v : undefined;

const asStringArray = (v: unknown): string[] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const strings = v.filter((x): x is string => typeof x === "string");
  return strings.length > 0 ? strings : undefined;
};

const asExampleArray = (
  v: unknown,
): RichTranslationResult["examples"] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const safe = v
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const e = entry as { sentence?: unknown; translation?: unknown };
      const sentence = asString(e.sentence);
      const translation = asString(e.translation);
      if (!sentence || !translation) return null;
      return { sentence, translation };
    })
    .filter((e): e is { sentence: string; translation: string } => e !== null);
  return safe.length > 0 ? safe : undefined;
};

const sanitizeGrammar = (
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
    infinitive: dropVerbFields ? undefined : asString(g.infinitive),
    explanation: asString(g.explanation) ?? "",
  } as RichTranslationResult["grammar"];
};

const sanitizeConjugations = (
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

/**
 * Coerce the raw rich-translation response into a render-safe shape before
 * it reaches React. Drops anything that isn't a plain string where one is
 * expected, and falls back to sensible defaults for required fields.
 */
const sanitizeRichResult = (
  raw: RichTranslationResult,
  fallbackSegment: string,
): RichTranslationResult => {
  const rawObj = raw as unknown as Record<string, unknown>;
  const isVerb = typeof raw.isVerb === "boolean" ? raw.isVerb : undefined;
  return {
    type: raw.type,
    isVerb,
    segment: asString(raw.segment) ?? fallbackSegment,
    translation: asString(raw.translation) ?? "",
    grammar: sanitizeGrammar(rawObj.grammar, isVerb),
    examples: asExampleArray(rawObj.examples) ?? [],
    alternatives: asStringArray(rawObj.alternatives) ?? [],
    syntaxAnalysis: asString(rawObj.syntaxAnalysis),
    grammarRules: asStringArray(rawObj.grammarRules),
    conjugations: sanitizeConjugations(rawObj.conjugations) ?? undefined,
  };
};

/**
 * Partial variant of sanitizeRichResult: returns only the fields that the
 * stream has successfully delivered so far. Unlike the final sanitize this
 * does NOT apply empty-string / empty-array defaults — that would clobber
 * previously-populated fields on later progressive merges.
 */
const sanitizePartialRich = (
  raw: Partial<RichTranslationResult>,
): Partial<RichTranslationResult> => {
  const r = raw as unknown as Record<string, unknown>;
  const out: Partial<RichTranslationResult> = {};
  if (raw.type) out.type = raw.type;
  const isVerb = typeof raw.isVerb === "boolean" ? raw.isVerb : undefined;
  if (typeof isVerb === "boolean") out.isVerb = isVerb;
  const segment = asString(r.segment);
  if (segment) out.segment = segment;
  const translation = asString(r.translation);
  if (translation) out.translation = translation;
  const grammar = sanitizeGrammar(r.grammar, isVerb);
  if (grammar) out.grammar = grammar;
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

export interface RichDetailsTab {
  id: string; // usually the 'text' being translated
  text: string;
  data: RichTranslationResult | null;
  isLoading: boolean;
  error: string | null;
  context: string;
  sourceLang: string;
  targetLang: string;
  /** Per-tab state for the on-demand conjugations fetch. */
  conjugationsLoading?: boolean;
  conjugationsError?: string | null;
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
}

async function runRichLoad(
  text: string,
  context: string,
  sourceLang: string,
  targetLang: string,
  aiService: IAIService,
  updateTab: (updater: (tab: RichDetailsTab) => RichDetailsTab) => void,
  syncHoverCache: (translation: string) => void,
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
      const becomeLoaded = !!next.translation || !!next.grammar;
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
    onPartial,
  });

  // Final write: run the full sanitize so missing fields get their
  // defaults (e.g. examples: []) and the UI settles on a stable shape.
  const safe = sanitizeRichResult(raw, text);
  updateTab((tab) => ({
    ...tab,
    data: safe,
    isLoading: false,
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
      );
    } catch (error: unknown) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load";
      updateTab((tab) => ({ ...tab, isLoading: false, error: errorMessage }));
    }
  },

  closeTab: (id) => {
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
    set({
      richDetailsTabs: [],
      activeTabId: null,
      isRichInfoOpen: false,
    });
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

    updateTab((t) => ({ ...t, data: null, isLoading: true, error: null }));

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
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Regeneration failed";
      updateTab((t) => ({ ...t, isLoading: false, error: errorMessage }));
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
    const infinitive =
      modelInfinitive || (isSingleToken(tab.text) ? tab.text.trim() : "");
    if (!infinitive) {
      updateTab((t) => ({
        ...t,
        conjugationsError:
          "No infinitive available — can't fetch conjugations.",
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
});
