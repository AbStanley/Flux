import { memo } from 'react';
import styles from '../ReaderView.module.css';
import { ReaderToken } from './ReaderToken';
import { HoverPosition, SelectionMode } from '../../../../core/types';

import { useTranslationStore } from '../store/useTranslationStore';
import { useAudioStore } from '../store/useAudioStore';
import { useTranslation } from '../hooks/useTranslation';
import { useHighlighting } from '../hooks/useHighlighting';
import { useSettingsStore, FONT_FAMILY_MAP, FONT_SIZE_MAP } from '../../settings/store/useSettingsStore';

import { usePopupGroups } from '../hooks/usePopupGroups';
import { useCentralLayout } from '../hooks/useCentralLayout';
import { parseTitleAndSpaces } from '../utils/tokenUtils';

interface ReaderTextContentProps {
    tokens: string[]; // Needed for highlighting logic
    paginatedTokens: string[];
    groups: number[][]; // Needed for highlighting

    currentPage: number;
    PAGE_SIZE: number;
    selectionMode: SelectionMode; // Updated: Needed for display logic
    visualGroupStarts: Map<number, string>;
    groupStarts: Map<number, string>;
    tokenPositions: Map<number, string>;
    textAreaRef: React.RefObject<HTMLDivElement | null>;
    handleTokenClick: (index: number, e: React.MouseEvent) => void;
    onMoreInfoClick: (globalIndex: number, forceSingle?: boolean) => void;
    onPlayClick: (globalIndex: number, forceSingle?: boolean) => void;
    onRegenerateClick: (globalIndex: number, forceSingle?: boolean) => void;
    showTranslations: boolean;
}

const ReaderTextContentComponent = ({
    tokens,
    paginatedTokens,
    groups,
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

    const { popupGroups, suppressedPopupIndices } = usePopupGroups({
        groups,
        selectionTranslations: useTranslationStore(s => s.selectionTranslations),
        visualGroupStarts,
        groupStarts,
        tokens,
        currentPage,
        PAGE_SIZE,
        textAreaRef
    });

    // Reader Settings
    const font = useSettingsStore(s => s.font);
    const fontSize = useSettingsStore(s => s.fontSize);

    // Highlighting Logic (Local to this component now)
    const highlightIndices = useHighlighting(tokens, groups);

    // Call centralized layout hook to position all popups deterministically
    useCentralLayout({
        tokens,
        groups,
        visualGroupStarts,
        groupStarts,
        currentPage,
        showTranslations,
        hoveredIndex,
        hoverTranslation,
        hoverSource,
        textAreaRef,
        popupGroups
    });

    const { headerParams, skipSpaceIndices } = parseTitleAndSpaces(paginatedTokens);

    return (
        <div
            ref={textAreaRef}
            className={styles.textArea}
            style={{
                fontFamily: FONT_FAMILY_MAP[font],
                fontSize: FONT_SIZE_MAP[fontSize],
            }}
        >
            {paginatedTokens.map((token, index) => {
                const globalIndex = (currentPage - 1) * PAGE_SIZE + index;

                // Title Detection Logic
                const isHeaderMarker = /^#+$/.test(token.trim());
                if (isHeaderMarker) {
                    return null; // Hide the marker itself
                }

                if (skipSpaceIndices.has(index)) {
                    return null;
                }

                // Capture the current title state for this token
                const isTitleToken = headerParams.has(index);

                // Prefer visual split translation, fallback (should cover initial render) to basic group start
                const visualTrans = visualGroupStarts.get(globalIndex) || groupStarts.get(globalIndex);
                // Respect global show/hide switch
                const groupTranslation = showTranslations ? visualTrans : undefined;

                const position = tokenPositions.get(globalIndex);

                const isHoveredSentence = highlightIndices.has(globalIndex);
                const isHoveredWord = (hoveredIndex === globalIndex) && hoverSource === 'token';
                const isAudioHighlighted = currentWordIndex === globalIndex;

                let hoverPosition: HoverPosition | undefined;
                if (isHoveredSentence) {
                    const prev = highlightIndices.has(globalIndex - 1);
                    const next = highlightIndices.has(globalIndex + 1);
                    if (!prev && !next) hoverPosition = HoverPosition.Single;
                    else if (!prev) hoverPosition = HoverPosition.Start;
                    else if (!next) hoverPosition = HoverPosition.End;
                    else hoverPosition = HoverPosition.Middle;
                }

                let groupText: string | undefined;
                if (groupTranslation) {
                    const group = groups.find(g => g[0] === globalIndex);
                    if (group) {
                        groupText = group.map(gIdx => tokens[gIdx]).filter(Boolean).join('');
                    }
                }

                const popupGroupItems = popupGroups.get(globalIndex);
                const isPopupSuppressed = suppressedPopupIndices.has(globalIndex);

                return (
                    <ReaderToken
                        key={index}
                        index={index}
                        globalIndex={globalIndex}
                        token={token}
                        groupText={groupText} // Pass the full text
                        groupTranslation={groupTranslation}
                        position={position}
                        isHovered={isHoveredSentence} // Now represents the full sentence hover
                        isHoveredWord={isHoveredWord} // Specific word
                        hoverPosition={hoverPosition}
                        hoverTranslation={isHoveredWord ? (hoverTranslation || undefined) : undefined}
                        isAudioHighlighted={isAudioHighlighted}
                        isTitle={isTitleToken}
                        onClick={handleTokenClick}
                        onHover={handleHover}
                        onClearHover={clearHover}
                        onMoreInfo={onMoreInfoClick}
                        onPlay={onPlayClick}
                        onSeek={seek}
                        onRegenerate={onRegenerateClick}
                        popupGroupItems={popupGroupItems}
                        isPopupSuppressed={isPopupSuppressed}
                    />
                );
            })}
        </div>
    );
};

export const ReaderTextContent = memo(ReaderTextContentComponent);
