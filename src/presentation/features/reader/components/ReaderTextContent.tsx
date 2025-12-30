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
    onMoreInfoClick: (index: number) => void;
    onPlayClick: (index: number) => void;
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
    onPlayClick
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

    return (
        <div
            ref={textAreaRef}
            className={`${styles.textArea} p-8 min-[1200px]:p-12 pb-12`}
        >
            {paginatedTokens.map((token, index) => {
                const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
                // Prefer visual split translation, fallback (should cover initial render) to basic group start
                const groupTranslation = visualGroupStarts.get(globalIndex) || groupStarts.get(globalIndex);
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

                return (
                    <ReaderToken
                        key={index}
                        index={index}
                        globalIndex={globalIndex}
                        token={token}
                        groupTranslation={groupTranslation}
                        position={position}
                        isHovered={isHoveredSentence} // Now represents the full sentence hover
                        isHoveredWord={isHoveredWord} // Specific word
                        hoverPosition={hoverPosition}
                        hoverTranslation={isHoveredWord ? (hoverTranslation || undefined) : undefined}
                        isAudioHighlighted={isAudioHighlighted}
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
