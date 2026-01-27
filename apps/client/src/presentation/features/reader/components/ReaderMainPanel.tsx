import { useRef, useEffect } from 'react';
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Loader2 } from 'lucide-react';
import styles from '../ReaderView.module.css';

import { useReader } from '../hooks/useReader';
import { useTranslation } from '../hooks/useTranslation';
import { useVisualSplits } from '../hooks/useVisualSplits';
import { useTokenStyling } from '../hooks/useTokenStyling';
import { useAudioStore } from '../store/useAudioStore';
import { useReaderStore } from '../store/useReaderStore';
import { useAudioPageSync } from '../hooks/useAudioPageSync';
import { useReaderGroups } from '../hooks/useReaderGroups';
import { useReaderInteractions } from '../hooks/useReaderInteractions';

import { ReaderPagination } from './ReaderPagination';
import { ReaderTextContent } from './ReaderTextContent';
import { PlayerControls } from './PlayerControls';
import { RichInfoPanel } from './RichInfoPanel';
import { GrammarSlideshow } from './GrammarSlideshow';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export function ReaderMainPanel() {
    const {
        tokens,
        paginatedTokens,
        currentPage,
        totalPages,
        selectedIndices,
        PAGE_SIZE,
        selectionMode,
        sourceLang,
        targetLang,
        setCurrentPage,
        handleTokenClick: handleTokenClickAction,
        getSelectionGroups
    } = useReader();

    const isGenerating = useReaderStore(state => state.isGenerating);
    const readingMode = useReaderStore(state => state.readingMode);
    const setReadingMode = useReaderStore(state => state.setReadingMode);

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
        showTranslations,
        removeTranslation,
        translateIndices
    } = useTranslation(true);

    const groups = useReaderGroups(selectedIndices, getSelectionGroups, selectionTranslations);

    const playSingle = useAudioStore(s => s.playSingle);
    const availableVoices = useAudioStore(s => s.availableVoices);
    const setVoiceByLanguageName = useAudioStore(s => s.setVoiceByLanguageName);

    const llmModel = useSettingsStore(state => state.llmModel);
    const setLlmModel = useSettingsStore(state => state.setLlmModel);

    // Auto-detect and set model if missing or legacy 'llama2'
    useEffect(() => {
        if (!llmModel || llmModel === 'llama2') {
            fetch('/api/tags')
                .then(res => res.json())
                .then(data => {
                    if (data.models && data.models.length > 0) {
                        const firstModel = data.models[0].name;
                        console.log('Auto-setting LLM model:', firstModel);
                        setLlmModel(firstModel);
                    }
                })
                .catch(err => console.error('Failed to auto-detect models', err));
        }
    }, [llmModel, setLlmModel]);

    useEffect(() => {
        if (sourceLang) {
            setVoiceByLanguageName(sourceLang);
        }
    }, [sourceLang, availableVoices, setVoiceByLanguageName]);

    const requiredAudioPage = useAudioPageSync(PAGE_SIZE);

    useEffect(() => {
        if (requiredAudioPage !== null && requiredAudioPage !== currentPage) {
            setCurrentPage(requiredAudioPage);
        }
    }, [requiredAudioPage, currentPage, setCurrentPage]);

    const {
        onTokenClick,
        onMoreInfoClick,
        onPlayClick,
        onRegenerateClick
    } = useReaderInteractions({
        currentPage,
        PAGE_SIZE,
        groups,
        selectionTranslations,
        handleTokenClickAction,
        removeTranslation,
        tokens,
        targetLang,
        translateIndices,
        regenerateHover: useTranslation(true).regenerateHover, // Pass the new action
        sourceLang,
        selectionMode,
        fetchRichTranslation,
        playSingle
    });

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

    return (
        <>
            <Card className="flex-1 h-full border-none shadow-sm glass overflow-hidden flex flex-col">
                <CardContent className={`p-0 relative flex-1 ${isGenerating ? 'overflow-hidden select-none' : 'overflow-y-auto'} ${styles.textAreaContainer} flex flex-col`}>

                    {readingMode === 'GRAMMAR' ? (
                        <GrammarSlideshow
                            tokens={tokens}
                            sourceLang={sourceLang}
                            targetLang={targetLang}
                            onClose={() => setReadingMode('STANDARD')}
                        />
                    ) : (
                        <>
                            <div className="sticky top-0 z-[200] bg-background/95 backdrop-blur-sm border-b shadow-sm">
                                <PlayerControls />
                            </div>

                            {!isGenerating && (
                                <ReaderTextContent
                                    tokens={tokens}
                                    paginatedTokens={paginatedTokens}
                                    groups={groups}
                                    currentPage={currentPage}
                                    PAGE_SIZE={PAGE_SIZE}
                                    selectionMode={selectionMode}
                                    visualGroupStarts={visualGroupStarts}
                                    groupStarts={groupStarts}
                                    tokenPositions={tokenPositions}
                                    textAreaRef={textAreaRef}
                                    handleTokenClick={onTokenClick}
                                    onMoreInfoClick={onMoreInfoClick}
                                    onPlayClick={onPlayClick}
                                    onRegenerateClick={onRegenerateClick}
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
                        </>
                    )}

                    {isGenerating && (
                        <div className="absolute inset-0 z-[220] flex flex-col items-center justify-center bg-background/10 backdrop-blur-[2px] transition-all duration-500">
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
