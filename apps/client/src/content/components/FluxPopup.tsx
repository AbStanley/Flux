import { useState, useCallback, useEffect } from 'react';
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
            onSave(selection.text, result || undefined);
        } else {
            selectAndOpen(selection.text);
        }
    }, [onSave, selection.text, result, selectAndOpen]);

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

    // Collapsed = compact translation chip (not draggable, follows selection)
    if (isCollapsed) {
        return (
            <div
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                style={{
                    ...positioning,
                    zIndex: UI_CONSTANTS.Z_INDEX,
                    fontFamily: 'Inter, system-ui, sans-serif',
                }}
                onMouseDown={e => e.stopPropagation()}
            >
                <div
                    style={{
                        backgroundColor: theme.bgSolid,
                        color: theme.text,
                        borderRadius: '12px',
                        boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${theme.border}`,
                        fontSize: '14px',
                        lineHeight: '1.5',
                        width: 'max-content',
                        maxWidth: 'min(480px, 90vw)',
                        backdropFilter: 'blur(12px)',
                        border: `1px solid ${theme.border}`,
                        overflow: 'hidden',
                    }}
                >
                    {/* Translation text */}
                    <div style={{ padding: '10px 14px', maxHeight: '200px', overflowY: 'auto', fontWeight: 500 }}>
                        {loading ? '...' : error ? 'Error' : result || '—'}
                    </div>

                    {/* Action bar */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                        gap: '2px', padding: '4px 8px',
                        borderTop: `1px solid ${theme.border}`,
                    }}>
                        {[
                            { title: 'Save to vocabulary', color: theme.accent, onClick: () => handleInternalSave(), icon: <><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /><line x1="12" y1="7" x2="12" y2="13" /><line x1="9" y1="10" x2="15" y2="10" /></> },
                            { title: 'Expand', color: theme.textSecondary, onClick: () => { setIsPinned(false); onPinChange?.(false); setIsCollapsed(false); }, icon: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /> },
                            { title: 'Close', color: theme.textSecondary, onClick: () => onClose(), icon: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> },
                        ].map((btn) => (
                            <button
                                key={btn.title}
                                onClick={(e) => { e.stopPropagation(); btn.onClick(); }}
                                title={btn.title}
                                style={{
                                    background: 'none', border: 'none', color: btn.color,
                                    cursor: 'pointer', padding: '4px', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    width: '24px', height: '24px', borderRadius: '6px',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.surface)}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    {btn.icon}
                                </svg>
                            </button>
                        ))}
                    </div>
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
        padding: '0',
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
                ...positioning,
                zIndex: UI_CONSTANTS.Z_INDEX,
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: isDragging ? UI_CONSTANTS.TRANSITION_DRAGGING : UI_CONSTANTS.TRANSITION_DEFAULT
            }}
            onMouseDown={e => e.stopPropagation()}
        >
            <div style={popupStyles}>
                <div onMouseDown={handleMouseDown} style={{ padding: '16px 20px 8px' }}>
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
                <div style={{ padding: '0 20px 12px' }}>
                    <FluxContent
                        loading={loading}
                        error={error}
                        result={result}
                        theme={theme}
                    />
                </div>

                <div style={{ 
                    background: theme.surface, 
                    borderTop: `1px solid ${theme.borderLight}`, 
                    padding: '12px 20px 16px',
                    borderBottomLeftRadius: '20px',
                    borderBottomRightRadius: '20px'
                }}>
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
        </div>
    );
}
