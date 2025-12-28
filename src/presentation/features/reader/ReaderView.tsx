import React, { useState, useEffect } from 'react';
import { useServices } from '../../contexts/ServiceContext';
import styles from './ReaderView.module.css';

interface ReaderViewProps {
    text: string;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ text }) => {
    const { aiService } = useServices();
    const [tokens, setTokens] = useState<string[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [hoverTranslation, setHoverTranslation] = useState<string | null>(null);
    // Map group key "start-end" to translation
    const [selectionTranslations, setSelectionTranslations] = useState<Map<string, string>>(new Map());

    const [sourceLang, setSourceLang] = useState<string>('Auto');
    const [targetLang, setTargetLang] = useState<string>('English');

    // Tokenize text on change, preserving whitespace
    useEffect(() => {
        // Split by whitespace but keep delimiters.
        setTokens(text.split(/(\s+)/));
        setSelectedIndices(new Set());
        setSelectionTranslations(new Map());
    }, [text]);

    const handleTokenClick = (index: number) => {
        const token = tokens[index];
        if (!token.trim()) return; // Ignore whitespace clicks

        const newSelection = new Set(selectedIndices);
        if (newSelection.has(index)) {
            newSelection.delete(index);
        } else {
            newSelection.add(index);
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

    const translateSelections = async (indices: Set<number>) => {
        const groups = getSelectionGroups(indices);
        const newTranslations = new Map<string, string>();

        await Promise.all(groups.map(async (group) => {
            if (group.length === 0) return;
            const start = group[0];
            const end = group[group.length - 1];
            const key = `${start}-${end}`;

            // Check if we already have a translation for this exact group (not perfect caching but helps)
            // Ideally should check content, but key is safe enough for current session reset on text change.
            // Actually, let's just re-fetch to be safe or maybe simple cache?
            // For now, re-fetch to ensure context updates if context relies on grouping (though it usually doesn't).

            // Correctly reconstruct the text by including the whitespace between the start and end of the group
            const textToTranslate = tokens.slice(start, end + 1).join('');

            // Get context from the full sentence(s) the group spans
            // Simplify: just get context of the first word for now, or merge contexts.
            // Usually words are in the same sentence.
            const context = getContextForIndex(start);

            try {
                // Determine if we need to trim the input or if tokens include whitespace (split keeps whitespace)
                // textToTranslate might look like "word " or " word". 
                // We should probably strip leading/trailing whitespace for the translation payload, but keep it for display if needed.
                const cleanText = textToTranslate.trim();

                const result = await aiService.translateText(cleanText, undefined, context);
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
        const token = tokens[index];
        if (!token.trim()) return;

        setHoveredIndex(index);
        hoverRef.current = index;

        const context = getContextForIndex(index);

        try {
            const result = await aiService.translateText(token, undefined, context);
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
    groups.forEach(group => {
        const start = group[0];
        const end = group[group.length - 1];
        const key = `${start}-${end}`;
        const translation = selectionTranslations.get(key);
        if (translation) {
            groupStarts.set(start, translation);
        }
    });

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <label>
                    Source:
                    <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                        <option value="Auto">Auto Detect</option>
                        <option value="Spanish">Spanish</option>
                        <option value="English">English</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Italian">Italian</option>
                        <option value="Japanese">Japanese</option>
                    </select>
                </label>
                <label>
                    Target:
                    <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Italian">Italian</option>
                        <option value="Japanese">Japanese</option>
                    </select>
                </label>
            </div>

            <div className={styles.textArea}>
                {tokens.map((token, index) => {
                    const isSelected = selectedIndices.has(index);
                    const isHovered = hoveredIndex === index;
                    const isWhitespace = !token.trim();
                    const groupTranslation = groupStarts.get(index);

                    return (
                        <span
                            key={index}
                            className={`
                                ${styles.token} 
                                ${isSelected ? styles.selected : ''} 
                                ${!isWhitespace ? styles.interactive : ''}
                            `}
                            onClick={() => !isWhitespace && handleTokenClick(index)}
                            onMouseEnter={() => !isWhitespace && handleMouseEnter(index)}
                            onMouseLeave={handleMouseLeave}
                            style={{ position: 'relative' }}
                        >
                            {/* Selection Translation Popup - Rendered at start of group */}
                            {isValidAndPresent(groupTranslation) && (
                                <span className={styles.selectionPopupValid}>
                                    {groupTranslation}
                                </span>
                            )}

                            {token}

                            {/* Hover Popup */}
                            {isHovered && hoverTranslation && !isSelected && (
                                <span className={styles.hoverPopup}>{hoverTranslation}</span>
                            )}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

function isValidAndPresent(str: string | undefined): boolean {
    return !!str;
}
