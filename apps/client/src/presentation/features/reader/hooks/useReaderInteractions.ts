import { useCallback } from 'react';
import { SelectionMode } from '../../../../core/types';

interface UseReaderInteractionsProps {
    currentPage: number;
    PAGE_SIZE: number;
    groups: number[][];
    selectionTranslations: Map<string, string>;
    handleTokenClickAction: (index: number) => void;
    removeTranslation: (key: string, text: string, targetLang: string) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokens: any[]; // Using any[] to match usage if string[], but safe if string[]
    targetLang: string;
    translateIndices: (indices: Set<number>, force?: boolean) => void;
    regenerateHover: (index: number) => void;
    sourceLang: string;
    selectionMode: SelectionMode;
    fetchRichTranslation: (text: string, context: string) => void;
    playSingle: (text: string) => void;
}

// --- Helper Functions ---

const resolveTarget = (
    globalIndex: number,
    groups: number[][],
    tokens: any[],
    forceSingle: boolean
) => {
    const group = groups.find(g => g.includes(globalIndex));
    if (group && !forceSingle) {
        const start = group[0];
        const end = group[group.length - 1];
        return {
            text: tokens.slice(start, end + 1).join(''),
            isGroup: true,
            group
        };
    }
    return {
        text: tokens[globalIndex],
        isGroup: false,
        group: undefined
    };
};

const handleGroupInteraction = (params: {
    globalIndex: number;
    existingGroup: number[] | undefined;
    isMultiSelecting: boolean;
    selectionMode: SelectionMode;
    selectionTranslations: Map<string, string>;
    tokens: any[];
    removeTranslation: (key: string, text: string, targetLang: string) => void;
    targetLang: string;
    translateIndices: (indices: Set<number>, force?: boolean) => void;
}): boolean => {
    const {
        existingGroup,
        isMultiSelecting,
        selectionMode,
        selectionTranslations,
        globalIndex,
        tokens,
        removeTranslation,
        targetLang,
        translateIndices
    } = params;

    if (!existingGroup || isMultiSelecting) return false;

    const groupKey = `${existingGroup[0]}-${existingGroup[existingGroup.length - 1]}`;

    // 1. SPLIT LOGIC (Word Mode)
    // If in Word Mode and clicking a group (Sentence or Phrase),
    // We "Split" it: Remove the clicked word, re-translate the remainders.
    if (selectionMode === SelectionMode.Word && selectionTranslations.has(groupKey)) {
        const text = tokens.slice(existingGroup[0], existingGroup[existingGroup.length - 1] + 1).join('');
        removeTranslation(groupKey, text, targetLang);

        const remainingIndices = new Set<number>();
        existingGroup.forEach(i => {
            if (i !== globalIndex) remainingIndices.add(i);
        });

        if (remainingIndices.size > 0) {
            translateIndices(remainingIndices);
        }
        return true;
    }
    // 2. Standard Toggle (Sentence Mode or otherwise)
    // If it's a persisted translation, Remove/Toggle Off
    else if (selectionTranslations.has(groupKey)) {
        const text = tokens.slice(existingGroup[0], existingGroup[existingGroup.length - 1] + 1).join('');
        removeTranslation(groupKey, text, targetLang);
        return true;
    }

    // Fallthrough: If just a selection (green highlight), let handleTokenClickAction toggle it.
    return false;
};

const handleMergeInteraction = (params: {
    globalIndex: number;
    existingGroup: number[] | undefined;
    isMultiSelecting: boolean;
    selectionMode: SelectionMode;
    validGroups: number[][];
    translateIndices: (indices: Set<number>) => void;
}): boolean => {
    const {
        existingGroup,
        isMultiSelecting,
        selectionMode,
        validGroups,
        globalIndex,
        translateIndices
    } = params;

    // Only merge if: NOT in a group, NOT multiselecting, and IN Word selection mode
    if (existingGroup || isMultiSelecting || selectionMode !== SelectionMode.Word) return false;

    // Check for adjacent groups to merge with
    // Adjacency radius = 2 (allows for 1 intervening space/punct)
    const adjacentGroups = validGroups.filter(g => {
        const groupStart = g[0];
        const groupEnd = g[g.length - 1];
        const distLeft = globalIndex - groupEnd;
        const distRight = groupStart - globalIndex;
        // Allow distance 1 (direct neighbor) or 2 (space in between)
        return (distLeft > 0 && distLeft <= 2) || (distRight > 0 && distRight <= 2);
    });

    if (adjacentGroups.length > 0) {
        const mergedIndices = new Set<number>();
        mergedIndices.add(globalIndex); // Add clicked word
        adjacentGroups.forEach(g => g.forEach(i => mergedIndices.add(i))); // Add neighbors

        // Check for any gaps between bridged components and fill them
        const sorted = Array.from(mergedIndices).sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];

        for (let i = min; i <= max; i++) {
            // We naively fill the range (assuming single sentence intent)
            mergedIndices.add(i);
        }

        translateIndices(mergedIndices);
        return true;
    }

    return false;
};


