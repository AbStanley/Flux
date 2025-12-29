
import React, { useRef } from 'react';
import styles from './ReaderView.module.css';
import { Card, CardContent } from "../../components/ui/card";
import { useReader } from './hooks/useReader';
import { useTranslation } from './hooks/useTranslation';
import { useVisualSplits } from './hooks/useVisualSplits';
import { useReaderStore, getSentenceRange } from './store/useReaderStore';
import { useTranslationStore } from './store/useTranslationStore';
import { SelectionMode, HoverPosition } from '../../../core/types';
import { ReaderPagination } from './components/ReaderPagination';
import { ReaderToken } from './components/ReaderToken';
import { RichInfoPanel } from './components/RichInfoPanel';

import { useAudioStore } from './store/useAudioStore';
import { PlayerControls } from './components/PlayerControls';

export const ReaderView: React.FC = () => {
    const {
        tokens,
        paginatedTokens,
        currentPage,
        totalPages,
        selectedIndices,
        PAGE_SIZE,
        setCurrentPage,
        handleTokenClick,
        getSelectionGroups
    } = useReader();

    // Translation Hook
    const {
        selectionTranslations,
        richTranslation,
        isRichInfoOpen,
        isRichInfoLoading,
        fetchRichTranslation,
        closeRichInfo
    } = useTranslation(true);

    // Audio Store consumption
    const { playSingle } = useAudioStore();

    // Calculate grouping for rendering
    const groups = getSelectionGroups(selectedIndices);
    const groupStarts = new Map<number, string>(); // index -> translation

    // Map to store position of each token in a group for styling
    // 'single' | 'start' | 'middle' | 'end'
    const tokenPositions = new Map<number, string>();

    // Visual Translation Splitting Logic
    const textAreaRef = useRef<HTMLDivElement>(null);
    const visualGroupStarts = useVisualSplits({
        groups,
        selectionTranslations,
        paginatedTokens, // Note: Hook signature asked for this but didn't strictly use it for logic other than deps, passing ensures correctness
        currentPage,
        PAGE_SIZE,
        textAreaRef
    });




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

    const hoveredIndex = useTranslationStore(s => s.hoveredIndex);

    const highlightIndices = React.useMemo(() => {
        if (hoveredIndex === null || hoveredIndex === undefined || hoveredIndex === -1 || richTranslation) return new Set<number>();

        const selectionMode = useReaderStore.getState().selectionMode;

        if (selectionMode === SelectionMode.Sentence) {
            // Highlight full sentence in Sentence Mode
            const range = getSentenceRange(hoveredIndex, tokens);
            return new Set(range);
        } else {
            // Just the word in Word Mode
            return new Set([hoveredIndex]);
        }
    }, [hoveredIndex, tokens, richTranslation]);



    // Better More Info handler:
    const onMoreInfoClick = (index: number) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;

        // Check if this token is part of a selected group
        // groups is a list of [start, ... end] arrays
        const group = groups.find(g => g.includes(globalIndex));

        let textToTranslate = "";

        if (group) {
            const start = group[0];
            const end = group[group.length - 1];
            // Slice full tokens to get the phrase
            textToTranslate = tokens.slice(start, end + 1).join('');
        } else {
            // Fallback to single token (e.g. if hovered but not selected, though UI only shows default button on selection usually? 
            // Actually hover popup also returns onMoreInfo.
            textToTranslate = tokens[globalIndex];
        }

        if (textToTranslate) {
            fetchRichTranslation(textToTranslate, "");
        }
    };

    const onPlayClick = (index: number) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const group = groups.find(g => g.includes(globalIndex));

        let textToPlay = "";

        if (group) {
            const start = group[0];
            const end = group[group.length - 1];
            textToPlay = tokens.slice(start, end + 1).join('');
        } else {
            textToPlay = tokens[globalIndex];
        }

        if (textToPlay) {
            playSingle(textToPlay);
        }
    };

    return (
        <div className="relative flex flex-col min-[1200px]:flex-row w-full h-[90vh] min-[1200px]:h-[92vh] max-w-full mx-auto my-4 transition-all duration-300 gap-6">
            {/* Center Column: Reading Card */}
            <Card className="flex-1 h-full border-none shadow-sm glass overflow-hidden flex flex-col">
                <CardContent className={`p-0 relative flex-1 overflow-y-auto ${styles.textAreaContainer} flex flex-col`}>

                    {/* Player Controls - Sticky Top */}
                    <div className="sticky top-0 z-[60] bg-background/95 backdrop-blur-sm border-b shadow-sm">
                        <PlayerControls />
                    </div>

                    <div
                        ref={textAreaRef}
                        className={`${styles.textArea} p-8 min-[1200px]:p-12 pb-12`}
                    >
                        {paginatedTokens.map((token, index) => {
                            const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
                            // Prefer visual split translation, fallback (should cover initial render) to basic group start
                            const groupTranslation = visualGroupStarts.get(globalIndex) || groupStarts.get(globalIndex);
                            const position = tokenPositions.get(globalIndex);



                            // Use the index from the hook if available
                            // Calculate hover ranges (always sentence level for highlighting visual)
                            if (hoveredIndex !== null && hoveredIndex !== undefined) {
                                // we calculate highlightIndices in the memo above
                            }

                            // Calculate hover position
                            let hoverPosition: HoverPosition | undefined;
                            const isHoveredSentence = highlightIndices.has(globalIndex);
                            const isHoveredWord = hoveredIndex === globalIndex;

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
                                    token={token}
                                    groupTranslation={groupTranslation}
                                    position={position}
                                    isHovered={isHoveredSentence} // Now represents the full sentence hover
                                    isHoveredWord={isHoveredWord} // Specific word
                                    hoverPosition={hoverPosition}
                                    onClick={handleTokenClick}
                                    onMoreInfo={onMoreInfoClick}
                                    onPlay={onPlayClick}
                                />
                            );
                        })}
                    </div>

                    <div className="mt-auto px-8 min-[1200px]:px-0 py-8">
                        <ReaderPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Right Column: Info Panel - Sticky Sidebar */}
            <div className={`hidden min-[1200px]:flex flex-col flex-shrink-0 relative overflow-y-auto h-full transition-all duration-300 ${isRichInfoOpen ? 'w-[500px] pl-2' : 'w-0 pl-0'
                }`}>
                <div className="w-[450px]"> {/* Fixed width inner container to prevent content squashing during transition */}
                    {/* Translation Info Panel */}
                    <RichInfoPanel
                        isOpen={isRichInfoOpen}
                        isLoading={isRichInfoLoading}
                        data={richTranslation}
                        onClose={closeRichInfo}
                    />
                </div>
            </div>

            {/* Mobile Bottom Sheet (Info Panel) - Managed by RichInfoPanel internally with media queries */}
            <div className="min-[1200px]:hidden">
                <RichInfoPanel
                    isOpen={isRichInfoOpen}
                    isLoading={isRichInfoLoading}
                    data={richTranslation}
                    onClose={closeRichInfo}
                />
            </div>
        </div>
    );
};



