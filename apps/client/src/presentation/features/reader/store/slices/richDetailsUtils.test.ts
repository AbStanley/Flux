import { describe, it, expect } from "vitest";
import { asString, sanitizeGrammar, asExampleArray, stripPronounPrefix } from "./richDetailsUtils";
import { isSameLanguage } from "./richDetailsHealer";

describe("richDetailsUtils", () => {
  describe("stripPronounPrefix", () => {
    it("should strip simple pronouns", () => {
      expect(stripPronounPrefix("er wollte")).toBe("wollte");
      expect(stripPronounPrefix("yo hablo")).toBe("hablo");
      expect(stripPronounPrefix("he wanted")).toBe("wanted");
    });

    it("should strip compound or slash-separated pronouns", () => {
      expect(stripPronounPrefix("er/sie/es wollte")).toBe("wollte");
      expect(stripPronounPrefix("il/elle/on voulait")).toBe("voulait");
      expect(stripPronounPrefix("er, sie, es wollte")).toBe("wollte");
      expect(stripPronounPrefix("er (sie, es) wollte")).toBe("wollte");
    });

    it("should strip French elided pronouns", () => {
      expect(stripPronounPrefix("j'aime")).toBe("aime");
    });

    it("should not strip if the word is only a pronoun", () => {
      expect(stripPronounPrefix("es")).toBe("es");
      expect(stripPronounPrefix("he")).toBe("he");
    });

    it("should not strip pronouns embedded in other words", () => {
      expect(stripPronounPrefix("hello")).toBe("hello");
    });
  });

  describe("asString sanitizer", () => {

    it("should return valid strings", () => {
      expect(asString("hello")).toBe("hello");
      expect(asString("  verb  ")).toBe("  verb  ");
    });

    it("should filter out placeholders", () => {
      expect(asString("n/a")).toBeUndefined();
      expect(asString("N/A")).toBeUndefined();
      expect(asString("  none  ")).toBeUndefined();
      expect(asString("null")).toBeUndefined();
      expect(asString("undefined")).toBeUndefined();
      expect(asString("")).toBeUndefined();
      expect(asString("   ")).toBeUndefined();
    });

    it("should return undefined for non-strings", () => {
      expect(asString(null)).toBeUndefined();
      expect(asString(undefined)).toBeUndefined();
      expect(asString(123)).toBeUndefined();
      expect(asString({})).toBeUndefined();
    });
  });

  describe("sanitizeGrammar", () => {
    it("should drop placeholders and return clean structures", () => {
      const rawGrammar = {
        partOfSpeech: "noun",
        tense: "n/a",
        gender: "none",
        sourceInfinitive: "n/a",
        explanation: "definition here",
      };

      const result = sanitizeGrammar(rawGrammar, false);
      expect(result).toBeDefined();
      expect(result?.partOfSpeech).toBe("noun");
      expect(result?.tense).toBeUndefined();
      expect(result?.gender).toBeUndefined();
      expect(result?.infinitive).toBeUndefined();
      expect(result?.explanation).toBe("definition here");
    });
  });

  describe("asExampleArray", () => {
    it("should parse valid examples across scripts", () => {
      const input = [
        { sentence: "Кот на коврике.", translation: "The cat is on the rug." },
        { sentence: "El perro corre.", translation: "The dog runs." }
      ];
      expect(asExampleArray(input)).toEqual(input);
    });

    it("should keep same-language copies (to be healed by the store)", () => {
      const input = [
        { sentence: "El doctor corre.", translation: "El doctor corre." }
      ];
      expect(asExampleArray(input)).toEqual(input);
    });

    it("should keep highly overlapping translations (to be healed by the store)", () => {
      const input = [
        { sentence: "The big house on the hill", translation: "The big house on the hill." }
      ];
      expect(asExampleArray(input)).toEqual(input);
    });

    it("should keep valid translations with cognates or common names", () => {
      const input = [
        { sentence: "Maria vive en un hotel.", translation: "Maria lives in a hotel." }
      ];
      expect(asExampleArray(input)).toEqual(input);
    });

    it("should resolve dynamic language-specific keys and map them back to standard properties", () => {
      const input = [
        { english_sentence: "The cat is on the rug.", german_translation: "Die Katze ist auf dem Teppich." }
      ];
      const expected = [
        { sentence: "The cat is on the rug.", translation: "Die Katze ist auf dem Teppich." }
      ];
      expect(asExampleArray(input)).toEqual(expected);
    });
  });

  describe("isSameLanguage helper", () => {
    it("should return true for identical sentences", () => {
      expect(isSameLanguage("El doctor corre.", "El doctor corre.")).toBe(true);
    });

    it("should return true for highly overlapping sentences (punctuation variations)", () => {
      expect(isSameLanguage("The big house on the hill", "The big house on the hill.")).toBe(true);
    });

    it("should return false for distinct sentences in different languages", () => {
      expect(isSameLanguage("The cat is on the rug.", "Die Katze ist auf dem Teppich.")).toBe(false);
      expect(isSameLanguage("Maria vive en un hotel.", "Maria lives in a hotel.")).toBe(false);
    });
  });
});
