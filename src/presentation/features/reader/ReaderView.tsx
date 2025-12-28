import React from 'react';
import styles from './ReaderView.module.css';
import { Card, CardContent } from "../../components/ui/card";
import { useReader } from './hooks/useReader';
import { ReaderPagination } from './components/ReaderPagination';
import { ReaderToken } from './components/ReaderToken';

interface ReaderViewProps {
    text: string;
    sourceLang: string;
    targetLang: string;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ text, sourceLang, targetLang }) => {
    const {
        paginatedTokens,
        currentPage,
        totalPages,
        selectedIndices,
        hoveredIndex,
        hoverTranslation,
        selectionTranslations,
        PAGE_SIZE,
        setCurrentPage,
        handleTokenClick,
        handleMouseEnter,
        handleMouseLeave,
        getSelectionGroups
    } = useReader({ text, sourceLang, targetLang });

    // Calculate grouping for rendering
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
                            <ReaderToken
                                key={index}
                                index={index}
                                token={token}
                                isSelected={isSelected}
                                isHovered={isHovered}
                                isWhitespace={isWhitespace}
                                groupTranslation={groupTranslation}
                                position={position}
                                hoverTranslation={hoverTranslation}
                                onClick={handleTokenClick}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            />
                        );
                    })}
                </div>

                <ReaderPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </CardContent>
        </Card>
    );
};



