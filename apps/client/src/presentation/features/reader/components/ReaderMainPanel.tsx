import React, { useRef, useCallback, useMemo } from 'react';
import { SelectionMode } from '../../../../core/types';
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
        targetLang,
        setCurrentPage,
        handleTokenClick: handleTokenClickAction,
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
        showTranslations,
        removeTranslation,
        translateIndices
    } = useTranslation(true);

    const selectionGroups = useMemo(() => getSelectionGroups(selectedIndices), [getSelectionGroups, selectedIndices]);

    const groups = useMemo(() => {
        // Convert persisted translations into group arrays
        const translationGroups: number[][] = [];
        selectionTranslations.forEach((_, key) => {
            const [start, end] = key.split('-').map(Number);
            const group: number[] = [];
            for (let i = start; i <= end; i++) {
                group.push(i);
            }
            translationGroups.push(group);
        });

        // Combine and deduplicate based on start-end key
        const combined = [...selectionGroups, ...translationGroups];
        const uniqueKeys = new Set<string>();
        const uniqueGroups: number[][] = [];

        for (const g of combined) {
            if (g.length === 0) continue;
            const key = `${g[0]}-${g[g.length - 1]}`;
            if (!uniqueKeys.has(key)) {
                uniqueKeys.add(key);
                uniqueGroups.push(g);
            }
        }
        return uniqueGroups;
    }, [selectionGroups, selectionTranslations]);

    const onTokenClick = useCallback((index: number, e: React.MouseEvent) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const isMultiSelecting = e.shiftKey || e.ctrlKey || e.metaKey;

        // 1. Check if clicking inside an existing group (Toggle/Select logic)
        // We look at 'groups' which includes both persisted and active selections
        const validGroups = groups.filter(g => g.length > 0);
        const existingGroup = validGroups.find(g => g.includes(globalIndex));

        if (existingGroup && !isMultiSelecting) {
            // Identifier for this group (if persisted)
            const groupKey = `${existingGroup[0]}-${existingGroup[existingGroup.length - 1]}`;

            // 1a. SAFETY GUARD (Word Mode):
            // If we are in Word Mode, and the user clicks a Multi-Word Translation (Sentence),
            // DO NOT Remove/Toggle it off. This prevents accidental destruction of sentence views.
            // We just let it fall through to 'handleTokenClickAction' (select word) or do nothing.
            // 1a. SPLIT LOGIC (Word Mode):
            // If in Word Mode and clicking a group (Sentence or Phrase),
            // We "Split" it: Remove the clicked word, re-translate the remainders.
            if (selectionMode === SelectionMode.Word && selectionTranslations.has(groupKey)) {
                // 1. Remove the original translation
                const text = tokens.slice(existingGroup[0], existingGroup[existingGroup.length - 1] + 1).join('');
                removeTranslation(groupKey, text, targetLang);

                // 2. Calculate remaining indices
                const remainingIndices = new Set<number>();
                existingGroup.forEach(i => {
                    if (i !== globalIndex) remainingIndices.add(i);
                });

                // 3. Trigger translation for remainders (if any)
                if (remainingIndices.size > 0) {
                    translateIndices(remainingIndices);
                }
                return;
            }
            // 1b. Standard Toggle (Sentence Mode or otherwise)
            else if (selectionTranslations.has(groupKey)) {
                // If it's a persisted translation, Remove/Toggle Off
                // Reconstruct text for cache seeding
                const text = tokens.slice(existingGroup[0], existingGroup[existingGroup.length - 1] + 1).join('');
                removeTranslation(groupKey, text, targetLang);
                return;
            }

            // If it's just a selection (green highlight), fall through to default properties (toggle/deselect)
            // handleTokenClickAction will handle toggling it off.
        }

        // 2. Click-to-Extend/Merge Logic (Only if NOT multi-selecting, NOT clicking inside existing, AND in WORD mode)
        // In Sentence mode, we want distinct selections, not auto-merging of sentences.
        if (!existingGroup && !isMultiSelecting && selectionMode === SelectionMode.Word) {
            // Check for adjacent groups to merge with
            // Adjacency radius = 2 (allows for 1 intervening space/punct)
            const adjacentGroups = validGroups.filter(g => {
                const groupStart = g[0];
                const groupEnd = g[g.length - 1];
                // Check dist to left or right
                const distLeft = globalIndex - groupEnd;
                const distRight = groupStart - globalIndex;

                // Allow distance 1 (direct neighbor) or 2 (space in between)
                return (distLeft > 0 && distLeft <= 2) || (distRight > 0 && distRight <= 2);
            });

            if (adjacentGroups.length > 0) {
                // MERGE STRATEGY
                const mergedIndices = new Set<number>();
                mergedIndices.add(globalIndex); // Add clicked word

                adjacentGroups.forEach(g => g.forEach(i => mergedIndices.add(i))); // Add neighbors

                // Check for any gaps between bridged components and fill them
                // (e.g. if we merge [0] and [2], ensure [1] is added if it's gap material)
                const sorted = Array.from(mergedIndices).sort((a, b) => a - b);
                const min = sorted[0];
                const max = sorted[sorted.length - 1];

                for (let i = min; i <= max; i++) {
                    // We naively fill the range. 
                    // Since we validated adjacency, we assume the user satisfies the "single sentence" intent.
                    mergedIndices.add(i);
                }

                // Trigger Translation for the new merged group
                // Trigger Translation for the new merged group
                translateIndices(mergedIndices);
                return;
            }
        }

        handleTokenClickAction(index);
    }, [currentPage, PAGE_SIZE, groups, selectionTranslations, handleTokenClickAction, removeTranslation, tokens, targetLang, translateIndices, sourceLang]);

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

    const onRegenerateClick = useCallback((index: number) => {
        const globalIndex = (currentPage - 1) * PAGE_SIZE + index;
        const group = groups.find(g => g.includes(globalIndex));

        if (group) {
            const indices = new Set(group);
            translateIndices(indices, true); // Force = true
        } else {
            // Single word regeneration
            const indices = new Set([globalIndex]);
            translateIndices(indices, true);
        }
    }, [currentPage, PAGE_SIZE, groups, translateIndices]);

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
