import { useMemo } from 'react';

export const useReaderGroups = (
    selectedIndices: Set<number>,
    getSelectionGroups: (indices: Set<number>) => number[][],
    selectionTranslations: Map<string, string>
) => {
    const selectionGroups = useMemo(() => getSelectionGroups(selectedIndices), [getSelectionGroups, selectedIndices]);

    const groups = useMemo(() => {
        // Convert persisted translations into group arrays
        const translationGroups: number[][] = [];
        selectionTranslations.forEach((_, key) => {
            const [start, end] = key.split('-').map(Number);
            const group: number[] = [];
            for (let i = start; i <= end; i++) {
                group.push(i);
            }
            translationGroups.push(group);
        });

        // Combine and deduplicate based on start-end key
        const combined = [...selectionGroups, ...translationGroups];
        const uniqueKeys = new Set<string>();
        const uniqueGroups: number[][] = [];

        for (const g of combined) {
            if (g.length === 0) continue;
            const key = `${g[0]}-${g[g.length - 1]}`;
            if (!uniqueKeys.has(key)) {
                uniqueKeys.add(key);
                uniqueGroups.push(g);
            }
        }
        return uniqueGroups;
    }, [selectionGroups, selectionTranslations]);

    return groups;
};
