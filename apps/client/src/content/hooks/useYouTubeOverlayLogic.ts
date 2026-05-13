import { useState, useEffect } from 'react';
import { useDraggable } from './useDraggable';
import { useResizable } from './useResizable';
import { useSubtitleHover } from './useSubtitleHover';
import { useLanguageSync } from './useLanguageSync';
import { useSaveWord } from './useSaveWord';
import { useAIHandler } from './useAIHandler';
import { useReaderStore } from '@/presentation/features/reader/store/useReaderStore';
import { SelectionMode } from '@/core/types';
import type { SubtitleCue } from '../services/YouTubeService';

interface Args {
    cue: SubtitleCue | null;
    targetLang: string;
    sourceLang: string;
    onHover: (hovering: boolean) => void;
    onPopupStateChange?: (active: boolean) => void;
}

export function useYouTubeOverlayLogic({ cue, targetLang, sourceLang, onHover, onPopupStateChange }: Args) {
    const [mode] = useState<'TRANSLATE'>('TRANSLATE');
    const [isOverlayHovered, setIsOverlayHovered] = useState(false);

    const { result, loading, error, handleAction, setResult } = useAIHandler();
    const {
        result: fullResult, loading: fullLoading, error: fullError,
        handleAction: handleFullAction, setResult: setFullResult
    } = useAIHandler();

    const { selectionMode } = useReaderStore();
    const draggable = useDraggable({ initialPos: { x: window.innerWidth / 2, y: window.innerHeight * 0.85 } });
    const resizable = useResizable({ initialSize: { width: 600, height: 200 } });

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

    return {
        mode, isOverlayHovered, setIsOverlayHovered,
        result, loading, error, handleAction, setResult,
        fullResult, fullLoading, fullError, setFullResult,
        draggable, resizable, hover, isSaved, saveError, handleSaveWord,
        clearLastTranslatedText, isSentenceMode
    };
}
