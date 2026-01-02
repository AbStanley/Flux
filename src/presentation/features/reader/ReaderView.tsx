
import React, { useRef, useCallback, useMemo } from 'react';
import styles from './ReaderView.module.css';
import { Card, CardContent } from "../../components/ui/card";
import { useReader } from './hooks/useReader';
import { useTranslation } from './hooks/useTranslation';
import { useVisualSplits } from './hooks/useVisualSplits';
import { useTokenStyling } from './hooks/useTokenStyling';

import { ReaderPagination } from './components/ReaderPagination';
import { ReaderTextContent } from './components/ReaderTextContent';
import { RichInfoPanel } from './components/RichInfoPanel';

import { useAudioStore } from './store/useAudioStore';
import { PlayerControls } from './components/PlayerControls';
import { Loader2 } from 'lucide-react';
import { useReaderStore } from './store/useReaderStore';


export const ReaderView: React.FC = () => {
    const {
        tokens,
        paginatedTokens,
        currentPage,
        totalPages,
        selectedIndices,
        PAGE_SIZE,
        selectionMode,
        sourceLang,
        setCurrentPage,
        handleTokenClick,
        getSelectionGroups
    } = useReader();

    // Direct store access for specific flags
    const isGenerating = useReaderStore(state => state.isGenerating);

    // Translation Hook
    const {
        selectionTranslations,
        richTranslation,
        isRichInfoOpen,
        isRichInfoLoading,
        fetchRichTranslation,
        closeRichInfo,
        showTranslations
    } = useTranslation(true);

    // Audio Store consumption
    const { playSingle, availableVoices, setVoiceByLanguageName } = useAudioStore();

    // Effect: Auto-select voice when source language changes or voices load
    React.useEffect(() => {
        if (sourceLang) {
            setVoiceByLanguageName(sourceLang);
        }
    }, [sourceLang, availableVoices, setVoiceByLanguageName]);

    // Calculate grouping for rendering
    const groups = useMemo(() => getSelectionGroups(selectedIndices), [getSelectionGroups, selectedIndices]);

    // Map to store position of each token in a group for styling
    // 'single' | 'start' | 'middle' | 'end'
    // Visual Translation Splitting Logic
    const textAreaRef = useRef<HTMLDivElement>(null);
    const visualGroupStarts = useVisualSplits({
        groups,
        selectionTranslations,
        paginatedTokens,
        currentPage,
        PAGE_SIZE,
        textAreaRef
    });

    // Map to store position of each token in a group for styling
    // 'single' | 'start' | 'middle' | 'end'
    // Map to store position of each token in a group for styling
    // 'single' | 'start' | 'middle' | 'end'
    const { groupStarts, tokenPositions } = useTokenStyling({
        groups,
        selectionTranslations
    });





    // Better More Info handler:
    const onMoreInfoClick = useCallback((index: number, forceSingle: boolean = false) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;

        // Check if this token is part of a selected group
        // groups is a list of [start, ... end] arrays
        const group = groups.find(g => g.includes(globalIndex));

        let textToTranslate = "";

        if (group && !forceSingle) {
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
            // Calculate Context (Surrounding Sentence)
            let startIndex = globalIndex;
            while (startIndex > 0 && !tokens[startIndex - 1].includes('\n') && !/[.!?]['"”’\)]*$/.test(tokens[startIndex - 1])) {
                startIndex--;
            }

            let endIndex = globalIndex;
            while (endIndex < tokens.length - 1 && !tokens[endIndex + 1].includes('\n') && !/[.!?]['"”’\)]*$/.test(tokens[endIndex])) {
                endIndex++;
            }

            const context = tokens.slice(startIndex, endIndex + 1).join('');
            fetchRichTranslation(textToTranslate, context);
        }
    }, [currentPage, PAGE_SIZE, groups, tokens, fetchRichTranslation]);

    const onPlayClick = useCallback((index: number, forceSingle: boolean = false) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const group = groups.find(g => g.includes(globalIndex));

        let textToPlay = "";

        if (group && !forceSingle) {
            const start = group[0];
            const end = group[group.length - 1];
            textToPlay = tokens.slice(start, end + 1).join('');
        } else {
            textToPlay = tokens[globalIndex];
        }

        if (textToPlay) {
            playSingle(textToPlay);
        }
    }, [currentPage, PAGE_SIZE, groups, tokens, playSingle]);

    return (
        <div className="relative flex flex-col min-[1200px]:flex-row w-full flex-1 h-full min-h-0 max-w-full mx-auto my-0 transition-all duration-300 gap-6">
            {/* Center Column: Reading Card */}
            <Card className="flex-1 h-full border-none shadow-sm glass overflow-hidden flex flex-col">
                <CardContent className={`p-0 relative flex-1 ${isGenerating ? 'overflow-hidden select-none' : 'overflow-y-auto'} ${styles.textAreaContainer} flex flex-col`}>

                    {/* Player Controls - Sticky Top */}
                    <div className="sticky top-0 z-[60] bg-background/95 backdrop-blur-sm border-b shadow-sm">
                        <PlayerControls />
                    </div>

                    {!isGenerating && (
                        <ReaderTextContent
                            tokens={tokens}
                            paginatedTokens={paginatedTokens}
                            groups={groups}
                            richTranslation={richTranslation}
                            currentPage={currentPage}
                            PAGE_SIZE={PAGE_SIZE}
                            selectionMode={selectionMode}
                            visualGroupStarts={visualGroupStarts}
                            groupStarts={groupStarts}
                            tokenPositions={tokenPositions}
                            textAreaRef={textAreaRef}
                            handleTokenClick={handleTokenClick}
                            onMoreInfoClick={onMoreInfoClick}
                            onPlayClick={onPlayClick}
                            showTranslations={showTranslations}
                        />
                    )}

                    <div className="mt-auto px-8 min-[1200px]:px-0 py-8">
                        <ReaderPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>

                    {/* Glass UI Overlay for Generation */}
                    {isGenerating && (
                        <div className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-background/10 backdrop-blur-[2px] transition-all duration-500">
                            <div className="flex items-center gap-3 p-4 bg-background/60 rounded-xl shadow-xl border border-primary/10 backdrop-blur-md animate-pulse">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <span className="text-sm font-semibold tracking-wide text-primary">Creating Story...</span>
                            </div>
                        </div>
                    )}
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