export const useReaderInteractions = ({
    currentPage,
    PAGE_SIZE,
    groups,
    selectionTranslations,
    handleTokenClickAction,
    removeTranslation,
    tokens,
    targetLang,
    translateIndices,
    regenerateHover,
    sourceLang,
    selectionMode,
    fetchRichTranslation,
    playSingle
}: UseReaderInteractionsProps) => {

    const onTokenClick = useCallback((index: number, e: React.MouseEvent) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const isMultiSelecting = e.shiftKey || e.ctrlKey || e.metaKey;

        const validGroups = groups.filter(g => g.length > 0);
        const existingGroup = validGroups.find(g => g.includes(globalIndex));

        // 1. Try Group Interaction (Toggle/Split)
        const handledGroup = handleGroupInteraction({
            globalIndex,
            existingGroup,
            isMultiSelecting,
            selectionMode,
            selectionTranslations,
            tokens,
            removeTranslation,
            targetLang,
            translateIndices
        });

        if (handledGroup) return;

        // 2. Try Merge Interaction (Word Mode Merge)
        const handledMerge = handleMergeInteraction({
            globalIndex,
            existingGroup,
            isMultiSelecting,
            selectionMode,
            validGroups,
            translateIndices
        });

        if (handledMerge) return;

        // 3. Default Action
        handleTokenClickAction(index);

    }, [currentPage, PAGE_SIZE, groups, selectionTranslations, handleTokenClickAction, removeTranslation, tokens, targetLang, translateIndices, sourceLang, selectionMode]);

    const onMoreInfoClick = useCallback((index: number, forceSingle: boolean = false) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const { text: textToTranslate } = resolveTarget(globalIndex, groups, tokens, forceSingle);

        if (textToTranslate) {
            let startIndex = globalIndex;
            while (startIndex > 0 && !tokens[startIndex - 1].includes('\n') && !/[.!?]['"”’\)]*$/.test(tokens[startIndex - 1])) {
                startIndex--;
            }
            let endIndex = globalIndex;
            while (endIndex < tokens.length - 1 && !tokens[endIndex + 1].includes('\n') && !/[.!?]['"”’\)]*$/.test(tokens[endIndex])) {
                endIndex++;
            }
            const context = tokens.slice(startIndex, endIndex + 1).join('');
            fetchRichTranslation(textToTranslate, context);
        }
    }, [currentPage, PAGE_SIZE, groups, tokens, fetchRichTranslation]);

    const onPlayClick = useCallback((index: number, forceSingle: boolean = false) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const { text: textToPlay } = resolveTarget(globalIndex, groups, tokens, forceSingle);

        if (textToPlay) {
            playSingle(textToPlay);
        }
    }, [currentPage, PAGE_SIZE, groups, tokens, playSingle]);

    const onRegenerateClick = useCallback((index: number, forceSingle: boolean = false) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const { isGroup, group } = resolveTarget(globalIndex, groups, tokens, forceSingle);

        if (isGroup && group) {
            const indices = new Set(group);
            translateIndices(indices, true); // Force = true
        } else {
            // Single word regeneration logic
            const isAlreadySelected = selectionTranslations.has(`${globalIndex}-${globalIndex}`);

            if (isAlreadySelected) {
                const indices = new Set([globalIndex]);
                translateIndices(indices, true);
            } else {
                // Pure hover regeneration
                regenerateHover(index);
            }
        }
    }, [currentPage, PAGE_SIZE, groups, translateIndices, regenerateHover, selectionTranslations, tokens]); // Added tokens dependency for consistency though resolveTarget uses it

    return {
        onTokenClick,
        onMoreInfoClick,
        onPlayClick,
        onRegenerateClick
    };
};
