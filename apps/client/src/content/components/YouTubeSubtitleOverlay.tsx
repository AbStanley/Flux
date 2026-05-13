import { useMemo } from 'react';
import type { SubtitleCue } from '../services/YouTubeService';
import { FluxMinimalPopup } from './FluxMinimalPopup';
import { SubtitleNavigationButton } from './SubtitleNavigationButton';
import { useYouTubeOverlayLogic } from '../hooks/useYouTubeOverlayLogic';
import { getOverlayStyles, getActionAreaStyles } from './YouTubeSubtitleOverlay.styles';
import type { FluxTheme } from '../constants';

interface Props {
    cue: SubtitleCue | null;
    historyCount?: number;
    onExport?: () => void;
    onHover: (hovering: boolean) => void;
    onPopupStateChange?: (active: boolean) => void;
    targetLang: string;
    onTargetLangChange: (lang: string) => void;
    sourceLang: string;
    onSourceLangChange: (lang: string) => void;
    onPrev?: () => void;
    onNext?: () => void;
    hasPrev?: boolean;
    hasNext?: boolean;
    fluxEnabled: boolean;
    theme: FluxTheme;
}

export const YouTubeSubtitleOverlay = ({
    cue, historyCount = 0, onExport, onHover, onPopupStateChange,
    targetLang, onTargetLangChange, sourceLang, onSourceLangChange,
    onPrev, onNext, hasPrev, hasNext, fluxEnabled, theme,
}: Props) => {
    const logic = useYouTubeOverlayLogic({ cue, targetLang, sourceLang, onHover, onPopupStateChange });
    const { hover, draggable, resizable } = logic;

    const visibleTokens = useMemo(() => {
        const t = cue?.text.split(/(\s+)/) || [];
        return t.length > 60 ? t.slice(-60) : t;
    }, [cue]);

    const handleSwapLanguages = () => {
        const newSource = targetLang;
        const newTarget = sourceLang === 'Auto' ? 'English' : sourceLang;
        onTargetLangChange(newTarget);
        onSourceLangChange(newSource);
    };

    if (!fluxEnabled || !cue) return null;

    return (
        <>
            <div
                className="flux-youtube-overlay flux-selectable"
                onMouseEnter={() => { logic.setIsOverlayHovered(true); onHover(true); }}
                onMouseLeave={() => { logic.setIsOverlayHovered(false); logic.clearLastTranslatedText(); }}
                onMouseDown={draggable.handleMouseDown}
                onClick={(e) => (e.target as HTMLElement).classList.contains('flux-youtube-overlay') && hover.clearHover()}
                style={getOverlayStyles(draggable.pos, resizable.size, draggable.isDragging, resizable.isResizing, theme)}
            >
                {hasPrev && <SubtitleNavigationButton direction="prev" onClick={onPrev} theme={theme} />}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '8px 0' }}>
                    <div
                        style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', width: 'max-content', maxWidth: '100%' }}
                        onMouseOver={(e) => {
                            const el = (e.target as HTMLElement).closest('[data-flux-token]') as HTMLElement | null;
                            if (el?.dataset.fluxToken) hover.onWordHover(e as unknown as React.MouseEvent, el.dataset.fluxToken);
                        }}
                        onMouseLeave={hover.onWordLeave}
                    >
                        {visibleTokens.map((token, i) => {
                            const clean = token.trim().replace(/[.,!?;:]/g, '');
                            const isHov = !logic.isSentenceMode && hover.hoveredWord?.text === clean;
                            const highlight = (logic.isSentenceMode && hover.hoveredWord) || isHov;
                            return (
                                <span key={`t-${i}`} data-flux-token={clean || undefined} onClick={(e) => e.stopPropagation()}
                                    style={{
                                        cursor: clean ? 'pointer' : 'default', display: 'inline-block', transition: 'all 0.2s ease', margin: '0 2px', padding: '1px 4px', borderRadius: '6px',
                                        color: highlight ? theme.accent : theme.textSecondary, backgroundColor: isHov ? theme.accentGlow : 'transparent',
                                        transform: highlight ? 'scale(1.05)' : 'scale(1)', fontWeight: highlight ? 700 : 600,
                                    }}>
                                    {token}
                                </span>
                            );
                        })}
                    </div>
                </div>

                <div className="flux-youtube-translation-area" style={getActionAreaStyles(logic.fullError, theme, !!(logic.fullResult || logic.fullLoading || logic.fullError))}>
                    {logic.fullLoading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', opacity: 0.8 }}>
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.2 }} /><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" /></svg>
                        <span>Translating...</span></span> : logic.fullError ? <span>⚠️ {logic.fullError}</span> : logic.fullResult ? <span>{logic.fullResult}</span> : <span>&nbsp;</span>}
                </div>

                {hasNext && <SubtitleNavigationButton direction="next" onClick={onNext} theme={theme} />}

                {historyCount > 0 && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onExport?.(); }} 
                            className="flux-subtle-export"
                            style={{ 
                                background: 'rgba(0,0,0,0.05)', color: theme.textSecondary, border: `1px solid ${theme.border}`, 
                                borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', 
                                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease',
                                opacity: 0.6
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = theme.bgSolid; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                            Export ({historyCount})
                        </button>
                    </div>
                )}

                <div onMouseDown={resizable.handleResizeMouseDown} style={{ position: 'absolute', bottom: '8px', right: '8px', width: '16px', height: '16px', cursor: 'nwse-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="21" x2="9" y2="21" /><line x1="21" y1="21" x2="21" y2="9" /></svg>
                </div>
            </div>

            <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .flux-youtube-overlay button:active { transform: scale(0.95); }`}</style>

            {hover.hoveredWord && (
                <div style={{ position: 'fixed', top: hover.hoveredWord.y, left: hover.hoveredWord.x, zIndex: 2147483647 }}>
                    <FluxMinimalPopup
                        result={logic.result} loading={logic.loading} isDebouncing={hover.isDebouncing} error={logic.error}
                        targetLang={targetLang} onLangChange={onTargetLangChange}
                        sourceLang={sourceLang} onSourceLangChange={onSourceLangChange}
                        onSwapLanguages={handleSwapLanguages}
                        onSave={() => logic.handleSaveWord(hover.hoveredWord!.text, logic.result || undefined)}
                        isSaved={logic.isSaved} saveError={logic.saveError} theme={theme} textToPlay={hover.hoveredWord.text}
                        onMouseEnter={() => { hover.setIsPopupHovered(true); if (hover.timerRef.current) clearTimeout(hover.timerRef.current); }}
                        onMouseLeave={() => { hover.setIsPopupHovered(false); hover.onWordLeave(); }}
                    />
                </div>
            )}
        </>
    );
};
