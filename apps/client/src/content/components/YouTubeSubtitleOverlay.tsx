import { useState, useEffect, useMemo } from 'react';
import type { SubtitleCue } from '../services/YouTubeService';
import { useAIHandler } from '../hooks/useAIHandler';
import { FluxMinimalPopup } from './FluxMinimalPopup';
import { SubtitleNavigationButton } from './SubtitleNavigationButton';
import { useReaderStore } from '@/presentation/features/reader/store/useReaderStore';
import { SelectionMode } from '@/core/types';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';
import { useSubtitleHover } from '../hooks/useSubtitleHover';
import { useLanguageSync } from '../hooks/useLanguageSync';
import { useSaveWord } from '../hooks/useSaveWord';
import type { FluxTheme } from '../constants';

interface Props {
    cue: SubtitleCue | null;
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
    cue, onHover, onPopupStateChange,
    targetLang, onTargetLangChange, sourceLang, onSourceLangChange,
    onPrev, onNext, hasPrev, hasNext, fluxEnabled, theme,
}: Props) => {
    const [mode] = useState<'TRANSLATE'>('TRANSLATE');
    const [isOverlayHovered, setIsOverlayHovered] = useState(false);

    const { result, loading, error, handleAction, setResult } = useAIHandler();
    const { result: fullResult, loading: fullLoading, error: fullError, handleAction: handleFullAction, setResult: setFullResult } = useAIHandler();

    const { selectionMode } = useReaderStore();
    const { pos, isDragging, handleMouseDown } = useDraggable({ initialPos: { x: window.innerWidth / 2, y: window.innerHeight * 0.85 } });
    const { size, handleResizeMouseDown } = useResizable({ initialSize: { width: 800, height: 120 } });

    const tokens = useMemo(() => cue?.text.split(/(\s+)/) || [], [cue]);
    const isSentenceMode = selectionMode === SelectionMode.Sentence;

    const hover = useSubtitleHover({ isSentenceMode, cue, mode, targetLang, sourceLang, handleAction, setResult });
    const { isSaved, saveError, handleSaveWord } = useSaveWord({ sourceLang, targetLang, context: cue?.text });
    const { clearLastTranslatedText } = useLanguageSync({
        targetLang, sourceLang, cue, isOverlayHovered,
        hoveredWord: hover.hoveredWord, fullResult,
        handleFullAction, handleAction, mode, setFullResult,
    });

    useEffect(() => {
        onPopupStateChange?.(!!hover.hoveredWord);
    }, [hover.hoveredWord, onPopupStateChange]);

    // Cleanup when all interaction ends
    const isInteracting = isOverlayHovered || !!hover.hoveredWord || hover.isPopupHovered;
    useEffect(() => {
        if (!isInteracting) {
            const timeout = setTimeout(() => {
                onHover(false);
                setFullResult('');
                setResult('');
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [isInteracting, onHover, setFullResult, setResult]);

    const handleOverlayEnter = () => {
        setIsOverlayHovered(true);
        onHover(true);
    };

    const handleOverlayLeave = () => {
        setIsOverlayHovered(false);
        clearLastTranslatedText();
    };

    const handleSwapLanguages = () => {
        const newSource = targetLang;
        const newTarget = sourceLang === 'Auto' ? 'English' : sourceLang;
        onTargetLangChange(newTarget);
        onSourceLangChange(newSource);
    };

    if (!fluxEnabled || !cue) return null;

    const overlayStyles: React.CSSProperties = {
        position: 'fixed',
        top: pos.y, left: pos.x,
        width: size.width, height: 'auto', minHeight: size.height,
        transform: isDragging ? 'translate(-50%, -50%) scale(1.02)' : 'translate(-50%, -50%) scale(1)',
        backgroundColor: theme.bgSolid,
        backdropFilter: 'blur(16px)', color: theme.text,
        padding: '16px 48px', borderRadius: '20px',
        fontSize: '28px', fontWeight: 600, zIndex: 2147483646,
        textAlign: 'center', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start', gap: '0px',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging
            ? `0 30px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px ${theme.border}`
            : `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px ${theme.border}`,
        border: `1px solid ${theme.border}`,
        transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), top 0.1s ease-out, left 0.1s ease-out',
        userSelect: 'none', overflow: 'hidden',
    };

    return (
        <>
            <div
                className="flux-youtube-overlay flux-selectable"
                onMouseEnter={handleOverlayEnter}
                onMouseLeave={handleOverlayLeave}
                onMouseDown={handleMouseDown}
                onClick={(e) => {
                    const target = e.target as HTMLElement;
                    // Clear if clicking the overlay container or the translation area
                    // But NOT if clicking navigation buttons or tokens (tokens already stopProp)
                    if (target.classList.contains('flux-youtube-overlay') || 
                        target.closest('.flux-youtube-translation-area')) {
                        hover.clearHover();
                    }
                }}
                style={overlayStyles}
            >
                {hasPrev && <SubtitleNavigationButton direction="prev" onClick={onPrev} theme={theme} />}


                {/* Subtitle Tokens — vertically centered in upper area */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <div
                        style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '90%' }}
                        onMouseOver={(e) => {
                            const el = (e.target as HTMLElement).closest('[data-flux-token]') as HTMLElement | null;
                            if (el?.dataset.fluxToken) hover.onWordHover(e as unknown as React.MouseEvent, el.dataset.fluxToken);
                        }}
                        onMouseLeave={hover.onWordLeave}
                    >
                        {tokens.map((token, i) => {
                            const clean = token.trim().replace(/[.,!?;:]/g, '');
                            const isHovered = !isSentenceMode && hover.hoveredWord?.text === clean;
                            const shouldHighlight = (isSentenceMode && hover.hoveredWord) || isHovered;
                            
                            return (
                                <span
                                    key={`token-${i}`}
                                    data-flux-token={clean || undefined}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        cursor: clean ? 'pointer' : 'default',
                                        display: 'inline-block', 
                                        transition: 'all 0.2s ease', 
                                        margin: '0 4px',
                                        padding: '1px 4px',
                                        borderRadius: '6px',
                                        color: shouldHighlight ? theme.accent : theme.textSecondary,
                                        backgroundColor: isHovered ? theme.accentGlow : 'transparent',
                                        transform: shouldHighlight ? 'scale(1.05)' : 'scale(1)',
                                        fontWeight: shouldHighlight ? 700 : 600,
                                    }}
                                >
                                    {token}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Full Translation — always reserved space, content fades in/out */}
                <div 
                    className="flux-youtube-translation-area"
                    style={{
                    fontSize: '18px', color: fullError ? theme.error : theme.textSecondary,
                    fontWeight: 500, padding: '8px 24px', textAlign: 'center',
                    width: '100%', maxWidth: '85%', borderTop: `1px solid ${theme.border}`,
                    minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: (fullResult || fullLoading || fullError) ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                }}>
                    {fullLoading ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', opacity: 0.8 }}>
                            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.2 }} />
                                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                            </svg>
                            <span>Translating...</span>
                        </span>
                    ) : fullError ? (
                        <span>⚠️ {fullError}</span>
                    ) : fullResult ? (
                        <span>{fullResult}</span>
                    ) : (
                        <span>&nbsp;</span>
                    )}
                </div>

                {hasNext && <SubtitleNavigationButton direction="next" onClick={onNext} theme={theme} />}

                {/* Resize Handle */}
                <div
                    onMouseDown={handleResizeMouseDown}
                    style={{
                        position: 'absolute', bottom: '8px', right: '8px', width: '16px', height: '16px',
                        cursor: 'nwse-resize', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0.5, transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="21" y1="21" x2="9" y2="21" />
                        <line x1="21" y1="21" x2="21" y2="9" />
                    </svg>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {hover.hoveredWord && (
                <div style={{ position: 'fixed', top: hover.hoveredWord.y, left: hover.hoveredWord.x, zIndex: 2147483647 }}>
                    <FluxMinimalPopup
                        result={result} loading={loading} isDebouncing={hover.isDebouncing} error={error}
                        targetLang={targetLang} onLangChange={onTargetLangChange}
                        sourceLang={sourceLang} onSourceLangChange={onSourceLangChange}
                        onSwapLanguages={handleSwapLanguages}
                        onSave={() => { if (hover.hoveredWord) handleSaveWord(hover.hoveredWord.text, result || undefined); }}
                        isSaved={isSaved} saveError={saveError} theme={theme}
                        textToPlay={hover.hoveredWord?.text}
                        onMouseEnter={() => { hover.setIsPopupHovered(true); if (hover.timerRef.current) clearTimeout(hover.timerRef.current); }}
                        onMouseLeave={() => { hover.setIsPopupHovered(false); hover.onWordLeave(); }}
                    />
                </div>
            )}
        </>
    );
};
