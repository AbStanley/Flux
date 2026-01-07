import React, { memo } from 'react';
import styles from '../ReaderView.module.css';
import { ReaderToken } from './ReaderToken';
import { HoverPosition } from '../../../../core/types';

import { useTranslationStore } from '../store/useTranslationStore';
import { useAudioStore } from '../store/useAudioStore';
import { useTranslation } from '../hooks/useTranslation';
import { useHighlighting } from '../hooks/useHighlighting';

import { SelectionMode } from '../../../../core/types';

interface ReaderTextContentProps {
    tokens: string[]; // Needed for highlighting logic
    paginatedTokens: string[];
    groups: number[][]; // Needed for highlighting
    richTranslation: any; // Needed for highlighting
    currentPage: number;
    PAGE_SIZE: number;
    selectionMode: SelectionMode; // Updated: Needed for display logic
    visualGroupStarts: Map<number, string>;
    groupStarts: Map<number, string>;
    tokenPositions: Map<number, string>;
    textAreaRef: React.RefObject<HTMLDivElement | null>;
    handleTokenClick: (index: number) => void;
    onMoreInfoClick: (index: number, forceSingle?: boolean) => void;
    onPlayClick: (index: number, forceSingle?: boolean) => void;
    showTranslations: boolean;
}

const ReaderTextContentComponent: React.FC<ReaderTextContentProps> = ({
    tokens,
    paginatedTokens,
    groups,
    richTranslation,
    currentPage,
    PAGE_SIZE,
    visualGroupStarts,
    groupStarts,
    tokenPositions,
    textAreaRef,
    handleTokenClick,
    onMoreInfoClick,
    onPlayClick,
    showTranslations
}) => {
    // State Consumption
    const hoveredIndex = useTranslationStore(s => s.hoveredIndex);
    const hoverTranslation = useTranslationStore(s => s.hoverTranslation);
    const currentWordIndex = useAudioStore(s => s.currentWordIndex);
    const seek = useAudioStore(s => s.seek);

    // Actions
    const { handleHover, clearHover, regenerateSelection } = useTranslation();

    // Highlighting Logic (Local to this component now)
    const highlightIndices = useHighlighting(tokens, groups, richTranslation);

    // Track title state across tokens (linear scan)
    let inTitle = false;
    let skipNextSpace = false;

    return (
        <div
            ref={textAreaRef}
            className={styles.textArea}
        >
            {paginatedTokens.map((token, index) => {
                const globalIndex = (currentPage - 1) * PAGE_SIZE + index;

                // Title Detection Logic
                const isHeaderMarker = /^#+$/.test(token.trim());
                if (isHeaderMarker) {
                    inTitle = true;
                    skipNextSpace = true;
                    return null; // Hide the marker itself
                }

                // If we just saw a header, we want to skip the immediate next space
                // so the title starts flush left (or centered) without a leading space
                if (skipNextSpace) {
                    if (!token.trim()) {
                        skipNextSpace = false;
                        return null; // Hide the space
                    }
                    // If we hit non-whitespace, stop skipping but render this token
                    skipNextSpace = false;
                }

                // Capture the current title state for this token
                const isTitleToken = inTitle;

                if (token.includes('\n')) {
                    inTitle = false;
                }

                // Prefer visual split translation, fallback (should cover initial render) to basic group start
                const visualTrans = visualGroupStarts.get(globalIndex) || groupStarts.get(globalIndex);
                // Respect global show/hide switch
                const groupTranslation = showTranslations ? visualTrans : undefined;

                const position = tokenPositions.get(globalIndex);

                // Calculate hover position
                let hoverPosition: HoverPosition | undefined;
                const isHoveredSentence = highlightIndices.has(globalIndex);
                const isHoveredWord = (hoveredIndex === globalIndex);
                const isAudioHighlighted = currentWordIndex === globalIndex;

                if (isHoveredSentence) {
                    const prev = highlightIndices.has(globalIndex - 1);
                    const next = highlightIndices.has(globalIndex + 1);

                    if (!prev && !next) hoverPosition = HoverPosition.Single;
                    else if (!prev && next) hoverPosition = HoverPosition.Start;
                    else if (prev && next) hoverPosition = HoverPosition.Middle;
                    else if (prev && !next) hoverPosition = HoverPosition.End;
                }

                // Correctly identify the end of the group for this specific token's group
                let groupEndId: string | undefined;
                if (groupTranslation) {
                    // Find the group this token belongs to
                    const group = groups.find(g => g.includes(globalIndex));
                    if (group) {
                        const lastIndex = group[group.length - 1];
                        groupEndId = `token-${lastIndex}`;
                    }
                }

                return (
                    <ReaderToken
                        key={index}
                        index={index}
                        globalIndex={globalIndex}
                        token={token}
                        groupTranslation={groupTranslation}
                        position={position}
                        groupEndId={groupEndId} // Passed for width calculation
                        isHovered={isHoveredSentence} // Now represents the full sentence hover
                        isHoveredWord={isHoveredWord} // Specific word
                        hoverPosition={hoverPosition}
                        hoverTranslation={isHoveredWord ? (hoverTranslation || undefined) : undefined}
                        isAudioHighlighted={isAudioHighlighted}
                        isTitle={isTitleToken}
                        containerRef={textAreaRef}
                        onClick={handleTokenClick}
                        onHover={handleHover}
                        onClearHover={clearHover}
                        onMoreInfo={onMoreInfoClick}
                        onPlay={onPlayClick}
                        onSeek={seek}
                        onRegenerate={() => regenerateSelection(globalIndex)}
                    />
                );
            })}
        </div>
    );
};

export const ReaderTextContent = memo(ReaderTextContentComponent);
