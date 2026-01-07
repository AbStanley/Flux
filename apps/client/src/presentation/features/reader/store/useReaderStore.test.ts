import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useReaderStore } from './useReaderStore';
import { SelectionMode } from '../../../../core/types';
import { useTranslationStore } from './useTranslationStore';

// Mock useTranslationStore
vi.mock('./useTranslationStore', () => {
    return {
        useTranslationStore: {
            getState: vi.fn(),
        },
    };
});

describe('useReaderStore', () => {
    const mockCloseRichInfo = vi.fn();
    const mockClearSelectionTranslations = vi.fn();

    beforeEach(() => {
        // Reset mocks
        mockCloseRichInfo.mockReset();
        mockClearSelectionTranslations.mockReset();
        (useTranslationStore.getState as any).mockReturnValue({
            closeRichInfo: mockCloseRichInfo,
            clearSelectionTranslations: mockClearSelectionTranslations,
        });

        // Reset store state
        useReaderStore.setState({
            tokens: [],
            currentPage: 1,
            selectedIndices: new Set(),
            text: "",
            sourceLang: "Spanish",
            targetLang: "English",
            isReading: false,
            isGenerating: false,
            PAGE_SIZE: 500,
            selectionMode: SelectionMode.Word,
        });
    });

    it('should have initial state', () => {
        const state = useReaderStore.getState();
        expect(state.tokens).toEqual([]);
        expect(state.text).toBe("");
        expect(state.currentPage).toBe(1);
    });

    it('setConfig should update state and reset selection', () => {
        const text = "Hello world";
        useReaderStore.getState().setConfig(text, "French", "German");

        const state = useReaderStore.getState();
        expect(state.text).toBe(text);
        expect(state.sourceLang).toBe("French");
        expect(state.targetLang).toBe("German");
        // "Hello" (0), " " (1), "world" (2) -> split by (\s+)
        expect(state.tokens).toEqual(["Hello", " ", "world"]);
        expect(mockCloseRichInfo).toHaveBeenCalled();
        expect(mockClearSelectionTranslations).toHaveBeenCalled();
    });

    it('setText should update tokens and reset selection', () => {
        const text = "Test text";
        useReaderStore.getState().setText(text);

        const state = useReaderStore.getState();
        expect(state.text).toBe(text);
        expect(state.tokens).toEqual(["Test", " ", "text"]);
        expect(mockCloseRichInfo).toHaveBeenCalled();
    });

    it('setPage should verify bounds', () => {
        // Create enough tokens for 3 pages (PAGE_SIZE = 500)
        // 1500 tokens
        const tokens = new Array(1500).fill("a");
        useReaderStore.setState({ tokens });

        useReaderStore.getState().setPage(2);
        expect(useReaderStore.getState().currentPage).toBe(2);

        useReaderStore.getState().setPage(5); // Out of bounds (max 3)
        expect(useReaderStore.getState().currentPage).toBe(3);

        useReaderStore.getState().setPage(0); // Out of bounds (min 1)
        expect(useReaderStore.getState().currentPage).toBe(1);
    });

    describe('Selection Logic', () => {
        it('should toggle word selection in Word mode', async () => {
            useReaderStore.setState({
                tokens: ["A", " ", "B", " ", "C"],
                selectionMode: SelectionMode.Word
            });

            // Select "A" (0)
            await useReaderStore.getState().handleSelection(0);
            expect(useReaderStore.getState().selectedIndices.has(0)).toBe(true);

            // Select "B" (2)
            await useReaderStore.getState().handleSelection(2);
            expect(useReaderStore.getState().selectedIndices.has(2)).toBe(true);
            expect(useReaderStore.getState().selectedIndices.size).toBe(2);

            // Deselect "A" (0)
            await useReaderStore.getState().handleSelection(0);
            expect(useReaderStore.getState().selectedIndices.has(0)).toBe(false);
        });

        it('should handle orphan deselection logic', async () => {
            // Scenario: "A" (0), " " (1), "B" (2).
            useReaderStore.setState({
                tokens: ["A", " ", "B"],
                selectionMode: SelectionMode.Word,
                selectedIndices: new Set([0, 1, 2])
            });

            // Deselect "A" (0). " " (1) is still adjacent to selected "B" (2), so it remains.
            await useReaderStore.getState().handleSelection(0);
            expect(useReaderStore.getState().selectedIndices.has(1)).toBe(true);

            // Deselect "B" (2). " " (1) is now orphaned (not adjacent to any selection), should be deselected.
            await useReaderStore.getState().handleSelection(2);
            expect(useReaderStore.getState().selectedIndices.has(1)).toBe(false);
            expect(useReaderStore.getState().selectedIndices.size).toBe(0);
        });

        it('should select entire sentence in Sentence mode', async () => {
            const tokens = ["Hello", " ", "world", ".", " ", "Next"];
            useReaderStore.setState({
                tokens,
                selectionMode: SelectionMode.Sentence
            });

            // Click "world" (2). Should select "Hello world." (indices 0-3)
            await useReaderStore.getState().handleSelection(2);
            const indices = Array.from(useReaderStore.getState().selectedIndices).sort((a, b) => a - b);
            expect(indices).toEqual([0, 1, 2, 3]);

            // Click same token to deselect
            await useReaderStore.getState().handleSelection(2);
            expect(useReaderStore.getState().selectedIndices.size).toBe(0);
        });

        it('should handle sentence selection toggling correctly', async () => {
            // Scenario: Sentence 1 is selected. Click a word in Sentence 1 again.
            const tokens = ["Run", ".", " ", "Jump", "."];
            useReaderStore.setState({
                tokens,
                selectionMode: SelectionMode.Sentence,
                selectedIndices: new Set([0, 1]) // "Run." selected
            });

            // Click "Run" (0). Should deselect [0, 1].
            await useReaderStore.getState().handleSelection(0);
            expect(useReaderStore.getState().selectedIndices.size).toBe(0);
        });
    });
});
