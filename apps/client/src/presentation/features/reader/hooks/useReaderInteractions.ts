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
    sourceLang: string;
    selectionMode: SelectionMode;
    fetchRichTranslation: (text: string, context: string) => void;
    playSingle: (text: string) => void;
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
    sourceLang,
    selectionMode,
    fetchRichTranslation,
    playSingle
}: UseReaderInteractionsProps) => {

    const onTokenClick = useCallback((index: number, e: React.MouseEvent) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const isMultiSelecting = e.shiftKey || e.ctrlKey || e.metaKey;

        // 1. Check if clicking inside an existing group (Toggle/Select logic)
        // We look at 'groups' which includes both persisted and active selections
        const validGroups = groups.filter(g => g.length > 0);
        const existingGroup = validGroups.find(g => g.includes(globalIndex));

        if (existingGroup && !isMultiSelecting) {
            // Identifier for this group (if persisted)
            const groupKey = `${existingGroup[0]}-${existingGroup[existingGroup.length - 1]}`;

            // 1a. SAFETY GUARD (Word Mode):
            // If we are in Word Mode, and the user clicks a Multi-Word Translation (Sentence),
            // DO NOT Remove/Toggle it off. This prevents accidental destruction of sentence views.
            // We just let it fall through to 'handleTokenClickAction' (select word) or do nothing.
            // 1a. SPLIT LOGIC (Word Mode):
            // If in Word Mode and clicking a group (Sentence or Phrase),
            // We "Split" it: Remove the clicked word, re-translate the remainders.
            if (selectionMode === SelectionMode.Word && selectionTranslations.has(groupKey)) {
                // 1. Remove the original translation
                const text = tokens.slice(existingGroup[0], existingGroup[existingGroup.length - 1] + 1).join('');
                removeTranslation(groupKey, text, targetLang);

                // 2. Calculate remaining indices
                const remainingIndices = new Set<number>();
                existingGroup.forEach(i => {
                    if (i !== globalIndex) remainingIndices.add(i);
                });

                // 3. Trigger translation for remainders (if any)
                if (remainingIndices.size > 0) {
                    translateIndices(remainingIndices);
                }
                return;
            }
            // 1b. Standard Toggle (Sentence Mode or otherwise)
            else if (selectionTranslations.has(groupKey)) {
                // If it's a persisted translation, Remove/Toggle Off
                // Reconstruct text for cache seeding
                const text = tokens.slice(existingGroup[0], existingGroup[existingGroup.length - 1] + 1).join('');
                removeTranslation(groupKey, text, targetLang);
                return;
            }

            // If it's just a selection (green highlight), fall through to default properties (toggle/deselect)
            // handleTokenClickAction will handle toggling it off.
        }

        // 2. Click-to-Extend/Merge Logic (Only if NOT multi-selecting, NOT clicking inside existing, AND in WORD mode)
        // In Sentence mode, we want distinct selections, not auto-merging of sentences.
        if (!existingGroup && !isMultiSelecting && selectionMode === SelectionMode.Word) {
            // Check for adjacent groups to merge with
            // Adjacency radius = 2 (allows for 1 intervening space/punct)
            const adjacentGroups = validGroups.filter(g => {
                const groupStart = g[0];
                const groupEnd = g[g.length - 1];
                // Check dist to left or right
                const distLeft = globalIndex - groupEnd;
                const distRight = groupStart - globalIndex;

                // Allow distance 1 (direct neighbor) or 2 (space in between)
                return (distLeft > 0 && distLeft <= 2) || (distRight > 0 && distRight <= 2);
            });

            if (adjacentGroups.length > 0) {
                // MERGE STRATEGY
                const mergedIndices = new Set<number>();
                mergedIndices.add(globalIndex); // Add clicked word

                adjacentGroups.forEach(g => g.forEach(i => mergedIndices.add(i))); // Add neighbors

                // Check for any gaps between bridged components and fill them
                // (e.g. if we merge [0] and [2], ensure [1] is added if it's gap material)
                const sorted = Array.from(mergedIndices).sort((a, b) => a - b);
                const min = sorted[0];
                const max = sorted[sorted.length - 1];

                for (let i = min; i <= max; i++) {
                    // We naively fill the range. 
                    // Since we validated adjacency, we assume the user satisfies the "single sentence" intent.
                    mergedIndices.add(i);
                }

                // Trigger Translation for the new merged group
                // Trigger Translation for the new merged group
                translateIndices(mergedIndices);
                return;
            }
        }

        handleTokenClickAction(index);
    }, [currentPage, PAGE_SIZE, groups, selectionTranslations, handleTokenClickAction, removeTranslation, tokens, targetLang, translateIndices, sourceLang, selectionMode]);

    const onMoreInfoClick = useCallback((index: number, forceSingle: boolean = false) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const group = groups.find(g => g.includes(globalIndex));
        let textToTranslate = "";

        if (group && !forceSingle) {
            const start = group[0];
            const end = group[group.length - 1];
            textToTranslate = tokens.slice(start, end + 1).join('');
        } else {
            textToTranslate = tokens[globalIndex];
        }

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
        const group = groups.find(g => g.includes(globalIndex));
        let textToPlay = "";

        if (group && !forceSingle) {
            const start = group[0];
            const end = group[group.length - 1];
            textToPlay = tokens.slice(start, end + 1).join('');
        } else {
            textToPlay = tokens[globalIndex];
        }

        if (textToPlay) {
            playSingle(textToPlay);
        }
    }, [currentPage, PAGE_SIZE, groups, tokens, playSingle]);

    const onRegenerateClick = useCallback((index: number) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const group = groups.find(g => g.includes(globalIndex));

        if (group) {
            const indices = new Set(group);
            translateIndices(indices, true); // Force = true
        } else {
            // Single word regeneration
            const indices = new Set([globalIndex]);
            translateIndices(indices, true);
        }
    }, [currentPage, PAGE_SIZE, groups, translateIndices]);

    return {
        onTokenClick,
        onMoreInfoClick,
        onPlayClick,
        onRegenerateClick
    };
};
