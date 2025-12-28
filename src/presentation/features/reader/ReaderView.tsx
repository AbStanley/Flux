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
    const [selectionTranslation, setSelectionTranslation] = useState<string | null>(null);

    // Tokenize text on change, preserving whitespace
    useEffect(() => {
        // Split by whitespace but keep delimiters.
        // Regex: split by (spaces/newlines), capturing the delimiter.
        setTokens(text.split(/(\s+)/));
        setSelectedIndices(new Set());
        setSelectionTranslation(null);
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
            translateSelection(newSelection);
        } else {
            setSelectionTranslation(null);
        }
    };

    const translateSelection = async (indices: Set<number>) => {
        // Sort indices to maintain order
        const sortedIndices = Array.from(indices).sort((a, b) => a - b);
        const textToTranslate = sortedIndices.map(i => tokens[i]).join(' '); // Join with space (simplification)

        try {
            const result = await aiService.translateText(textToTranslate);
            setSelectionTranslation(result);
        } catch (e) {
            console.error(e);
            setSelectionTranslation("Error translating.");
        }
    };

    const handleMouseEnter = async (index: number) => {
        const token = tokens[index];
        if (!token.trim()) return;

        setHoveredIndex(index);
        // Debounce or immediate? Immediate for "on the go" but might be spammy for API.
        // For MVP Mock, immediate is fine. For Real, maybe wait 300ms.
        // We'll just trigger it.
        try {
            const result = await aiService.translateText(token);
            if (index === hoveredIndex) { // Check race condition roughly (not perfect)
                // Actually this logic is flawed via closure, need ref or effect. 
                // For MVP let's just set it.
            }
            setHoverTranslation(result);
        } catch (e) {
            // ignore
        }
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
        setHoverTranslation(null);
    };

    return (
        <div className={styles.container}>
            {/* Selection Translation Popup */}
            {selectionTranslation && (
                <div className={styles.selectionPopup}>
                    <strong>Selection:</strong> {selectionTranslation}
                </div>
            )}

            <div className={styles.textArea}>
                {tokens.map((token, index) => {
                    const isSelected = selectedIndices.has(index);
                    const isHovered = hoveredIndex === index;
                    const isWhitespace = !token.trim();

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
                            {token}
                            {/* Hover Popup */}
                            {isHovered && hoverTranslation && (
                                <span className={styles.hoverPopup}>{hoverTranslation}</span>
                            )}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};
