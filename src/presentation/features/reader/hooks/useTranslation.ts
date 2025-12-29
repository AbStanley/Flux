import { useEffect, useRef, useCallback } from 'react';
import { useServices } from '../../../contexts/ServiceContext';
import { useTranslationStore } from '../store/useTranslationStore';
import { useReaderStore } from '../store/useReaderStore';

export const useTranslation = (enableAutoFetch = false) => {
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
    // hoveredIndex and hoverTranslation removed to prevent top-level re-renders. 
    // Consumers like ReaderTextContent should select them directly.

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
        if (!enableAutoFetch) return;

        const timeoutId = setTimeout(() => {
            translateSelection(selectedIndices, tokens, sourceLang, targetLang, aiService);
        }, 500); // 500ms debounce for selection to allow grouping

        return () => clearTimeout(timeoutId);
    }, [enableAutoFetch, selectedIndices, tokens, sourceLang, targetLang, aiService, translateSelection]);

    // Derived Actions (Inject Service)
    // Track last hovered index locally to prevent redundant dispatches without adding state dependency
    const lastHoveredIndexRef = useRef<number | null>(null);

    const handleHover = useCallback((index: number) => {
        // Prevent redundant triggers if we are hovering over the same effective "item"
        if (lastHoveredIndexRef.current === index) return;

        lastHoveredIndexRef.current = index;

        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        hoverTimeoutRef.current = setTimeout(() => {
            handleHoverAction(index, tokens, currentPage, PAGE_SIZE, sourceLang, targetLang, aiService);
        }, 300);
    }, [tokens, currentPage, PAGE_SIZE, sourceLang, targetLang, aiService, handleHoverAction]);

    const handleClearHover = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        clearHover();
    }, [clearHover]);

    const fetchRichTranslation = useCallback((text: string, context: string) => {
        fetchRichTranslationAction(text, context, sourceLang, targetLang, aiService);
    }, [fetchRichTranslationAction, sourceLang, targetLang, aiService]);

    return {
        // State
        selectionTranslations,
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
