import { useState, useCallback } from 'react';
import type { Mode } from '../hooks/useAIHandler';
import { FluxHeader } from './FluxHeader';
import { FluxControls } from './FluxControls';
import { FluxContent } from './FluxContent';
import { useDraggable } from '../hooks/useDraggable';
import { UI_CONSTANTS, type FluxTheme } from '../constants';
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
    onSwapLanguages?: () => void;
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
    theme: FluxTheme;
    themeId: string;
    onThemeChange: (id: string) => void;
    model: string;
    availableModels: string[];
    onModelChange: (model: string) => void;
    collapsed: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
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
}: FluxPopupProps) {
    const [isPinned, setIsPinned] = useState(false);
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

    // Collapsed = compact translation chip (not draggable, follows selection)
    if (isCollapsed) {
        return (
            <div
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                style={{
                    position: 'fixed',
                    left: pos.x,
                    top: pos.y,
                    zIndex: UI_CONSTANTS.Z_INDEX,
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}
                onMouseDown={e => e.stopPropagation()}
            >
                <div
                    style={{
                        backgroundColor: theme.bgSolid,
                        color: theme.text,
                        padding: '8px 14px',
                        borderRadius: '12px',
                        boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${theme.border}`,
                        fontSize: '14px',
                        lineHeight: '1.4',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        maxWidth: '320px',
                        backdropFilter: 'blur(12px)',
                        border: `1px solid ${theme.border}`,
                    }}
                >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {loading ? '...' : error ? 'Error' : result || '—'}
                    </span>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsCollapsed(false); }}
                        style={{
                            background: 'none', border: 'none', color: theme.textSecondary,
                            cursor: 'pointer', padding: '2px', display: 'flex', flexShrink: 0,
                        }}
                        title="Expand"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        style={{
                            background: 'none', border: 'none', color: theme.textSecondary,
                            cursor: 'pointer', padding: '2px', display: 'flex', fontSize: '12px', flexShrink: 0,
                            opacity: 0.6,
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    const popupStyles: React.CSSProperties = {
        backgroundColor: theme.bg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: theme.text,
        width: `${UI_CONSTANTS.POPUP_WIDTH}px`,
        padding: '20px',
        borderRadius: '20px',
        boxShadow: isDragging
            ? `0 30px 60px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px ${theme.border}`
            : `0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px ${theme.border}`,
        fontSize: '13px',
        lineHeight: '1.6',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        border: `1px solid ${theme.border}`,
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
                        isCollapsed={false}
                        onCollapseToggle={() => setIsCollapsed(true)}
                        theme={theme}
                    />
                </div>

                {/* Translation result first — most important content */}
                <FluxContent
                    loading={loading}
                    error={error}
                    result={result}
                    theme={theme}
                />

                <FluxControls
                    mode={mode}
                    targetLang={targetLang}
                    sourceLang={sourceLang}
                    result={result}
                    selection={selection}
                    onModeChange={onModeChange}
                    onLangChange={onLangChange}
                    onSourceLangChange={onSourceLangChange}
                    onSwapLanguages={onSwapLanguages}
                    onAction={onAction}
                    autoSave={autoSave}
                    onAutoSaveChange={onAutoSaveChange}
                    isSaving={isSaving}
                    theme={theme}
                    themeId={themeId}
                    onThemeChange={onThemeChange}
                    model={model}
                    availableModels={availableModels}
                    onModelChange={onModelChange}
                />
            </div>
        </div>
    );
}
