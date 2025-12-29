import { useEffect, useRef } from 'react';
import { useServices } from '../../../contexts/ServiceContext';
import { useTranslationStore } from '../store/useTranslationStore';
import { useReaderStore } from '../store/useReaderStore';

export const useTranslation = () => {
    const { aiService } = useServices();

    // Ref for hover timeout to debounce calls
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reader Store State (Dependencies)
    const tokens = useReaderStore(state => state.tokens);
    const selectedIndices = useReaderStore(state => state.selectedIndices);
    const currentPage = useReaderStore(state => state.currentPage);
    const PAGE_SIZE = useReaderStore(state => state.PAGE_SIZE);
    const sourceLang = useReaderStore(state => state.sourceLang);
    const targetLang = useReaderStore(state => state.targetLang);

    // Translation Store State
    const selectionTranslations = useTranslationStore(state => state.selectionTranslations);
    const hoveredIndex = useTranslationStore(state => state.hoveredIndex);
    const hoverTranslation = useTranslationStore(state => state.hoverTranslation);

    // Rich Info State
    const richTranslation = useTranslationStore(state => state.richTranslation);
    const isRichInfoOpen = useTranslationStore(state => state.isRichInfoOpen);
    const isRichInfoLoading = useTranslationStore(state => state.isRichInfoLoading);

    // Translation Store Actions
    const translateSelection = useTranslationStore(state => state.translateSelection);
    const handleHoverAction = useTranslationStore(state => state.handleHover);
    const clearHover = useTranslationStore(state => state.clearHover);
    const fetchRichTranslationAction = useTranslationStore(state => state.fetchRichTranslation);
    const closeRichInfo = useTranslationStore(state => state.closeRichInfo);
    const toggleRichInfo = useTranslationStore(state => state.toggleRichInfo);

    // Effect: Automatically trigger translation when selection changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            translateSelection(selectedIndices, tokens, sourceLang, targetLang, aiService);
        }, 500); // 500ms debounce for selection to allow grouping

        return () => clearTimeout(timeoutId);
    }, [selectedIndices, tokens, sourceLang, targetLang, aiService, translateSelection]);

    // Derived Actions (Inject Service)
    const handleHover = (index: number) => {
        // Clear any previous hover actions if we move fast? 
        // Actually, debounce here is tricky because we want immediate feedback for UI state (hoveredIndex), but delayed fetch.
        // The store handles immediate `hoveredIndex` set. We just need to delay the *call* or let the store handle it?
        // Since `ReaderToken` calls this on MouseEnter, let's debounce the *fetching* part.
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        hoverTimeoutRef.current = setTimeout(() => {
            handleHoverAction(index, tokens, currentPage, PAGE_SIZE, sourceLang, targetLang, aiService);
        }, 300);
    };

    const handleClearHover = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        clearHover();
    };

    const fetchRichTranslation = (text: string, context: string) => {
        fetchRichTranslationAction(text, context, sourceLang, targetLang, aiService);
    };

    return {
        // State
        selectionTranslations,
        hoveredIndex,
        hoverTranslation,
        richTranslation,
        isRichInfoOpen,
        isRichInfoLoading,

        // Actions
        handleHover,
        clearHover: handleClearHover,
        fetchRichTranslation,
        closeRichInfo,
        toggleRichInfo
    };
};
