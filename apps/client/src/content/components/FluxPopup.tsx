import { useState, useCallback } from 'react';
import type { Mode } from '../hooks/useAIHandler';
import { FluxHeader } from './FluxHeader';
import { FluxControls } from './FluxControls';
import { FluxContent } from './FluxContent';
import { useDraggable } from '../hooks/useDraggable';
import { UI_CONSTANTS } from '../constants';
import { useFluxMessaging } from '../hooks/useFluxMessaging';

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
    onAction: () => void;
    onClose: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onPinChange?: (pinned: boolean) => void;
    onAutoPlay?: () => void;
    onSave?: (text: string) => void;
    autoSave: boolean;
    onAutoSaveChange: (enabled: boolean) => void;
    isSaving?: boolean;
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
    onAction,
    onClose,
    onMouseEnter,
    onMouseLeave,
    onPinChange,
    onAutoPlay,
    onSave,
    autoSave,
    onAutoSaveChange,
    isSaving
}: FluxPopupProps) {
    const [isPinned, setIsPinned] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { selectAndOpen } = useFluxMessaging();

    const { pos, setPos, isDragging, handleMouseDown } = useDraggable({
        initialPos: { x: selection.x, y: selection.y },
        onDragStart: () => {
            if (!isPinned) {
                setIsPinned(true);
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
        const next = !isPinned;
        setIsPinned(next);
        onPinChange?.(next);
    }, [isPinned, onPinChange]);

    const handleInternalSave = useCallback(() => {
        if (onSave) {
            onSave(selection.text);
        } else {
            selectAndOpen(selection.text);
        }
    }, [onSave, selection.text, selectAndOpen]);

    const popupStyles: React.CSSProperties = {
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: '#f8fafc',
        width: isCollapsed ? `${UI_CONSTANTS.POPUP_COLLAPSED_WIDTH}px` : `${UI_CONSTANTS.POPUP_WIDTH}px`,
        padding: isCollapsed ? '12px 16px' : '20px',
        borderRadius: '20px',
        boxShadow: isDragging
            ? '0 30px 60px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.2)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        fontSize: '14px',
        lineHeight: '1.6',
        display: 'flex',
        flexDirection: 'column',
        gap: isCollapsed ? '8px' : '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    };

    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={() => {
                if (!isPinned) onMouseLeave();
                onAutoPlay?.();
            }}
            style={{
                position: 'fixed',
                left: pos.x,
                top: pos.y,
                zIndex: UI_CONSTANTS.Z_INDEX,
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: isDragging ? UI_CONSTANTS.TRANSITION_DRAGGING : UI_CONSTANTS.TRANSITION_DEFAULT
            }}
            onMouseDown={e => e.stopPropagation()}
        >
            <div style={popupStyles}>
                <div onMouseDown={handleMouseDown}>
                    <FluxHeader
                        onClose={onClose}
                        onPinToggle={handlePinToggle}
                        onSave={handleInternalSave}
                        isPinned={isPinned}
                        isCollapsed={isCollapsed}
                        onCollapseToggle={() => setIsCollapsed(!isCollapsed)}
                    />
                </div>

                {!isCollapsed && (
                    <FluxControls
                        mode={mode}
                        targetLang={targetLang}
                        sourceLang={sourceLang}
                        result={result}
                        selection={selection}
                        onModeChange={onModeChange}
                        onLangChange={onLangChange}
                        onSourceLangChange={onSourceLangChange}
                        onAction={onAction}
                        autoSave={autoSave}
                        onAutoSaveChange={onAutoSaveChange}
                        isSaving={isSaving}
                    />
                )}

                <FluxContent
                    loading={loading}
                    error={error}
                    result={result}
                />
            </div>
        </div>
    );
}
