import type { IAIService } from "../../../../../core/interfaces/IAIService";
import type { RichDetailsTab } from "./richDetailsSlice";

export const isSameLanguage = (sentence: string, translation: string): boolean => {
  const cleanWords = (t: string) =>
    t
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?'"]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 1);

  const wSrc = cleanWords(sentence);
  const wTgt = cleanWords(translation);
  if (wSrc.length === 0 || wTgt.length === 0) return false;

  const setSrc = new Set(wSrc);
  let common = 0;
  for (const w of wTgt) {
    if (setSrc.has(w)) common++;
  }
  return common / Math.max(wSrc.length, wTgt.length) > 0.85;
};

export async function healExamples(
  examples: Array<{ sentence: string; translation: string }>,
  word: string,
  sourceLang: string,
  targetLang: string,
  aiService: IAIService,
  updateTab: (updater: (tab: RichDetailsTab) => RichDetailsTab) => void,
): Promise<void> {
  if (!examples || examples.length === 0) return;

  const promises = examples.map(async (ex, index) => {
    if (!isSameLanguage(ex.sentence, ex.translation)) return null;

    const containsSegment = ex.sentence.toLowerCase().includes(word.toLowerCase().trim());
    try {
      if (containsSegment) {
        const res = await aiService.translateText(ex.sentence, targetLang, undefined, sourceLang);
        const translated = typeof res === "string" ? res : res?.response ?? "";
        if (translated) {
          return { index, sentence: ex.sentence, translation: translated };
        }
      } else {
        const res = await aiService.translateText(ex.translation, sourceLang, undefined, targetLang);
        const translated = typeof res === "string" ? res : res?.response ?? "";
        if (translated) {
          return { index, sentence: translated, translation: ex.translation };
        }
      }
    } catch (err) {
      console.error("[RichDetailsHealer] Failed to heal example:", err);
    }
    return null;
  });

  const results = await Promise.all(promises);
  const cleanResults = results.filter(
    (r): r is { index: number; sentence: string; translation: string } => r !== null,
  );
  if (cleanResults.length === 0) return;

  updateTab((tab) => {
    if (!tab.data || !tab.data.examples) return tab;
    const nextExamples = [...tab.data.examples];
    for (const res of cleanResults) {
      if (nextExamples[res.index]) {
        nextExamples[res.index] = {
          sentence: res.sentence,
          translation: res.translation,
        };
      }
    }
    return {
      ...tab,
      data: {
        ...tab.data,
        examples: nextExamples,
      },
    };
  });
}
