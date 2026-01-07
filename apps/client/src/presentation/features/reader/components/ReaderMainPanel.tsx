import React, { useRef, useCallback, useMemo } from 'react';
import { Card, CardContent } from "../../../components/ui/card";
import { Loader2 } from 'lucide-react';
import styles from '../ReaderView.module.css';

import { useReader } from '../hooks/useReader';
import { useTranslation } from '../hooks/useTranslation';
import { useVisualSplits } from '../hooks/useVisualSplits';
import { useTokenStyling } from '../hooks/useTokenStyling';
import { useAudioStore } from '../store/useAudioStore';
import { useReaderStore } from '../store/useReaderStore';
import { useAudioPageSync } from '../hooks/useAudioPageSync';

import { ReaderPagination } from './ReaderPagination';
import { ReaderTextContent } from './ReaderTextContent';
import { PlayerControls } from './PlayerControls';
import { RichInfoPanel } from './RichInfoPanel';

export const ReaderMainPanel: React.FC = () => {
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

    const isGenerating = useReaderStore(state => state.isGenerating);

    const {
        selectionTranslations,
        richDetailsTabs,
        activeTabId,
        isRichInfoOpen,
        fetchRichTranslation,
        closeRichInfo,
        setActiveTab,
        closeTab,
        closeAllTabs,
        regenerateTab,
        showTranslations
    } = useTranslation(true);

    const activeTabData = React.useMemo(() => {
        return richDetailsTabs.find(t => t.id === activeTabId)?.data || null;
    }, [richDetailsTabs, activeTabId]);

    const playSingle = useAudioStore(s => s.playSingle);
    const availableVoices = useAudioStore(s => s.availableVoices);
    const setVoiceByLanguageName = useAudioStore(s => s.setVoiceByLanguageName);

    React.useEffect(() => {
        if (sourceLang) {
            setVoiceByLanguageName(sourceLang);
        }
    }, [sourceLang, availableVoices, setVoiceByLanguageName]);

    const requiredAudioPage = useAudioPageSync(PAGE_SIZE);

    React.useEffect(() => {
        if (requiredAudioPage !== null && requiredAudioPage !== currentPage) {
            setCurrentPage(requiredAudioPage);
        }
    }, [requiredAudioPage, currentPage, setCurrentPage]);

    const groups = useMemo(() => getSelectionGroups(selectedIndices), [getSelectionGroups, selectedIndices]);

    const textAreaRef = useRef<HTMLDivElement>(null);
    const visualGroupStarts = useVisualSplits({
        groups,
        selectionTranslations,
        paginatedTokens,
        currentPage,
        PAGE_SIZE,
        textAreaRef
    });

    const { groupStarts, tokenPositions } = useTokenStyling({
        groups,
        selectionTranslations
    });

    const onMoreInfoClick = useCallback((index: number, forceSingle: boolean = false) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const group = groups.find(g => g.includes(globalIndex));
        let textToTranslate = "";

        if (group && !forceSingle) {
            const start = group[0];
            const end = group[group.length - 1];
            textToTranslate = tokens.slice(start, end + 1).join('');
        } else {
            textToTranslate = tokens[globalIndex];
        }

        if (textToTranslate) {
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
        <>
            <Card className="flex-1 h-full border-none shadow-sm glass overflow-hidden flex flex-col">
                <CardContent className={`p-0 relative flex-1 ${isGenerating ? 'overflow-hidden select-none' : 'overflow-y-auto'} ${styles.textAreaContainer} flex flex-col`}>

                    <div className="sticky top-0 z-[60] bg-background/95 backdrop-blur-sm border-b shadow-sm">
                        <PlayerControls />
                    </div>

                    {!isGenerating && (
                        <ReaderTextContent
                            tokens={tokens}
                            paginatedTokens={paginatedTokens}
                            groups={groups}
                            richTranslation={activeTabData}
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

            {/* Mobile Bottom Sheet (Info Panel) - Managed by RichInfoPanel internally with media queries */}
            <div className="min-[1200px]:hidden">
                <RichInfoPanel
                    isOpen={isRichInfoOpen}
                    tabs={richDetailsTabs}
                    activeTabId={activeTabId}
                    onClose={closeRichInfo}
                    onTabChange={setActiveTab}
                    onCloseTab={closeTab}
                    onRegenerate={regenerateTab}
                    onClearAll={closeAllTabs}
                />
            </div>
        </>
    );
};
