import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { SubtitleCue } from '../services/YouTubeService';
import { useAIHandler, type Mode } from '../hooks/useAIHandler';
import { FluxMinimalPopup } from './FluxMinimalPopup';
import { wordsApi } from '../../infrastructure/api/words';
import { useReaderStore } from '@/presentation/features/reader/store/useReaderStore';
import { SelectionMode } from '@/core/types';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';
import type { FluxTheme } from '../constants';

interface Props {
    cue: SubtitleCue | null;
    onHover: (hovering: boolean) => void;
    onPopupStateChange?: (active: boolean) => void;
    targetLang: string;
    onTargetLangChange: (lang: string) => void;
    sourceLang: string;
    onSourceLangChange: (lang: string) => void;
    autoSave: boolean;
    onAutoSaveChange: (enabled: boolean) => void;
    onPrev?: () => void;
    onNext?: () => void;
    hasPrev?: boolean;
    hasNext?: boolean;
    fluxEnabled: boolean;
    theme: FluxTheme;
}

export const YouTubeSubtitleOverlay = ({
    cue,
    onHover,
    onPopupStateChange,
    targetLang,
    onTargetLangChange,
    sourceLang,
    onSourceLangChange,
    autoSave,
    onAutoSaveChange,
    onPrev,
    onNext,
    hasPrev,
    hasNext,
    fluxEnabled,
    theme,
}: Props) => {
    const [hoveredWord, setHoveredWord] = useState<{ text: string, x: number, y: number } | null>(null);
    const [isPopupHovered, setIsPopupHovered] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [mode] = useState<Mode>('TRANSLATE'); // Only translate in simplified mode
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // AI Handlers
    const { result, loading, error, handleAction, setResult } = useAIHandler();
    const { result: fullResult, loading: fullLoading, error: fullError, handleAction: handleFullAction, setResult: setFullResult } = useAIHandler();

    // ... (rest of code)



    const { selectionMode } = useReaderStore();

    const { pos, isDragging, handleMouseDown } = useDraggable({
        initialPos: { x: window.innerWidth / 2, y: window.innerHeight * 0.85 }
    });

    const { size, handleResizeMouseDown } = useResizable({
        initialSize: { width: 800, height: 160 }
    });

    const tokens = useMemo(() => cue?.text.split(/(\s+)/) || [], [cue]);
    const isSentenceMode = selectionMode === SelectionMode.Sentence;

    useEffect(() => {
        onPopupStateChange?.(!!hoveredWord);
    }, [hoveredWord, onPopupStateChange]);

    const handleSaveWord = useCallback(async (text: string, definition?: string) => {
        try {
            await wordsApi.create({
                text: text,
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                context: cue?.text || window.location.href,
                definition: definition
            });
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (err) {
            console.error('[Flux YouTube] Failed to save word:', err);
        }
    }, [sourceLang, targetLang, cue]);
    const hoverDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);


    const lastHoveredWord = useRef('');

     
    const onWordHover = useCallback((event: React.MouseEvent, word: string) => {
        const cleanWord = word.trim().replace(/[.,!?;:]/g, '');
        if (cleanWord.length === 0 && !isSentenceMode) return;

        const textToProcess = isSentenceMode && cue ? cue.text : cleanWord;

        // Skip if same word is already being processed
        if (textToProcess === lastHoveredWord.current) return;
        lastHoveredWord.current = textToProcess;

        if (timerRef.current) clearTimeout(timerRef.current);
        if (hoverDebounceRef.current) clearTimeout(hoverDebounceRef.current);

        const rect = (event.target as HTMLElement).getBoundingClientRect();

        // Show popup frame immediately for responsiveness
        setHoveredWord({ text: textToProcess, x: rect.left + rect.width / 2, y: rect.top });

        // Debounce the actual AI call
        hoverDebounceRef.current = setTimeout(() => {
            handleAction(textToProcess, mode, targetLang, sourceLang, cue?.text);
        }, 350);
    }, [isSentenceMode, cue, mode, targetLang, sourceLang, handleAction]);

    const onWordLeave = useCallback(() => {
        if (hoverDebounceRef.current) clearTimeout(hoverDebounceRef.current);
        timerRef.current = setTimeout(() => {
            if (!isPopupHovered) {
                setHoveredWord(null);
                setResult('');
                lastHoveredWord.current = '';
            }
        }, 150);
    }, [isPopupHovered, setResult]);

    const [isOverlayHovered, setIsOverlayHovered] = useState(false);

    // Combined hover state — used only for translation cleanup
    const isInteracting = isOverlayHovered || !!hoveredWord || isPopupHovered;

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

    const lastTranslatedText = useRef<string>('');

    const handleOverlayLeave = () => {
        setIsOverlayHovered(false);
        // Reliance on isInteracting effect for cleanup to allow for "bridge" to popup
        lastTranslatedText.current = '';
    };

    const isFirstMount = useRef(true);

    // Clear full translation when cue changes
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        setFullResult('');
    }, [cue?.text, setFullResult]);




    // Re-translate when cue changes while overlay is hovered (navigation)
    const prevTargetLang = useRef(targetLang);
    const prevSourceLang = useRef(sourceLang);

    // 1. Re-translate when cue changes while overlay is hovered (navigation)
    useEffect(() => {
        // Only trigger if hovered and text is new/different, AND we don't have a result yet
        // Check for fullResult to avoid re-translation, but if languages change we should re-translate
        if (isOverlayHovered && cue?.text && (cue.text !== lastTranslatedText.current && !fullResult)) {
            lastTranslatedText.current = cue.text;
            handleFullAction(cue.text, 'TRANSLATE', targetLang, sourceLang, 'YouTube Subtitle');
        }
    }, [cue?.text, isOverlayHovered, handleFullAction, targetLang, sourceLang, fullResult]);

    // 2. Re-translate when language changes explicitly
    useEffect(() => {
        const langChanged = targetLang !== prevTargetLang.current || sourceLang !== prevSourceLang.current;
        prevTargetLang.current = targetLang;
        prevSourceLang.current = sourceLang;

        if (langChanged && cue?.text) {
            // Force re-translation even if we have a result
            lastTranslatedText.current = cue.text;
            handleFullAction(cue.text, 'TRANSLATE', targetLang, sourceLang, 'YouTube Subtitle');
        }
    }, [targetLang, sourceLang, cue?.text, handleFullAction]);

    // Re-translate hovered word when language changes (not on hoveredWord change — that's handled by onWordHover)
    const prevWordLangTarget = useRef(targetLang);
    const prevWordLangSource = useRef(sourceLang);
    useEffect(() => {
        const changed = targetLang !== prevWordLangTarget.current || sourceLang !== prevWordLangSource.current;
        prevWordLangTarget.current = targetLang;
        prevWordLangSource.current = sourceLang;
        if (changed && hoveredWord) {
            handleAction(hoveredWord.text, mode, targetLang, sourceLang, cue?.text);
        }
    }, [targetLang, sourceLang]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSwapLanguages = () => {
        const newSource = targetLang;
        // Fallback to English if source was Auto - typical behavior for swapping
        const newTarget = sourceLang === 'Auto' ? 'English' : sourceLang;

        onTargetLangChange(newTarget);
        onSourceLangChange(newSource);
    };

    if (!fluxEnabled || !cue) return null;

    const overlayStyles: React.CSSProperties = {
        position: 'fixed',
        top: pos.y,
        left: pos.x,
        width: size.width,
        height: 'auto',
        minHeight: size.height,
        transform: isDragging ? 'translate(-50%, -50%) scale(1.02)' : 'translate(-50%, -50%) scale(1)',
        backgroundColor: theme.bg.replace(/[\d.]+\)$/, '0.95)'),
        backdropFilter: 'blur(16px)',
        color: theme.text,
        padding: '24px 72px 24px',
        borderRadius: '24px',
        fontSize: '32px',
        fontWeight: 600,
        zIndex: 2147483646,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging
            ? `0 30px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px ${theme.border}`
            : `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px ${theme.border}`,
        border: `1px solid ${theme.border}`,
        transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), top 0.1s ease-out, left 0.1s ease-out',
        userSelect: 'none',
        overflow: 'hidden'
    };

    return (
        <>
            <div
                className="flux-youtube-overlay flux-selectable"
                onMouseEnter={handleOverlayEnter}
                onMouseLeave={handleOverlayLeave}
                onMouseDown={handleMouseDown}
                style={overlayStyles}
            >
                {/* Previous Button */}
                {hasPrev && (
                    <div
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                        style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            padding: '12px',
                            borderRadius: '50%',
                            backgroundColor: theme.border,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            zIndex: 10
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.surface)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.border)}
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </div>
                )}

                {/* Subtitle Tokens Container */}
                <div
                    style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '90%' }}
                    onMouseOver={(e) => {
                        const el = (e.target as HTMLElement).closest('[data-flux-token]') as HTMLElement | null;
                        if (el?.dataset.fluxToken) onWordHover(e as unknown as React.MouseEvent, el.dataset.fluxToken);
                    }}
                    onMouseLeave={onWordLeave}
                >
                    {tokens.map((token, i) => {
                        const clean = token.trim().replace(/[.,!?;:]/g, '');
                        return (
                            <span
                                key={`token-${i}`}
                                data-flux-token={clean || undefined}
                                onClick={() => {
                                    if (cue && clean.length > 0) {
                                        const isMatchingHover = hoveredWord?.text === clean;
                                        handleSaveWord(clean, isMatchingHover ? result : undefined);
                                    }
                                }}
                                style={{
                                    cursor: clean ? 'pointer' : 'default',
                                    display: 'inline-block',
                                    transition: 'all 0.2s ease',
                                    margin: '0 4px',
                                    color: (isSentenceMode && hoveredWord) ? theme.accent : undefined,
                                    transform: (isSentenceMode && hoveredWord) ? 'scale(1.05)' : undefined,
                                }}
                            >
                                {token}
                            </span>
                        );
                    })}
                </div>

                {/* Automation Translation Display */}
                {/* Automation Translation Display */}
                {(fullResult || fullLoading || fullError) && (
                    <div style={{
                        fontSize: '20px',
                        color: fullError ? theme.error : theme.textSecondary,
                        fontWeight: 500,
                        fontStyle: 'normal',
                        padding: '12px 24px',
                        textAlign: 'center',
                        width: '100%',
                        maxWidth: '85%',
                        borderTop: `1px solid ${theme.border}`,
                        marginTop: '8px',
                        animation: 'fadeIn 0.3s ease-in-out'
                    }}>
                        {fullLoading ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
                                <span className="animate-spin">⟳</span> Translating...
                            </span>
                        ) : fullError ? (
                            <span style={{ animation: 'flux-fade-in 0.2s ease-out' }}>
                                ⚠️ {fullError}
                            </span>
                        ) : (
                            <span style={{ animation: 'flux-fade-in 0.2s ease-out' }}>
                                {fullResult}
                            </span>
                        )}
                    </div>
                )}

                {/* Next Button */}
                {hasNext && (
                    <div
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                        style={{
                            position: 'absolute',
                            right: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            padding: '12px',
                            borderRadius: '50%',
                            backgroundColor: theme.border,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            zIndex: 10
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.surface)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.border)}
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </div>
                )}

                {/* Resize Handle */}
                <div
                    onMouseDown={handleResizeMouseDown}
                    style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        width: '16px',
                        height: '16px',
                        cursor: 'nwse-resize',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.5,
                        transition: 'opacity 0.2s'
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

            {
                hoveredWord && (
                    <div
                        style={{
                            position: 'fixed',
                            top: hoveredWord.y,
                            left: hoveredWord.x,
                            zIndex: 2147483647
                        }}
                    >
                        <FluxMinimalPopup
                            result={result}
                            loading={loading}
                            error={error}
                            targetLang={targetLang}
                            onLangChange={onTargetLangChange}
                            sourceLang={sourceLang}
                            onSourceLangChange={onSourceLangChange}
                            onSwapLanguages={handleSwapLanguages}
                            autoSave={autoSave}
                            onAutoSaveChange={onAutoSaveChange}
                            isSaved={isSaved}
                            onMouseEnter={() => { setIsPopupHovered(true); if (timerRef.current) clearTimeout(timerRef.current); }}
                            onMouseLeave={() => { setIsPopupHovered(false); onWordLeave(); }}
                        />
                    </div>
                )
            }
        </>
    );
};
