import { SelectionMode } from '../../../../core/types';

/** Strip leading/trailing punctuation from text so lookups are clean */
export const stripPunctuation = (s: string): string =>
    s.replace(/^[\s.,;:!?¡¿"""''«»()[\]{}\-–—…]+|[\s.,;:!?¡¿"""''«»()[\]{}\-–—…]+$/g, '');

export const resolveTarget = (
    globalIndex: number,
    groups: number[][],
    tokens: string[],
    forceSingle: boolean
) => {
    const group = groups.find(g => g.includes(globalIndex));
    if (group && !forceSingle) {
        const start = group[0];
        const end = group[group.length - 1];
        return {
            text: stripPunctuation(tokens.slice(start, end + 1).join('')),
            isGroup: true,
            group
        };
    }
    return {
        text: stripPunctuation(tokens[globalIndex]),
        isGroup: false,
        group: undefined
    };
};

export const handleGroupInteraction = (params: {
    globalIndex: number;
    existingGroup: number[] | undefined;
    isMultiSelecting: boolean;
    selectionMode: SelectionMode;
    selectionTranslations: Map<string, string>;
    tokens: string[];
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

export const handleMergeInteraction = (params: {
    globalIndex: number;
    existingGroup: number[] | undefined;
    isMultiSelecting: boolean;
    selectionMode: SelectionMode;
    validGroups: number[][];
    translateIndices: (indices: Set<number>) => void;
    tokens: string[];
}): boolean => {
    const {
        existingGroup,
        isMultiSelecting,
        selectionMode,
        validGroups,
        globalIndex,
        translateIndices,
        tokens
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
        if ((distLeft > 0 && distLeft <= 2) || (distRight > 0 && distRight <= 2)) {
            const minIdx = Math.min(globalIndex, groupStart);
            const maxIdx = Math.max(globalIndex, groupEnd);
            
            for (let i = minIdx; i < maxIdx; i++) {
                if (/[.!?;:…]["'»\]})]*\s*$/.test(tokens[i])) {
                    return false;
                }
            }
            for (let i = minIdx + 1; i <= maxIdx; i++) {
                if (/^\s*["'«[{(]*[¡¿]/.test(tokens[i])) {
                    return false;
                }
            }
            return true;
        }
        return false;
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
