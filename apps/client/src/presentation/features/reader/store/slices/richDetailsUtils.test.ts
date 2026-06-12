import { describe, it, expect } from "vitest";
import { asString, sanitizeGrammar } from "./richDetailsUtils";

describe("richDetailsUtils", () => {
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
});
