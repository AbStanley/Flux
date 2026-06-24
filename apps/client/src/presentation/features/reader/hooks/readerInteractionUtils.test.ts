import { describe, it, expect, vi } from 'vitest';
import { handleMergeInteraction } from './readerInteractionUtils';
import { SelectionMode } from '../../../../core/types';

describe('readerInteractionUtils - handleMergeInteraction', () => {
    const tokens = ["Hello", " ", "world", "\n", "New", " ", "line"];
    // Indices:
    // 0: "Hello"
    // 1: " "
    // 2: "world"
    // 3: "\n"
    // 4: "New"
    // 5: " "
    // 6: "line"

    it('should merge adjacent words on the same line', () => {
        const translateIndicesMock = vi.fn();
        const validGroups = [[0]]; // "Hello" is already in a group

        // Clicking "world" (index 2) should merge with "Hello" (index 0)
        const result = handleMergeInteraction({
            globalIndex: 2,
            existingGroup: undefined,
            isMultiSelecting: false,
            selectionMode: SelectionMode.Word,
            validGroups,
            translateIndices: translateIndicesMock,
            tokens,
        });

        expect(result).toBe(true);
        expect(translateIndicesMock).toHaveBeenCalledWith(new Set([0, 1, 2]));
    });

    it('should NOT merge words across a newline / line break', () => {
        const translateIndicesMock = vi.fn();
        const validGroups = [[2]]; // "world" (index 2) is in a group

        // Clicking "New" (index 4) should NOT merge with "world" (index 2) because index 3 is "\n"
        const result = handleMergeInteraction({
            globalIndex: 4,
            existingGroup: undefined,
            isMultiSelecting: false,
            selectionMode: SelectionMode.Word,
            validGroups,
            translateIndices: translateIndicesMock,
            tokens,
        });

        expect(result).toBe(false);
        expect(translateIndicesMock).not.toHaveBeenCalled();
    });

    it('should NOT merge if already in a group', () => {
        const translateIndicesMock = vi.fn();
        const validGroups = [[0], [2]];

        const result = handleMergeInteraction({
            globalIndex: 2,
            existingGroup: [2],
            isMultiSelecting: false,
            selectionMode: SelectionMode.Word,
            validGroups,
            translateIndices: translateIndicesMock,
            tokens,
        });

        expect(result).toBe(false);
        expect(translateIndicesMock).not.toHaveBeenCalled();
    });

    it('should NOT merge if in Sentence mode', () => {
        const translateIndicesMock = vi.fn();
        const validGroups = [[0]];

        const result = handleMergeInteraction({
            globalIndex: 2,
            existingGroup: undefined,
            isMultiSelecting: false,
            selectionMode: SelectionMode.Sentence,
            validGroups,
            translateIndices: translateIndicesMock,
            tokens,
        });

        expect(result).toBe(false);
        expect(translateIndicesMock).not.toHaveBeenCalled();
    });
});
