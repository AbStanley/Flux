import type { SubtitleCue } from '../services/YouTubeService';
import { useAIHandler, type Mode } from '../hooks/useAIHandler';
import { FluxPopup } from './FluxPopup';
import { useState, useRef, useEffect } from 'react';
import { wordsApi } from '../../infrastructure/api/words';
import { useReaderStore } from '@/presentation/features/reader/store/useReaderStore';
import { SelectionMode } from '@/core/types';

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

/**
 * YouTubeSubtitleOverlay: Displays interactive subtitles on YouTube.
 * 
 * Features:
 * - Floating interactive tokens
 * - Hover to translate with AI
 * - Auto-pauses video on hover
 * - High-end premium design
 */
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
    const [mode, setMode] = useState<Mode>('TRANSLATE'); // Local mode state for the popup
    const [overlayPos, setOverlayPos] = useState({
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.85
    });
    const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const dragOverlayStart = useRef({ x: 0, y: 0 });

    const { result, loading, error, handleAction, setResult } = useAIHandler();
    const { selectionMode } = useReaderStore(); // targetLang is now a prop

    const handleSaveWord = async (text: string) => {
        setIsSaving(true);
        try {
            await wordsApi.create({
                text: text,
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                context: cue?.text || window.location.href, // Use subtitle text as context
            });
        } catch (err) {
            console.error('[Flux YouTube] Failed to save word:', err);
        } finally {
            setTimeout(() => setIsSaving(false), 1200);
        }
    };

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Notify parent about popup state
    useEffect(() => {
        if (onPopupStateChange) {
            onPopupStateChange(!!hoveredWord);
        }
    }, [hoveredWord, onPopupStateChange]);

    // Sync overlay position on resize
    useEffect(() => {
        const handleResize = () => {
            if (!isDraggingOverlay) {
                setOverlayPos({
                    x: window.innerWidth / 2,
                    y: window.innerHeight * 0.85
                });
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isDraggingOverlay]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingOverlay) return;
            setOverlayPos({
                x: e.clientX - dragOverlayStart.current.x,
                y: e.clientY - dragOverlayStart.current.y
            });
        };

        const handleMouseUp = () => {
            setIsDraggingOverlay(false);
        };

        if (isDraggingOverlay) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingOverlay]);

    if (!cue) return null;

    const tokens = cue.text.split(/(\s+)/);
    const isSentenceMode = selectionMode === SelectionMode.Sentence;

    const onOverlayMouseDown = (e: React.MouseEvent) => {
        // Only drag if not clicking a word (span)
        if ((e.target as HTMLElement).classList.contains('flux-token')) return;

        setIsDraggingOverlay(true);
        dragOverlayStart.current = {
            x: e.clientX - overlayPos.x,
            y: e.clientY - overlayPos.y
        };
        e.preventDefault();
    };

    const onWordHover = (event: React.MouseEvent, word: string) => {
        const cleanWord = word.trim().replace(/[.,!?;:]/g, '');
        if (cleanWord.length === 0 && !isSentenceMode) return;

        if (timerRef.current) clearTimeout(timerRef.current);

        const rect = (event.target as HTMLElement).getBoundingClientRect();

        const textToProcess = isSentenceMode ? cue.text : cleanWord;

        // Position popup closer to the word
        const selection = {
            text: textToProcess,
            x: rect.left,
            y: rect.top - 340
        };

        setHoveredWord(selection);
        onHover(true);
        handleAction(textToProcess, mode, targetLang, sourceLang);
    };

    const onTokenClick = (_event: React.MouseEvent, word: string) => {
        const cleanWord = word.trim().replace(/[.,!?;:]/g, '');
        if (cleanWord.length === 0 && !isSentenceMode) return;
        const textToProcess = isSentenceMode ? cue.text : cleanWord;

        handleSaveWord(textToProcess);

        // Also ensure popup stays open/pinned if clicked?
        setIsPinned(true);
    };

    const onWordLeave = () => {
        if (isPinned) return; // Stay open if pinned

        timerRef.current = setTimeout(() => {
            if (!isPopupHovered) {
                setHoveredWord(null);
                onHover(false);
                setResult('');
                // Only play if we are no longer in the popup
                onHover(false); // This will call playVideo in the parent
            }
        }, 300);
    };

    const handleClose = () => {
        setIsPinned(false);
        setHoveredWord(null);
        onHover(false);
        setResult('');
    };

    return (
        <>
            <div
                className="flux-youtube-overlay flux-selectable"
                onMouseEnter={() => onHover(true)}
                onMouseLeave={() => {
                    if (!hoveredWord) onHover(false);
                }}
                onMouseDown={onOverlayMouseDown}
                style={{
                    position: 'fixed',
                    top: overlayPos.y,
                    left: overlayPos.x,
                    transform: isDraggingOverlay ? 'translate(-50%, -50%) scale(1.02)' : 'translate(-50%, -50%) scale(1)',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(12px)',
                    color: '#f8fafc',
                    padding: '16px 32px',
                    borderRadius: '24px',
                    fontSize: '32px',
                    fontWeight: 600,
                    zIndex: 2147483646,
                    textAlign: 'center',
                    maxWidth: '85%',
                    cursor: isDraggingOverlay ? 'grabbing' : 'grab',
                    boxShadow: isDraggingOverlay
                        ? '0 30px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2)'
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: isDraggingOverlay ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), top 0.1s ease-out, left 0.1s ease-out',
                    userSelect: 'none',
                }}
            >
                {tokens.map((token, i) => (
                    <span
                        key={i}
                        onMouseEnter={(e) => onWordHover(e, token)}
                        onMouseLeave={onWordLeave}
                        onClick={(e) => onTokenClick(e, token)}
                        style={{
                            cursor: token.trim().length > 0 ? 'pointer' : 'default',
                            display: 'inline-block',
                            transition: 'all 0.2s ease',
                            margin: '0 4px',
                            color: (isSentenceMode && hoveredWord) ? '#60a5fa' : undefined,
                            transform: (isSentenceMode && hoveredWord) ? 'scale(1.05)' : undefined
                        }}
                        className={`flux-token ${!isSentenceMode ? 'hover:scale-110 hover:text-blue-400' : ''}`}
                    >
                        {token}
                    </span>
                ))}
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
                    onClose={handleClose}
                    onPinChange={setIsPinned}
                    onAutoPlay={() => onHover(false)}
                    onSave={handleSaveWord}
                    onMouseEnter={() => {
                        setIsPopupHovered(true);
                        onHover(true);
                        if (timerRef.current) clearTimeout(timerRef.current);
                    }}
                    onMouseLeave={() => {
                        setIsPopupHovered(false);
                        onWordLeave();
                    }}
                    autoSave={autoSave}
                    onAutoSaveChange={onAutoSaveChange}
                    isSaving={isSaving}
                />
            )}
        </>
    );
};
