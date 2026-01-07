import { useMemo, useCallback } from 'react';

import { useReaderStore } from '../store/useReaderStore';

export const useReader = () => {


    // Store Selectors
    const tokens = useReaderStore(state => state.tokens);
    const currentPage = useReaderStore(state => state.currentPage);
    const PAGE_SIZE = useReaderStore(state => state.PAGE_SIZE);

    // Derived State (Selector logic or computed here)
    const paginatedTokens = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return tokens.slice(start, start + PAGE_SIZE);
    }, [tokens, currentPage, PAGE_SIZE]);

    const totalPages = Math.ceil(tokens.length / PAGE_SIZE);

    // Simple State Selectors
    const selectedIndices = useReaderStore(state => state.selectedIndices);
    const selectionMode = useReaderStore(state => state.selectionMode);
    const sourceLang = useReaderStore(state => state.sourceLang);

    // Actions
    // Actions
    const setPage = useReaderStore(state => state.setPage);
    const handleSelection = useReaderStore(state => state.handleSelection);

    // View Event Handlers
    const handleTokenClick = useCallback((index: number) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        handleSelection(globalIndex);
    }, [currentPage, PAGE_SIZE, handleSelection]);


    // Duplicate helper for View rendering (pure visual logic)
    const getSelectionGroups = useCallback((indices: Set<number>): number[][] => {
        const sorted = Array.from(indices).sort((a, b) => a - b);
        if (sorted.length === 0) return [];

        const groups: number[][] = [];
        let currentGroup: number[] = [sorted[0]];

        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];

            // Check if there are only whitespace tokens between prev and curr
            let isContiguous = true;
            for (let k = prev + 1; k < curr; k++) {
                if (tokens[k].trim().length > 0) {
                    isContiguous = false;
                    break;
                }
                // Break on newline
                if (tokens[k].includes('\n')) {
                    isContiguous = false;
                    break;
                }
            }

            if (isContiguous && /[.!?]['"”’\)]*$/.test(tokens[prev].trim())) {
                isContiguous = false;
            }

            if (isContiguous) {
                currentGroup.push(curr);
            } else {
                groups.push(currentGroup);
                currentGroup = [curr];
            }
        }
        groups.push(currentGroup);
        return groups;
    }, [tokens]);



    return {
        // State
        tokens,
        paginatedTokens,
        currentPage,
        totalPages,
        selectedIndices,
        PAGE_SIZE,
        selectionMode,
        sourceLang,

        // Actions
        setCurrentPage: setPage,
        handleTokenClick,
        getSelectionGroups
    };
};
