

import React from 'react';
import styles from './ReaderView.module.css';
import { Card, CardContent } from "../../components/ui/card";
import { useReader } from './hooks/useReader';
import { useTranslation } from './hooks/useTranslation'; // NEW
import { ReaderPagination } from './components/ReaderPagination';
import { ReaderToken } from './components/ReaderToken';
import { RichInfoPanel } from './components/RichInfoPanel'; // NEW

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
    } = useTranslation();

    // Audio Store consumption
    const { playSingle } = useAudioStore();

    // Calculate grouping for rendering
    const groups = getSelectionGroups(selectedIndices);
    const groupStarts = new Map<number, string>(); // index -> translation

    // Map to store position of each token in a group for styling
    // 'single' | 'start' | 'middle' | 'end'
    const tokenPositions = new Map<number, string>();




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



    // Better More Info handler:
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
        <div className="flex flex-row gap-4 max-w-[90%] mx-auto my-8 h-[80vh]">
            <Card className="flex-1 h-full border-none shadow-sm glass overflow-hidden flex flex-col">
                <CardContent className="p-8 md:p-12 relative flex-1 overflow-y-auto">
                    <PlayerControls />
                    <div className={styles.textArea}>
                        {paginatedTokens.map((token, index) => {
                            const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
                            const groupTranslation = groupStarts.get(globalIndex);
                            const position = tokenPositions.get(globalIndex);

                            return (
                                <ReaderToken
                                    key={index}
                                    index={index}
                                    token={token}
                                    groupTranslation={groupTranslation}
                                    position={position}
                                    onClick={handleTokenClick}
                                    onMoreInfo={onMoreInfoClick}
                                    onPlay={onPlayClick}
                                />
                            );
                        })}
                    </div>

                    <div className="mt-8">
                        <ReaderPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </CardContent>
            </Card>

            <RichInfoPanel
                isOpen={isRichInfoOpen}
                isLoading={isRichInfoLoading}
                data={richTranslation}
                onClose={closeRichInfo}
            />
        </div>
    );
};



