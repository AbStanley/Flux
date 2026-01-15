import { memo } from 'react';
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
    handleTokenClick: (index: number, e: React.MouseEvent) => void;
    onMoreInfoClick: (index: number, forceSingle?: boolean) => void;
    onPlayClick: (index: number, forceSingle?: boolean) => void;
    onRegenerateClick: (index: number, forceSingle?: boolean) => void; // New Prop
    showTranslations: boolean;
}

const ReaderTextContentComponent = ({
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
    onRegenerateClick,
    showTranslations
}: ReaderTextContentProps) => {
    // State Consumption
    const hoveredIndex = useTranslationStore(s => s.hoveredIndex);
    const hoverSource = useTranslationStore(s => s.hoverSource);
    const hoverTranslation = useTranslationStore(s => s.hoverTranslation);
    const currentWordIndex = useAudioStore(s => s.currentWordIndex);
    const seek = useAudioStore(s => s.seek);

    // Actions
    const { handleHover, clearHover } = useTranslation();

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

                // isHoveredSentence includes:
                // 1. Rich Info highlights (highlightIndices)
                // 2. The group containing the currently hovered word (handled inside useHighlighting)
                // We rely solely on highlightIndices now as it already contains the group logic.
                const isHoveredSentence = highlightIndices.has(globalIndex);

                // If we are highlighting a full sentence group, we generally DON'T want the specific word 
                // under the cursor to look different (darker) IF IT'S FROM THE POPUP.
                // But if the user explicitly hovers the token ('token' source), we DO want the single word highlight to appear.
                const isHoveredWord = (hoveredIndex === globalIndex) && hoverSource === 'token';
                const isAudioHighlighted = currentWordIndex === globalIndex;

                if (isHoveredSentence) {
                    // We need to check neighbors based on the SAME logic
                    const checkIsHovered = (idx: number) => highlightIndices.has(idx);

                    const prev = checkIsHovered(globalIndex - 1);
                    const next = checkIsHovered(globalIndex + 1);

                    if (!prev && !next) hoverPosition = HoverPosition.Single;
                    else if (!prev && next) hoverPosition = HoverPosition.Start;
                    else if (prev && next) hoverPosition = HoverPosition.Middle;
                    else if (prev && !next) hoverPosition = HoverPosition.End;
                }

                // Correctly identify the end of the group for this specific token's group
                let groupEndId: string | undefined;
                let groupText: string | undefined;

                if (groupTranslation) {
                    // Find the group this token belongs to
                    const group = groups.find(g => g.includes(globalIndex));
                    if (group) {
                        const lastIndex = group[group.length - 1];
                        groupEndId = `token-${lastIndex}`;
                        groupText = group
                            .map(gIdx => tokens[gIdx])
                            .filter(t => t !== undefined)
                            .join('');
                    }
                }

                return (
                    <ReaderToken
                        key={index}
                        index={index}
                        globalIndex={globalIndex}
                        token={token}
                        groupText={groupText} // Pass the full text
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
                        onRegenerate={onRegenerateClick}
                    />
                );
            })}
        </div>
    );
};

export const ReaderTextContent = memo(ReaderTextContentComponent);
