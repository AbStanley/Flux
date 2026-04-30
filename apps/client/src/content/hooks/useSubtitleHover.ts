import { useState, useRef, useCallback } from 'react';
import type { SubtitleCue } from '../services/YouTubeService';
import type { Mode } from './useAIHandler';

interface UseSubtitleHoverParams {
    isSentenceMode: boolean;
    cue: SubtitleCue | null;
    mode: Mode;
    targetLang: string;
    sourceLang: string;
    handleAction: (text: string, mode: Mode, targetLang: string, sourceLang: string, context?: string) => void;
    setResult: (v: string) => void;
}

export function useSubtitleHover({
    isSentenceMode, cue, mode, targetLang, sourceLang, handleAction, setResult,
}: UseSubtitleHoverParams) {
    const [hoveredWord, setHoveredWord] = useState<{ text: string; x: number; y: number } | null>(null);
    const [isPopupHovered, setIsPopupHovered] = useState(false);
    const [isDebouncing, setIsDebouncing] = useState(false);
    
    // Use ref to track isPopupHovered for the setTimeout closure
    const isPopupHoveredRef = useRef(false);
    const updatePopupHover = (v: boolean) => {
        setIsPopupHovered(v);
        isPopupHoveredRef.current = v;
    };

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const hoverDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastHoveredWord = useRef('');

    const clearHover = useCallback(() => {
        if (hoverDebounceRef.current) clearTimeout(hoverDebounceRef.current);
        if (timerRef.current) clearTimeout(timerRef.current);
        setHoveredWord(null);
        setResult('');
        setIsDebouncing(false);
        lastHoveredWord.current = '';
        updatePopupHover(false);
    }, [setResult]);

    const onWordHover = useCallback((event: React.MouseEvent, word: string) => {
        const cleanWord = word.trim().replace(/[.,!?;:]/g, '');
        if (cleanWord.length === 0 && !isSentenceMode) return;

        const textToProcess = isSentenceMode && cue ? cue.text : cleanWord;

        if (textToProcess === lastHoveredWord.current && hoveredWord) return;
        lastHoveredWord.current = textToProcess;

        if (timerRef.current) clearTimeout(timerRef.current);
        if (hoverDebounceRef.current) clearTimeout(hoverDebounceRef.current);

        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setHoveredWord({ text: textToProcess, x: rect.left + rect.width / 2, y: rect.top });
        setIsDebouncing(true);

        hoverDebounceRef.current = setTimeout(() => {
            setIsDebouncing(false);
            handleAction(textToProcess, mode, targetLang, sourceLang, cue?.text);
        }, 350);
    }, [isSentenceMode, cue, mode, targetLang, sourceLang, handleAction, hoveredWord]);

    const onWordLeave = useCallback(() => {
        if (hoverDebounceRef.current) {
            clearTimeout(hoverDebounceRef.current);
            setIsDebouncing(false);
        }
        
        // Clear last word immediately on leave so re-hovering works instantly
        lastHoveredWord.current = '';

        timerRef.current = setTimeout(() => {
            if (!isPopupHoveredRef.current) {
                setHoveredWord(null);
                setResult('');
            }
        }, 150);
    }, [setResult]);

    return {
        hoveredWord, setHoveredWord,
        isPopupHovered, setIsPopupHovered: updatePopupHover,
        isDebouncing,
        timerRef,
        onWordHover, onWordLeave, clearHover,
    };
}
