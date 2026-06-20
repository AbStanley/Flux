import { useCallback } from 'react';
import { SelectionMode } from '../../../../core/types';
import { getContextForIndex } from '../store/slices/translationUtils';
import {
    resolveTarget,
    handleGroupInteraction,
    handleMergeInteraction
} from './readerInteractionUtils';

interface UseReaderInteractionsProps {
    currentPage: number;
    PAGE_SIZE: number;
    groups: number[][];
    selectionTranslations: Map<string, string>;
    handleTokenClickAction: (index: number) => void;
    removeTranslation: (key: string, text: string, targetLang: string) => void;
    tokens: string[];
    targetLang: string;
    translateIndices: (indices: Set<number>, force?: boolean) => void;
    regenerateHover: (index: number) => void;
    sourceLang: string;
    selectionMode: SelectionMode;
    fetchRichTranslation: (text: string, context: string) => void;
    playSingle: (text: string) => void;
    clearSelection: () => void;
}

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
    selectionMode,
    fetchRichTranslation,
    playSingle,
    clearSelection
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

        if (handledGroup) {
            clearSelection();
            return;
        }

        // 2. Try Merge Interaction (Word Mode Merge)
        const handledMerge = handleMergeInteraction({
            globalIndex,
            existingGroup,
            isMultiSelecting,
            selectionMode,
            validGroups,
            translateIndices,
            tokens
        });

        if (handledMerge) {
            clearSelection();
            return;
        }

        // 3. Default Action
        handleTokenClickAction(index);

    }, [currentPage, PAGE_SIZE, groups, selectionTranslations, handleTokenClickAction, removeTranslation, tokens, targetLang, translateIndices, selectionMode, clearSelection]);

    const onMoreInfoClick = useCallback((globalIndex: number, forceSingle: boolean = false) => {
        const { text: textToTranslate } = resolveTarget(globalIndex, groups, tokens, forceSingle);

        if (textToTranslate) {
            const context = getContextForIndex(tokens, globalIndex);
            fetchRichTranslation(textToTranslate, context);
        }
    }, [groups, tokens, fetchRichTranslation]);

    const onPlayClick = useCallback((globalIndex: number, forceSingle: boolean = false) => {
        const { text: textToPlay } = resolveTarget(globalIndex, groups, tokens, forceSingle);

        if (textToPlay) {
            playSingle(textToPlay);
        }
    }, [groups, tokens, playSingle]);

    const onRegenerateClick = useCallback((globalIndex: number, forceSingle: boolean = false) => {
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
                const localIndex = globalIndex - (currentPage - 1) * PAGE_SIZE;
                regenerateHover(localIndex);
            }
        }
    }, [currentPage, PAGE_SIZE, groups, translateIndices, regenerateHover, selectionTranslations, tokens]);

    return {
        onTokenClick,
        onMoreInfoClick,
        onPlayClick,
        onRegenerateClick
    };
};

