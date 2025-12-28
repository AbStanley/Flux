import React, { useState, useEffect } from 'react';
import { useServices } from '../../contexts/ServiceContext';
import styles from './ReaderView.module.css';
import { Card, CardContent } from "../../components/ui/card";

interface ReaderViewProps {
    text: string;
    sourceLang: string;
    targetLang: string;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ text, sourceLang, targetLang }) => {
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

            // Get context from the full sentence(s) the group spans
            const context = getContextForIndex(start);

            try {
                // Determine if we need to trim the input or if tokens include whitespace (split keeps whitespace)
                const cleanText = textToTranslate.trim();

                const result = await aiService.translateText(cleanText, targetLang, context, sourceLang);
                newTranslations.set(key, result);
            } catch (e) {
                console.error(e);
                newTranslations.set(key, "Error");
            }
        }));

        setSelectionTranslations(newTranslations);
    };

    const hoverRef = React.useRef<number | null>(null);

    const handleMouseEnter = async (index: number) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const token = tokens[globalIndex];
        if (!token.trim()) return;

        setHoveredIndex(index);
        hoverRef.current = index;

        const context = getContextForIndex(index);

        try {
            const result = await aiService.translateText(token, targetLang, context, sourceLang);
            if (hoverRef.current === index) {
                setHoverTranslation(result);
            }
        } catch (e) {
            // ignore
        }
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
        setHoverTranslation(null);
        hoverRef.current = null;
    };

    // Calculate grouping for rendering
    // We want to know which token starts a group to render the popup
    const groups = getSelectionGroups(selectedIndices);
    const groupStarts = new Map<number, string>(); // index -> translation

    // Map to store position of each token in a group for styling
    // 'single' | 'start' | 'middle' | 'end'
    const tokenPositions = new Map<number, string>();
    const visualSelectedIndices = new Set(selectedIndices);

    groups.forEach(group => {
        const start = group[0];
        const end = group[group.length - 1];
        const key = `${start}-${end}`;
        const translation = selectionTranslations.get(key);
        if (translation) {
            groupStarts.set(start, translation);
        }

        // Iterate through the full range including whitespace
        for (let i = start; i <= end; i++) {
            visualSelectedIndices.add(i);

            if (start === end) {
                tokenPositions.set(i, 'single');
            } else if (i === start) {
                tokenPositions.set(i, 'start');
            } else if (i === end) {
                tokenPositions.set(i, 'end');
            } else {
                tokenPositions.set(i, 'middle');
            }
        }
    });

    return (
        <Card className="h-full border-none shadow-sm bg-card/50 backdrop-blur-sm max-w-4xl mx-auto my-8">
            <CardContent className="p-8 md:p-12">
                <div className={styles.textArea}>
                    {paginatedTokens.map((token, index) => {
                        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
                        const isSelected = visualSelectedIndices.has(globalIndex);
                        const isHovered = hoveredIndex === index;
                        const isWhitespace = !token.trim();
                        const groupTranslation = groupStarts.get(globalIndex);
                        const position = tokenPositions.get(globalIndex);

                        return (
                            <span
                                key={index}
                                className={`
                                    ${styles.token} 
                                    ${isSelected ? styles.selected : ''} 
                                    ${!isWhitespace ? styles.interactive : ''}
                                    ${position ? styles[position] : ''}
                                `}
                                onClick={() => !isWhitespace && handleTokenClick(index)}
                                onMouseEnter={() => !isWhitespace && handleMouseEnter(index)}
                                onMouseLeave={handleMouseLeave}
                                style={{ position: 'relative' }}
                            >
                                {groupTranslation && (
                                    <span className={styles.selectionPopupValid}>
                                        {groupTranslation}
                                    </span>
                                )}

                                {token}

                                {isHovered && hoverTranslation && !isSelected && (
                                    <span className={styles.hoverPopup}>{hoverTranslation}</span>
                                )}
                            </span>
                        );
                    })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 py-6 mt-4 border-t border-border/40">
                        <button
                            className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <span className="text-sm text-muted-foreground font-mono">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


