import { useMemo } from 'react';

interface UseTokenStylingParams {
    groups: number[][];
    selectionTranslations: Map<string, string>;
}

interface UseTokenStylingResult {
    groupStarts: Map<number, string>;
    tokenPositions: Map<number, string>;
}

export const useTokenStyling = ({ groups, selectionTranslations }: UseTokenStylingParams): UseTokenStylingResult => {
    return useMemo(() => {
        const starts = new Map<number, string>(); // index -> translation
        const positions = new Map<number, string>();

        groups.forEach(group => {
            const start = group[0];
            const end = group[group.length - 1];
            const key = `${start}-${end}`;
            const translation = selectionTranslations.get(key);
            if (translation) {
                starts.set(start, translation);
            }

            // Iterate through the full range including whitespace
            for (let i = start; i <= end; i++) {
                if (start === end) {
                    positions.set(i, 'single');
                } else if (i === start) {
                    positions.set(i, 'start');
                } else if (i === end) {
                    positions.set(i, 'end');
                } else {
                    positions.set(i, 'middle');
                }
            }
        });
        return { groupStarts: starts, tokenPositions: positions };
    }, [groups, selectionTranslations]);
};
