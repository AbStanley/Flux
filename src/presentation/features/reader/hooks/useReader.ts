import { useState, useEffect, useRef } from 'react';
import { useServices } from '../../../contexts/ServiceContext';

interface UseReaderProps {
    text: string;
    sourceLang: string;
    targetLang: string;
}

export const useReader = ({ text, sourceLang, targetLang }: UseReaderProps) => {
    const { aiService } = useServices();
    const [tokens, setTokens] = useState<string[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [hoverTranslation, setHoverTranslation] = useState<string | null>(null);
    // Map group key "start-end" to translation
    const [selectionTranslations, setSelectionTranslations] = useState<Map<string, string>>(new Map());

    // Pagination
    const PAGE_SIZE = 500;
    const [currentPage, setCurrentPage] = useState(1);
    const [paginatedTokens, setPaginatedTokens] = useState<string[]>([]);

    // Calculate total pages
    const totalPages = Math.ceil(tokens.length / PAGE_SIZE);

    // Tokenize text on change, preserving whitespace
    useEffect(() => {
        // Split by whitespace but keep delimiters.
        const allTokens = text.split(/(\s+)/);
        setTokens(allTokens);
        setCurrentPage(1);
        setSelectedIndices(new Set());
        setSelectionTranslations(new Map());
    }, [text]);

    useEffect(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE;
        setPaginatedTokens(tokens.slice(startIndex, endIndex));
    }, [tokens, currentPage]);

    const handleTokenClick = (index: number) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const token = tokens[globalIndex];
        if (!token.trim()) return; // Ignore whitespace clicks

        const newSelection = new Set(selectedIndices);
        if (newSelection.has(globalIndex)) {
            newSelection.delete(globalIndex);
        } else {
            newSelection.add(globalIndex);
        }
        setSelectedIndices(newSelection);

        // Trigger translation for selection
        if (newSelection.size > 0) {
            translateSelections(newSelection);
        } else {
            setSelectionTranslations(new Map());
        }
    };

    // Helper to extract context (current line) for a given token index
    const getContextForIndex = (index: number): string => {
        if (index < 0 || index >= tokens.length) return '';

        let startIndex = index;
        while (startIndex > 0 && !tokens[startIndex - 1].includes('\n')) {
            startIndex--;
        }

        let endIndex = index;
        while (endIndex < tokens.length - 1 && !tokens[endIndex + 1].includes('\n')) {
            endIndex++;
        }

        return tokens.slice(startIndex, endIndex + 1).join('');
    };

    const getSelectionGroups = (indices: Set<number>): number[][] => {
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
    };

    const fetchTranslation = async (text: string, context: string): Promise<string | null> => {
        if (!text.trim()) return null;
        try {
            return await aiService.translateText(text.trim(), targetLang, context, sourceLang);
        } catch (error: any) {
            return `Translation Error: ${error.message || 'Unknown failure'}`;
        }
    };

    const translateSelections = async (indices: Set<number>) => {
        const groups = getSelectionGroups(indices);
        // Create a new map for the current valid groups
        const newTranslations = new Map<string, string>();

        await Promise.all(groups.map(async (group) => {
            if (group.length === 0) return;
            const start = group[0];
            const end = group[group.length - 1];
            const key = `${start}-${end}`;

            // Check if we already have a translation for this exact group
            if (selectionTranslations.has(key)) {
                newTranslations.set(key, selectionTranslations.get(key)!);
                return;
            }

            // Correctly reconstruct the text by including the whitespace between the start and end of the group
            const textToTranslate = tokens.slice(start, end + 1).join('');
            const context = getContextForIndex(start);

            const result = await fetchTranslation(textToTranslate, context);
            newTranslations.set(key, result ?? "Error: Translation failed");
        }));

        setSelectionTranslations(newTranslations);
    };

    const hoverRef = useRef<number | null>(null);

    const handleMouseEnter = async (index: number) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const token = tokens[globalIndex];
        if (!token.trim()) return;

        setHoveredIndex(index);
        hoverRef.current = index;

        const context = getContextForIndex(globalIndex);
        const result = await fetchTranslation(token, context);

        if (hoverRef.current === index && result) {
            setHoverTranslation(result);
        }
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
        setHoverTranslation(null);
        hoverRef.current = null;
    };

    return {
        // State
        tokens,
        paginatedTokens,
        currentPage,
        totalPages,
        selectedIndices,
        hoveredIndex,
        hoverTranslation,
        selectionTranslations,
        PAGE_SIZE,

        // Actions
        setCurrentPage,
        handleTokenClick,
        handleMouseEnter,
        handleMouseLeave,
        getSelectionGroups
    };
};
