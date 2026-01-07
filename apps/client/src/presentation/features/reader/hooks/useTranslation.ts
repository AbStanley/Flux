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
    // Rich Info State
    const richDetailsTabs = useTranslationStore(state => state.richDetailsTabs);
    const activeTabId = useTranslationStore(state => state.activeTabId);
    const isRichInfoOpen = useTranslationStore(state => state.isRichInfoOpen);
    const showTranslations = useTranslationStore(state => state.showTranslations);

    // Translation Store Actions
    const translateSelection = useTranslationStore(state => state.translateSelection);
    const handleHoverAction = useTranslationStore(state => state.handleHover);
    const clearHover = useTranslationStore(state => state.clearHover);
    const fetchRichTranslationAction = useTranslationStore(state => state.fetchRichTranslation);
    const closeRichInfo = useTranslationStore(state => state.closeRichInfo);
    const toggleRichInfo = useTranslationStore(state => state.toggleRichInfo);

    // Tab Actions
    const closeTab = useTranslationStore(state => state.closeTab);
    const closeAllTabs = useTranslationStore(state => state.closeAllTabs);
    const setActiveTab = useTranslationStore(state => state.setActiveTab);
    const regenerateTabAction = useTranslationStore(state => state.regenerateTab);

    const toggleShowTranslations = useTranslationStore(state => state.toggleShowTranslations);
    const clearSelectionTranslations = useTranslationStore(state => state.clearSelectionTranslations);

    // Effect: Automatically trigger translation when selection changes
    useEffect(() => {
        if (!enableAutoFetch) return;

        const timeoutId = setTimeout(() => {
            translateSelection(selectedIndices, tokens, sourceLang, targetLang, aiService);
        }, 500); // 500ms debounce for selection to allow grouping

        return () => clearTimeout(timeoutId);
    }, [enableAutoFetch, selectedIndices, tokens, sourceLang, targetLang, aiService, translateSelection]);

    // Track last hovered index locally to prevent redundant dispatches without adding state dependency
    const lastHoveredIndexRef = useRef<number | null>(null);
    const clearHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleHover = useCallback((index: number) => {
        // 1. Cancel any pending clear (sticky hover)
        if (clearHoverTimeoutRef.current) {
            clearTimeout(clearHoverTimeoutRef.current);
            clearHoverTimeoutRef.current = null;
        }

        // 2. Prevent redundant triggers if we are hovering over the same effective "item"
        if (lastHoveredIndexRef.current === index) {
            return;
        }

        lastHoveredIndexRef.current = index;

        // 3. Cancel any pending start-hover from previous rapid movements
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        // 4. Schedule the new hover action (Debounce fetch/state update)
        hoverTimeoutRef.current = setTimeout(() => {
            handleHoverAction(index, tokens, currentPage, PAGE_SIZE, sourceLang, targetLang, aiService);
        }, 150); // Reduced delay for better responsiveness while still debouncing
    }, [tokens, currentPage, PAGE_SIZE, sourceLang, targetLang, aiService, handleHoverAction]);

    const handleClearHover = useCallback(() => {
        // Cancel any pending fetch
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }

        // Debounce the clear to prevent flicker when moving between close elements or over gaps
        if (clearHoverTimeoutRef.current) {
            clearTimeout(clearHoverTimeoutRef.current);
        }

        clearHoverTimeoutRef.current = setTimeout(() => {
            lastHoveredIndexRef.current = null;
            clearHover();
        }, 50);
    }, [clearHover]);

    const fetchRichTranslation = useCallback((text: string, context: string) => {
        fetchRichTranslationAction(text, context, sourceLang, targetLang, aiService);
    }, [fetchRichTranslationAction, sourceLang, targetLang, aiService]);

    const regenerateTab = useCallback((id: string) => {
        regenerateTabAction(id, aiService);
    }, [regenerateTabAction, aiService]);

    return {
        // State
        selectionTranslations,
        richDetailsTabs,
        activeTabId,
        isRichInfoOpen,
        showTranslations,

        // Actions
        handleHover,
        clearHover: handleClearHover,
        fetchRichTranslation,
        closeRichInfo,
        toggleRichInfo,
        toggleShowTranslations,
        clearSelectionTranslations,
        regenerateSelection: (index?: number) => translateSelection(selectedIndices, tokens, sourceLang, targetLang, aiService, true, index),

        // Tab Actions
        closeTab,
        closeAllTabs,
        setActiveTab,
        regenerateTab
    };
};
