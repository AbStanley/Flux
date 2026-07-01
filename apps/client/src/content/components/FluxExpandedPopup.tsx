import type { CSSProperties, MouseEvent, RefObject } from 'react';
import type { Mode } from '../hooks/useAIHandler';
import { FluxHeader } from './FluxHeader';
import { FluxControls } from './FluxControls';
import { FluxContent } from './FluxContent';
import { UI_CONSTANTS, type FluxTheme } from '../constants';

interface FluxExpandedPopupProps {
    popupRef: RefObject<HTMLDivElement | null>;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onAutoPlay?: () => void;
    positioning: CSSProperties;
    isDragging: boolean;
    handleMouseDown: (e: MouseEvent) => void;
    loading: boolean;
    error: string | null;
    result: string;
    theme: FluxTheme;
    isSaving?: boolean;
    onClose: () => void;
    handlePinToggle: () => void;
    handleInternalSave: () => void;
    isPinned: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    selection: { text: string; x: number; y: number };
    mode: Mode;
    targetLang: string;
    sourceLang?: string;
    onModeChange: (mode: Mode) => void;
    onLangChange: (lang: string) => void;
    onSourceLangChange?: (lang: string) => void;
    onSwapLanguages?: () => void;
    onAction: () => void;
    autoSave: boolean;
    onAutoSaveChange: (enabled: boolean) => void;
    themeId: string;
    onThemeChange: (id: string) => void;
    model: string;
    availableModels: string[];
    onModelChange: (model: string) => void;
}

export function FluxExpandedPopup({
    popupRef,
    onMouseEnter,
    onMouseLeave,
    onAutoPlay,
    positioning,
    isDragging,
    handleMouseDown,
    loading,
    error,
    result,
    theme,
    isSaving,
    onClose,
    handlePinToggle,
    handleInternalSave,
    isPinned,
    setIsCollapsed,
    selection,
    mode,
    targetLang,
    sourceLang,
    onModeChange,
    onLangChange,
    onSourceLangChange,
    onSwapLanguages,
    onAction,
    autoSave,
    onAutoSaveChange,
    themeId,
    onThemeChange,
    model,
    availableModels,
    onModelChange,
}: FluxExpandedPopupProps) {
    const popupStyles: CSSProperties = {
        background: theme.bg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: theme.text,
        width: `${UI_CONSTANTS.POPUP_WIDTH}px`,
        padding: '0',
        borderRadius: '16px',
        boxShadow: isDragging
            ? `0 20px 40px -12px rgba(0,0,0,0.45), 0 0 0 1px ${theme.border}`
            : `0 12px 32px rgba(0,0,0,0.35), 0 0 0 1px ${theme.border}`,
        fontSize: '13px',
        lineHeight: '1.6',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        border: `1px solid ${theme.border}`,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        overflow: 'hidden',
        position: 'relative', // Ensure relative positioning context for loading bar clipping
    };

    return (
        <div
            ref={popupRef}
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
            <div style={{ ...popupStyles, background: theme.bg }}>
                {/* Global loading bar */}
                {loading && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: `linear-gradient(90deg, ${theme.accent} 0%, ${theme.info} 50%, ${theme.accent} 100%)`,
                        backgroundSize: '200% 100%',
                        animation: 'flux-loading-bar 1.5s infinite linear',
                        zIndex: 10, // Removed manual borderTopLeftRadius / borderTopRightRadius as parent's overflow:hidden clips it!
                    }} />
                )}

                {/* Animation keyframes */}
                <style>
                    {`
                        @keyframes flux-loading-bar {
                            0% { background-position: 200% 0; }
                            100% { background-position: -200% 0; }
                        }
                    `}
                </style>

                <div onMouseDown={handleMouseDown} style={{ padding: '16px 20px 8px' }}>
                    <FluxHeader
                        onClose={onClose}
                        onPinToggle={handlePinToggle}
                        onSave={handleInternalSave}
                        isPinned={isPinned}
                        isCollapsed={false}
                        onCollapseToggle={() => setIsCollapsed(true)}
                        isSaving={isSaving}
                        result={result}
                        loading={loading}
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
                        onRetry={onAction}
                    />
                </div>

                <div style={{
                    background: `${theme.surface}e6`, // 90% opacity to let blur through
                    borderTop: `1px solid ${theme.borderLight}`,
                    padding: '12px 20px 16px',
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
