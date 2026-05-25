import { useMemo } from 'react';
import type { SubtitleCue } from '../services/YouTubeService';
import { FluxMinimalPopup } from './FluxMinimalPopup';
import { SubtitleNavigationButton } from './SubtitleNavigationButton';
import { useYouTubeOverlayLogic } from '../hooks/useYouTubeOverlayLogic';
import { getOverlayStyles, getActionAreaStyles } from './YouTubeSubtitleOverlay.styles';
import type { FluxTheme } from '../constants';
import { SubtitleLine } from './SubtitleLine';

interface Props {
    activeCue: SubtitleCue | null;
    prevCue: SubtitleCue | null;
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
    activeCue, prevCue, historyCount = 0, onExport, onHover, onPopupStateChange,
    targetLang, onTargetLangChange, sourceLang, onSourceLangChange,
    onPrev, onNext, hasPrev, hasNext, fluxEnabled, theme,
}: Props) => {
    const logic = useYouTubeOverlayLogic({ cue: activeCue, targetLang, sourceLang, onHover, onPopupStateChange });
    const { hover, draggable, resizable } = logic;

    const activeLines = useMemo(() => {
        const lines = activeCue?.text.split('\n').filter(Boolean) || [];
        return lines.map((line) => ({ tokens: line.split(/(\s+)/), text: line }));
    }, [activeCue]);

    const prevLines = useMemo(() => {
        const lines = prevCue?.text.split('\n').filter(Boolean) || [];
        return lines.map((line) => ({ tokens: line.split(/(\s+)/), text: line }));
    }, [prevCue]);

    const handleSwapLanguages = () => {
        const newSource = targetLang;
        const newTarget = sourceLang === 'Auto' ? 'English' : sourceLang;
        onTargetLangChange(newTarget);
        onSourceLangChange(newSource);
    };

    const overlayPos = draggable.pos;
    const initialOverlayPos = hover.initialOverlayPos;
    let popupX = hover.hoveredWord?.x || 0;
    let popupY = hover.hoveredWord?.y || 0;
    if (hover.hoveredWord && overlayPos && initialOverlayPos) {
        popupX += overlayPos.x - initialOverlayPos.x;
        popupY += overlayPos.y - initialOverlayPos.y;
    }

    if (!fluxEnabled) return null;

    return (
        <>
            <div
                className="flux-youtube-overlay flux-selectable"
                onMouseEnter={(e) => { 
                    const isOverBtn = (e.target as HTMLElement).closest('.flux-nav-btn');
                    if (!isOverBtn) { logic.setIsOverlayHovered(true); onHover(true); }
                }}
                onMouseMove={(e) => {
                    const isOverBtn = (e.target as HTMLElement).closest('.flux-nav-btn');
                    logic.setIsOverlayHovered(!isOverBtn);
                }}
                onMouseLeave={() => { logic.setIsOverlayHovered(false); logic.clearLastTranslatedText(); }}
                onMouseDown={draggable.handleMouseDown}
                onClick={(e) => (e.target as HTMLElement).classList.contains('flux-youtube-overlay') && hover.clearHover()}
                style={getOverlayStyles(draggable.pos, resizable.size, draggable.isDragging, resizable.isResizing, theme)}
            >
                {hasPrev && (
                    <div className="flux-nav-btn">
                        <SubtitleNavigationButton direction="prev" onClick={onPrev} theme={theme} />
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', width: '100%', padding: '12px 24px', minHeight: '120px', margin: '0 auto', maxWidth: '95%' }}>
                    {prevLines.length === 0 && activeLines.length === 0 && <div style={{ opacity: 0, height: '1.2em', marginBottom: '12px', fontSize: '28px' }}>&nbsp;</div>}
                    {prevLines.map((line, lineIdx) => (
                        <SubtitleLine key={`prev-line-${lineIdx}`} tokens={line.tokens} isActive={false} isSentenceMode={logic.isSentenceMode} hoveredWord={hover.hoveredWord} theme={theme} lineIdx={lineIdx} />
                    ))}
                    {activeLines.map((line, lineIdx) => (
                        <SubtitleLine key={`active-line-${lineIdx}`} tokens={line.tokens} isActive={true} isSentenceMode={logic.isSentenceMode} hoveredWord={hover.hoveredWord} theme={theme} onWordHover={hover.onWordHover} onWordLeave={hover.onWordLeave} lineIdx={lineIdx} isLast={lineIdx === activeLines.length - 1} />
                    ))}
                </div>
                <div className="flux-youtube-translation-area" style={getActionAreaStyles(logic.fullError, theme, !!(logic.fullResult || logic.fullLoading || logic.fullError))}>
                    {logic.fullLoading ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', opacity: 0.8 }}>Translating...</span> : logic.fullError ? <span>⚠️ {logic.fullError}</span> : logic.fullResult ? <span>{logic.fullResult}</span> : <span>&nbsp;</span>}
                </div>
                {hasNext && <SubtitleNavigationButton direction="next" onClick={onNext} theme={theme} />}
                {historyCount > 0 && (
                    <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        <button onClick={(e) => { e.stopPropagation(); onExport?.(); }} style={{ background: 'rgba(0,0,0,0.05)', color: theme.textSecondary, border: `1px solid ${theme.border}`, borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}>Export ({historyCount})</button>
                    </div>
                )}
                <div onMouseDown={resizable.handleResizeMouseDown} style={{ position: 'absolute', bottom: '8px', right: '8px', width: '16px', height: '16px', cursor: 'nwse-resize' }}></div>
            </div>
            <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            {hover.hoveredWord && (
                <div style={{ position: 'fixed', top: popupY, left: popupX, zIndex: 2147483647 }}>
                    <FluxMinimalPopup result={logic.result} loading={logic.loading} isDebouncing={hover.isDebouncing} error={logic.error} targetLang={targetLang} onLangChange={onTargetLangChange} sourceLang={sourceLang} onSourceLangChange={onSourceLangChange} onSwapLanguages={handleSwapLanguages} onSave={() => logic.handleSaveWord(hover.hoveredWord!.text, logic.result || undefined)} isSaved={logic.isSaved} saveError={logic.saveError} theme={theme} textToPlay={hover.hoveredWord.text} onMouseEnter={() => { hover.setIsPopupHovered(true); if (hover.timerRef.current) clearTimeout(hover.timerRef.current); }} onMouseLeave={() => { hover.setIsPopupHovered(false); hover.onWordLeave(); }} />
                </div>
            )}
        </>
    );
};
