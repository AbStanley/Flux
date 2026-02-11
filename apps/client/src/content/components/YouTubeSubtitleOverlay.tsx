import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { SubtitleCue } from '../services/YouTubeService';
import { useAIHandler, type Mode } from '../hooks/useAIHandler';
import { FluxPopup } from './FluxPopup';
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
    onAutoSaveChange
}: Props) => {
    const [hoveredWord, setHoveredWord] = useState<{ text: string, x: number, y: number } | null>(null);
    const [isPopupHovered, setIsPopupHovered] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [mode, setMode] = useState<Mode>('TRANSLATE');
    const [isSaving, setIsSaving] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const { result, loading, error, handleAction, setResult } = useAIHandler();
    const { selectionMode } = useReaderStore();

    const { pos, isDragging, handleMouseDown } = useDraggable({
        initialPos: { x: window.innerWidth / 2, y: window.innerHeight * 0.85 }
    });

    const { size, handleResizeMouseDown } = useResizable({
        initialSize: { width: 800, height: 160 }
    });

    const tokens = useMemo(() => cue?.text.split(/(\s+)/) || [], [cue?.text]);
    const isSentenceMode = selectionMode === SelectionMode.Sentence;

    useEffect(() => {
        onPopupStateChange?.(!!hoveredWord);
    }, [hoveredWord, onPopupStateChange]);

    const handleSaveWord = useCallback(async (text: string) => {
        setIsSaving(true);
        try {
            await wordsApi.create({
                text: text,
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                context: cue?.text || window.location.href,
            });
        } catch (err) {
            console.error('[Flux YouTube] Failed to save word:', err);
        } finally {
            setTimeout(() => setIsSaving(false), 1200);
        }
    }, [sourceLang, targetLang, cue?.text]);

    const onWordHover = useCallback((event: React.MouseEvent, word: string) => {
        const cleanWord = word.trim().replace(/[.,!?;:]/g, '');
        if (cleanWord.length === 0 && !isSentenceMode) return;
        if (timerRef.current) clearTimeout(timerRef.current);

        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const textToProcess = isSentenceMode && cue ? cue.text : cleanWord;

        setHoveredWord({ text: textToProcess, x: rect.left, y: rect.top - 340 });
        onHover(true);
        handleAction(textToProcess, mode, targetLang, sourceLang);
    }, [isSentenceMode, cue, mode, targetLang, sourceLang, onHover, handleAction]);

    const onWordLeave = useCallback(() => {
        if (isPinned) return;
        timerRef.current = setTimeout(() => {
            if (!isPopupHovered) {
                setHoveredWord(null);
                onHover(false);
                setResult('');
            }
        }, 300);
    }, [isPinned, isPopupHovered, onHover, setResult]);

    const overlayStyles: React.CSSProperties = {
        position: 'fixed',
        top: pos.y,
        left: pos.x,
        width: size.width,
        height: size.height,
        transform: isDragging ? 'translate(-50%, -50%) scale(1.02)' : 'translate(-50%, -50%) scale(1)',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        color: '#f8fafc',
        padding: '16px 32px',
        borderRadius: '24px',
        fontSize: '32px',
        fontWeight: 600,
        zIndex: 2147483646,
        textAlign: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignContent: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging
            ? '0 30px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), top 0.1s ease-out, left 0.1s ease-out',
        userSelect: 'none',
        overflow: 'hidden'
    };

    if (!cue) return null;

    return (
        <>
            <div
                className="flux-youtube-overlay flux-selectable"
                onMouseEnter={() => onHover(true)}
                onMouseLeave={() => !hoveredWord && onHover(false)}
                onMouseDown={handleMouseDown}
                style={overlayStyles}
            >
                {tokens.map((token, i) => (
                    <SubtitleToken
                        key={i}
                        token={token}
                        isHovered={!!hoveredWord}
                        isSentenceMode={isSentenceMode}
                        onMouseEnter={(e) => onWordHover(e, token)}
                        onMouseLeave={onWordLeave}
                        onClick={() => {
                            if (!cue) return;
                            const clean = token.trim().replace(/[.,!?;:]/g, '');
                            if (clean.length > 0 || isSentenceMode) {
                                handleSaveWord(isSentenceMode ? cue.text : clean);
                                setIsPinned(true);
                            }
                        }}
                    />
                ))}

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

            {hoveredWord && (
                <FluxPopup
                    selection={hoveredWord}
                    result={result}
                    loading={loading}
                    error={error}
                    mode={mode}
                    targetLang={targetLang}
                    sourceLang={sourceLang}
                    onModeChange={setMode}
                    onLangChange={onTargetLangChange}
                    onSourceLangChange={onSourceLangChange}
                    onAction={() => handleAction(hoveredWord.text, mode, targetLang, sourceLang)}
                    onClose={() => { setIsPinned(false); setHoveredWord(null); onHover(false); setResult(''); }}
                    onPinChange={setIsPinned}
                    onAutoPlay={() => onHover(false)}
                    onSave={handleSaveWord}
                    onMouseEnter={() => { setIsPopupHovered(true); onHover(true); if (timerRef.current) clearTimeout(timerRef.current); }}
                    onMouseLeave={() => { setIsPopupHovered(false); onWordLeave(); }}
                    autoSave={autoSave}
                    onAutoSaveChange={onAutoSaveChange}
                    isSaving={isSaving}
                />
            )}
        </>
    );
};
