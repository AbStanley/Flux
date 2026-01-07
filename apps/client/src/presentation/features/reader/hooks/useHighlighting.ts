import { useMemo } from 'react';
import { useReaderStore } from '../store/useReaderStore';
import { useTranslationStore } from '../store/useTranslationStore';
import { SelectionMode } from '../../../../core/types';
import { getSentenceRange } from '../../../../core/utils/text-utils';


export const useHighlighting = (tokens: string[], groups: number[][], richTranslation: any) => {
    const hoveredIndex = useTranslationStore(s => s.hoveredIndex);
    const selectionMode = useReaderStore(s => s.selectionMode);

    // Optimized Lookup Map: Token Index -> Group Indices
    // Re-calculated only when groups change
    const tokenToGroupMap = useMemo(() => {
        const map = new Map<number, number[]>();
        groups.forEach(group => {
            // Map every index in the group to the full group array
            group.forEach(index => {
                map.set(index, group);
            });
        });
        return map;
    }, [groups]);

    const highlightIndices = useMemo(() => {
        if (hoveredIndex === null || hoveredIndex === undefined || hoveredIndex === -1) {
            return new Set<number>();
        }

        // 1. Priority: Check if hovered index is part of an existing selection group via optimized map
        const existingGroup = tokenToGroupMap.get(hoveredIndex);
        if (existingGroup) {
            const min = existingGroup[0];
            const max = existingGroup[existingGroup.length - 1];
            // Create range to ensure gaps (like spaces) are included
            // efficient enough for typical sentence lengths
            const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);
            return new Set(range);
        }

        // 2. Fallback based on Selection Mode
        if (selectionMode === SelectionMode.Sentence) {
            // Highlight full sentence in Sentence Mode
            const range = getSentenceRange(hoveredIndex, tokens);
            return new Set(range);
        } else {
            // Just the word in Word Mode
            return new Set([hoveredIndex]);
        }
    }, [hoveredIndex, tokens, richTranslation, tokenToGroupMap, selectionMode]);

    return highlightIndices;
};
