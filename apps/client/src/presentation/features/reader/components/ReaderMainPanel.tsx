import { useRef, useEffect } from 'react';
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Loader2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { FloatingContextMenu } from './FloatingContextMenu';
import { Button } from '@/presentation/components/ui/button';

const premiumEase = [0.22, 1, 0.36, 1] as const;

const MotionDiv = motion.create('div');

const controlsV = {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: premiumEase, delay: 0.2 } },
} as const;

const textV = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: premiumEase, delay: 0.5 } },
} as const;

const paginationV = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: premiumEase, delay: 0.8 } },
} as const;

const progressV = {
    hidden: { scaleX: 0 },
    visible: { scaleX: 1, transition: { duration: 1.2, ease: premiumEase, delay: 0.3 } },
} as const;

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
    const isReading = useReaderStore(state => state.isReading);
    const isZenMode = useReaderStore(state => state.isZenMode);

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
        fetchConjugationsForTab,
        cancelRichLoad,
        showTranslations,
        removeTranslation,
        translateIndices
    } = useTranslation(true);

    const groups = useReaderGroups(selectedIndices, getSelectionGroups, selectionTranslations);

    const playSingle = useAudioStore(s => s.playSingle);
    const availableVoices = useAudioStore(s => s.availableVoices);
    const setVoiceByLanguageName = useAudioStore(s => s.setVoiceByLanguageName);


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
            <Card className={`flex-1 ${isReading ? 'h-full min-h-0' : 'h-[75vh] min-h-[600px]'} border-none shadow-sm glass overflow-hidden flex flex-col`}>
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
                            {/* Sticky Progress Bar — sweeps in from left */}
                            <MotionDiv
                                variants={progressV}
                                initial="hidden"
                                animate="visible"
                                className="absolute top-0 left-0 right-0 h-1 bg-muted z-[300] origin-left"
                            >
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${totalPages <= 1 ? 100 : ((currentPage - 1) / (totalPages - 1)) * 100}%` }}
                                />
                            </MotionDiv>

                            {/* Controls — slide down from top */}
                            {!isZenMode && (
                                <MotionDiv
                                    variants={controlsV}
                                    initial="hidden"
                                    animate="visible"
                                    className="sticky top-0 z-[200] bg-background/95 backdrop-blur-sm border-b shadow-sm flex flex-col"
                                >
                                    {tokens.length > 0 && (
                                        <div className="flex items-center justify-between px-4 pt-1.5 pb-0 text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                                            <span>Reading</span>
                                            <span>~{Math.max(1, Math.ceil(tokens.length / 200))} min read</span>
                                        </div>
                                    )}
                                    <PlayerControls />
                                </MotionDiv>
                            )}

                            {/* Text Content — fades up */}
                            <MotionDiv
                                variants={textV}
                                initial="hidden"
                                animate="visible"
                                className="flex-1 flex flex-col"
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentPage}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex-1 flex flex-col"
                                    >
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
                                        <FloatingContextMenu />
                                    </motion.div>
                                </AnimatePresence>
                            </MotionDiv>

                            {/* Floating Zen Mode Toggle */}
                            {isZenMode && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="fixed bottom-4 right-4 z-[400] opacity-50 hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-sm rounded-full border shadow-lg"
                                    onClick={() => useReaderStore.getState().toggleZenMode()}
                                    title="Exit Zen Mode (Shortcut: Z)"
                                >
                                    <Minimize2 className="h-4 w-4" />
                                </Button>
                            )}

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

                {/* Fixed Footer for Pagination — slides up from bottom */}
                {!isZenMode && (
                    <MotionDiv
                        variants={paginationV}
                        initial="hidden"
                        animate="visible"
                        className="border-t bg-background/95 backdrop-blur-md px-4 py-3 flex-shrink-0 z-[250] shadow-sm"
                    >
                        <ReaderPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </MotionDiv>
                )}
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
                    onFetchConjugations={fetchConjugationsForTab}
                    onCancel={cancelRichLoad}
                    onClearAll={closeAllTabs}
                />
            </div>
        </>
    );
};
