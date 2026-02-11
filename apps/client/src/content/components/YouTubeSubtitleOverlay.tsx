import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { SubtitleCue } from '../services/YouTubeService';
import { useAIHandler, type Mode } from '../hooks/useAIHandler';
import { FluxMinimalPopup } from './FluxMinimalPopup';
import { wordsApi } from '../../infrastructure/api/words';
import { useReaderStore } from '@/presentation/features/reader/store/useReaderStore';
import { SelectionMode } from '@/core/types';
import { useDraggable } from '../hooks/useDraggable';
import { useResizable } from '../hooks/useResizable';
import { SubtitleToken } from './SubtitleToken';

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
    fluxEnabled
}: Props) => {
    const [hoveredWord, setHoveredWord] = useState<{ text: string, x: number, y: number } | null>(null);
    const [isPopupHovered, setIsPopupHovered] = useState(false);
    const [mode] = useState<Mode>('TRANSLATE'); // Only translate in simplified mode
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // AI Handlers
    const { result, loading, handleAction, setResult } = useAIHandler();
    const { result: fullResult, loading: fullLoading, handleAction: handleFullAction, setResult: setFullResult } = useAIHandler();

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

    const handleSaveWord = useCallback(async (text: string) => {
        try {
            await wordsApi.create({
                text: text,
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                context: cue?.text || window.location.href,
            });
        } catch (err) {
            console.error('[Flux YouTube] Failed to save word:', err);
        }
    }, [sourceLang, targetLang, cue]);

    const onWordHover = useCallback((event: React.MouseEvent, word: string) => {
        const cleanWord = word.trim().replace(/[.,!?;:]/g, '');
        if (cleanWord.length === 0 && !isSentenceMode) return;
        if (timerRef.current) clearTimeout(timerRef.current);

        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const textToProcess = isSentenceMode && cue ? cue.text : cleanWord;

        setHoveredWord({ text: textToProcess, x: rect.left + rect.width / 2, y: rect.top });
        onHover(true);
        handleAction(textToProcess, mode, targetLang, sourceLang);
    }, [isSentenceMode, cue, mode, targetLang, sourceLang, onHover, handleAction]);

    const onWordLeave = useCallback(() => {
        timerRef.current = setTimeout(() => {
            if (!isPopupHovered) {
                setHoveredWord(null);
                onHover(false);
                setResult('');
            }
        }, 300);
    }, [isPopupHovered, onHover, setResult]);

    const [isOverlayHovered, setIsOverlayHovered] = useState(false);

    // Combined hover state
    const isInteracting = isOverlayHovered || !!hoveredWord || isPopupHovered;

    useEffect(() => {
        if (isInteracting) {
            onHover(true);
        } else {
            const timeout = setTimeout(() => {
                onHover(false);
                setFullResult('');
            }, 150);
            return () => clearTimeout(timeout);
        }
    }, [isInteracting, onHover, setFullResult]);

    const handleOverlayEnter = () => {
        setIsOverlayHovered(true);
        if (cue?.text && !fullResult && !fullLoading) {
            handleFullAction(cue.text, 'TRANSLATE', targetLang, sourceLang);
        }
    };

    const handleOverlayLeave = () => {
        setIsOverlayHovered(false);
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
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        color: '#f8fafc',
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
            ? '0 30px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
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
                        onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                        style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            padding: '12px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            zIndex: 10
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </div>
                )}

                {/* Subtitle Tokens Container */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '90%' }}>
                    {tokens.map((token, i) => (
                        <SubtitleToken
                            key={i}
                            token={token}
                            isHovered={!!hoveredWord}
                            isSentenceMode={isSentenceMode}
                            onMouseEnter={(e) => onWordHover(e, token)}
                            onMouseLeave={onWordLeave}
                            onClick={() => {
                                // Save on click for simplified mode? Or just relying on auto-save?
                                // User said "option of auto save", likely implying manual save is less prioritized or exists via popup.
                                // Let's keep click-to-save-and-pin behavior removed as per request for "simpler". 
                                // Actually, simplified mode usually means click doesn't pin anymore if we want it to verify strict hover.
                                if (autoSave && cue) {
                                    const clean = token.trim().replace(/[.,!?;:]/g, '');
                                    if (clean.length > 0) handleSaveWord(clean);
                                }
                            }}
                        />
                    ))}
                </div>

                {/* Automation Translation Display */}
                {(fullResult || fullLoading) && (
                    <div style={{
                        fontSize: '20px',
                        color: 'rgba(148, 163, 184, 1)',
                        fontWeight: 500,
                        fontStyle: 'normal',
                        padding: '12px 24px',
                        textAlign: 'center',
                        width: '100%',
                        maxWidth: '85%',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        marginTop: '8px',
                        animation: 'fadeIn 0.3s ease-in-out'
                    }}>
                        {fullLoading ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
                                <span className="animate-spin">⟳</span> Translating...
                            </span>
                        ) : fullResult}
                    </div>
                )}

                {/* Next Button */}
                {hasNext && (
                    <div
                        onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                        style={{
                            position: 'absolute',
                            right: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            padding: '12px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            zIndex: 10
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
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
                            targetLang={targetLang}
                            onLangChange={onTargetLangChange}
                            sourceLang={sourceLang}
                            onSourceLangChange={onSourceLangChange}
                            autoSave={autoSave}
                            onAutoSaveChange={onAutoSaveChange}
                            onMouseEnter={() => { setIsPopupHovered(true); if (timerRef.current) clearTimeout(timerRef.current); }}
                            onMouseLeave={() => { setIsPopupHovered(false); onWordLeave(); }}
                        />
                    </div>
                )
            }
        </>
    );
};
