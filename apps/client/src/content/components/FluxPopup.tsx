import { useState, useCallback, useEffect, useRef } from 'react';
import type { Mode } from '../hooks/useAIHandler';
import { useDraggable } from '../hooks/useDraggable';
import { type FluxTheme } from '../constants';
import { useFluxMessaging } from '../hooks/useFluxMessaging';
import { useFluxAudio } from '../hooks/useFluxAudio';
import { FluxCollapsedPopup } from './FluxCollapsedPopup';
import { FluxExpandedPopup } from './FluxExpandedPopup';

interface FluxPopupProps {
    selection: { text: string; x: number; y: number };
    result: string;
    loading: boolean;
    error: string | null;
    mode: Mode;
    targetLang: string;
    sourceLang?: string;
    onModeChange: (mode: Mode) => void;
    onLangChange: (lang: string) => void;
    onSourceLangChange?: (lang: string) => void;
    onSwapLanguages?: () => void;
    onAction: () => void;
    onClose: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onPinChange?: (pinned: boolean) => void;
    onAutoPlay?: () => void;
    onSave?: (text: string, definition?: string) => void;
    autoSave: boolean;
    onAutoSaveChange: (enabled: boolean) => void;
    isSaving?: boolean;
    theme: FluxTheme;
    themeId: string;
    onThemeChange: (id: string) => void;
    model: string;
    availableModels: string[];
    onModelChange: (model: string) => void;
    collapsed: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
    isPinned: boolean;
}

export function FluxPopup({
    selection,
    result,
    loading,
    error,
    mode,
    targetLang,
    sourceLang,
    onModeChange,
    onLangChange,
    onSourceLangChange,
    onSwapLanguages,
    onAction,
    onClose,
    onMouseEnter,
    onMouseLeave,
    onPinChange,
    onAutoPlay,
    onSave,
    autoSave,
    onAutoSaveChange,
    isSaving,
    theme,
    themeId,
    onThemeChange,
    model,
    availableModels,
    onModelChange,
    collapsed: isCollapsed,
    onCollapsedChange: setIsCollapsed,
    isPinned,
}: FluxPopupProps) {
    const { selectAndOpen } = useFluxMessaging();
    const popupRef = useRef<HTMLDivElement>(null);

    const { pos, setPos, isDragging, handleMouseDown } = useDraggable({
        initialPos: { x: selection.x, y: selection.y },
        onDragStart: () => {
            if (!isPinned) {
                onPinChange?.(true);
            }
        }
    });

    // Update position if selection changes and not pinned/dragging
    const [lastSelection, setLastSelection] = useState(selection);
    if (selection !== lastSelection) {
        setLastSelection(selection);
        if (!isPinned && !isDragging) {
            setPos({ x: selection.x, y: selection.y });
        }
    }

    const handlePinToggle = useCallback(() => {
        if (!isPinned && popupRef.current) {
            // Capturing the current screen position to prevent jumping if the user has scrolled
            const rect = popupRef.current.getBoundingClientRect();
            setPos({ x: rect.left, y: rect.top });
        }
        onPinChange?.(!isPinned);
    }, [isPinned, onPinChange, setPos]);

    const handleInternalSave = useCallback(() => {
        if (onSave) {
            onSave(selection.text, result || undefined);
        } else {
            selectAndOpen(selection.text);
        }
    }, [onSave, selection.text, result, selectAndOpen]);

    const { playAudio } = useFluxAudio();

    const handlePlayAudio = useCallback(() => {
        const textToPlay = result || selection.text;
        const langToUse = result ? targetLang : (sourceLang === 'Auto' ? 'English' : (sourceLang || 'English'));
        playAudio(textToPlay, langToUse);
    }, [result, selection.text, targetLang, sourceLang, playAudio]);

    // Keyboard shortcuts: Esc=close, S=save, E=expand/collapse
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
            if (e.key === 'Escape') { onClose(); }
            else if (e.key === 's' || e.key === 'S') { e.preventDefault(); handleInternalSave(); }
            else if (e.key === 'e' || e.key === 'E') { e.preventDefault(); setIsCollapsed(!isCollapsed); }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, handleInternalSave, isCollapsed, setIsCollapsed]);

    // When not pinned, use absolute positioning (scrolls with page).
    // When pinned (dragged), use fixed positioning (stays in viewport).
    const positioning: React.CSSProperties = isPinned
        ? { position: 'fixed', left: pos.x, top: pos.y }
        : { position: 'absolute', left: pos.x + window.scrollX, top: pos.y + window.scrollY };

    if (isCollapsed) {
        return (
            <FluxCollapsedPopup
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                positioning={positioning}
                loading={loading}
                error={error}
                result={result}
                theme={theme}
                isSaving={isSaving}
                onClose={onClose}
                onExpand={() => setIsCollapsed(false)}
                handlePlayAudio={handlePlayAudio}
                handleInternalSave={handleInternalSave}
                onRetry={onAction}
            />
        );
    }

    return (
        <FluxExpandedPopup
            popupRef={popupRef}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onAutoPlay={onAutoPlay}
            positioning={positioning}
            isDragging={isDragging}
            handleMouseDown={handleMouseDown}
            loading={loading}
            error={error}
            result={result}
            theme={theme}
            isSaving={isSaving}
            onClose={onClose}
            handlePinToggle={handlePinToggle}
            handleInternalSave={handleInternalSave}
            isPinned={isPinned}
            setIsCollapsed={setIsCollapsed}
            selection={selection}
            mode={mode}
            targetLang={targetLang}
            sourceLang={sourceLang}
            onModeChange={onModeChange}
            onLangChange={onLangChange}
            onSourceLangChange={onSourceLangChange}
            onSwapLanguages={onSwapLanguages}
            onAction={onAction}
            autoSave={autoSave}
            onAutoSaveChange={onAutoSaveChange}
            themeId={themeId}
            onThemeChange={onThemeChange}
            model={model}
            availableModels={availableModels}
            onModelChange={onModelChange}
        />
    );
}
