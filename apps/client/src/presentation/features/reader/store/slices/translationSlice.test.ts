import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createTranslationSlice } from './translationSlice';
import type { TranslationSlice } from './translationSlice';
import type { IAIService } from '../../../../../core/interfaces/IAIService';

const createTestStore = () => create<TranslationSlice>((...a) => ({
    ...createTranslationSlice(...a),
}));

describe('translationSlice - merge selection sequence', () => {
    let store: ReturnType<typeof createTestStore>;
    let mockAiService: IAIService;

    const tokens = ["war", " ", "viel", " ", "kleiner", " ", "und", " ", "hatte", " ", "eine", " ", "seltsame", ","];
    // Indices:
    // 0: war
    // 1: (space)
    // 2: viel
    // 3: (space)
    // 4: kleiner
    // 5: (space)
    // 6: und
    // 7: (space)
    // 8: hatte
    // 9: (space)
    // 10: eine
    // 11: (space)
    // 12: seltsame
    // 13: ,

    beforeEach(() => {
        store = createTestStore();
        mockAiService = {
            translateText: vi.fn().mockImplementation(async (text: string) => {
                if (text === "war") return "era";
                if (text === "viel") return "mucho";
                if (text === "kleiner und hatte eine seltsame,") return "más pequeño y tenía una forma";
                if (text === "war viel") return "era mucho";
                if (text === "war viel kleiner und hatte eine seltsame,") return "era mucho más pequeño y tenía una forma";
                return `translated: ${text}`;
            }),
        } as unknown as IAIService;
    });

    it('should result in a single translation key 0-13 when war (0) is selected after viel (2) and smaller group (4-13) are translated', async () => {
        // 1. Translate "viel" (index 2)
        await store.getState().translateSelection(new Set([2]), tokens, "German", "Spanish", mockAiService);
        expect(store.getState().selectionTranslations.get("2-2")).toBe("mucho");

        // 2. Translate "kleiner und hatte eine seltsame," (indices 4 to 13)
        await store.getState().translateSelection(new Set([4, 6, 8, 10, 12, 13]), tokens, "German", "Spanish", mockAiService);
        expect(store.getState().selectionTranslations.get("4-13")).toBe("más pequeño y tenía una forma");

        // 3. User clicks "war" (index 0). 
        // In the UI, handleMergeInteraction merges 0 with the adjacent 2-2 group, resulting in {0, 1, 2}.
        // So it calls translateSelection with indices {0, 1, 2}.
        await store.getState().translateSelection(new Set([0, 1, 2]), tokens, "German", "Spanish", mockAiService);
        
        // This should delete "2-2" and add "0-2" -> "era mucho"
        expect(store.getState().selectionTranslations.has("2-2")).toBe(false);
        expect(store.getState().selectionTranslations.get("0-2")).toBe("era mucho");
        // "4-13" should still be there because it is not a subset of 0-2 (it ends at 13, 0-2 ends at 2)
        expect(store.getState().selectionTranslations.get("4-13")).toBe("más pequeño y tenía una forma");

        // 4. Now, the user clicks "viel" (index 2) again to bridge 0-2 and 4-13 into a single sentence.
        // Wait, index 2 is already selected (in group 0-2).
        // Let's say they click index 3 (the space) or index 2?
        // Wait! In the UI:
        // Group A is 0-2, Group B is 4-13.
        // When they select index 3 (the space) or index 2 (by deselecting/selecting)?
        // Wait, if 10-12 is group A, and 14-22 (index 4-13 here) is group B.
        // The word "viel" was index 2. It is already in group 0-2.
        // How do they form the whole sentence?
        // Ah! If they click a word in group 4-13, e.g. "kleiner" (index 4) or "war" (index 0)?
        // Wait! If they click "war" (index 0) which is already in 0-2, it toggles it.
        // Let's trace how the user actually clicks to merge 0-2 and 4-13.
        // If they click index 2 (which is part of 0-2) or index 4 (which is part of 4-13)?
        // Wait! If they shift-click, or if they select the space in between?
        // In standard mode, spaces in between are NOT clickable because of `isWhitespace`.
        // So they must click either a word in 0-2 or a word in 4-13.
        // Wait! If they click a word that is already in a group, it toggles/splits it.
        // So how can they merge 0-2 and 4-13?
        // Wait! If they click index 2 (viel) to deselect it:
        // - It splits 0-2 into 0-0.
        // - Now they have 0-0 and 4-13.
        // - Now they click 2 (viel) again to select it.
        // - 2 is adjacent to 0-0 and adjacent to 4-13.
        // - So it merges all of them into {0..13}!
        // Let's run this exact sequence!
        
        // Deselect index 2 (viel) from group 0-2
        // Group key is "0-2". existingGroup is [0, 1, 2].
        // removeTranslation("0-2")
        store.getState().removeTranslation("0-2", tokens.slice(0, 3).join(''), "Spanish");
        // translateIndices({0})
        await store.getState().translateSelection(new Set([0]), tokens, "German", "Spanish", mockAiService);

        expect(store.getState().selectionTranslations.get("0-0")).toBe("era");
        expect(store.getState().selectionTranslations.get("4-13")).toBe("más pequeño y tenía una forma");

        // Now select index 2 (viel) again.
        // adjacentGroups filters: [0-0] (adjacent to 2) and [4-13] (adjacent to 2).
        // Merges them into {0..13}.
        // Calls translateIndices({0..13}).
        await store.getState().translateSelection(new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]), tokens, "German", "Spanish", mockAiService);

        console.log("TEST OUTPUT - selectionTranslations keys:", Array.from(store.getState().selectionTranslations.keys()));
        console.log("TEST OUTPUT - selectionTranslations entries:", Array.from(store.getState().selectionTranslations.entries()));
    });
});
