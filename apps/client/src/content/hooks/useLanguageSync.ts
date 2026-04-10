import { useRef, useEffect } from 'react';
import type { SubtitleCue } from '../services/YouTubeService';
import type { Mode } from './useAIHandler';

interface UseLanguageSyncParams {
    targetLang: string;
    sourceLang: string;
    cue: SubtitleCue | null;
    isOverlayHovered: boolean;
    hoveredWord: { text: string } | null;
    fullResult: string;
    handleFullAction: (text: string, mode: Mode, targetLang: string, sourceLang: string, context?: string) => void;
    handleAction: (text: string, mode: Mode, targetLang: string, sourceLang: string, context?: string) => void;
    mode: Mode;
    setFullResult: (v: string) => void;
}

export function useLanguageSync({
    targetLang, sourceLang, cue, isOverlayHovered,
    hoveredWord, fullResult, handleFullAction, handleAction, mode, setFullResult,
}: UseLanguageSyncParams) {
    const isFirstMount = useRef(true);
    const lastTranslatedText = useRef('');
    const prevTargetLang = useRef(targetLang);
    const prevSourceLang = useRef(sourceLang);
    const prevWordLangTarget = useRef(targetLang);
    const prevWordLangSource = useRef(sourceLang);

    // Clear full translation when cue changes
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        setFullResult('');
    }, [cue?.text, setFullResult]);

    // Re-translate when cue changes while overlay is hovered
    useEffect(() => {
        if (isOverlayHovered && cue?.text && (cue.text !== lastTranslatedText.current && !fullResult)) {
            lastTranslatedText.current = cue.text;
            handleFullAction(cue.text, 'TRANSLATE', targetLang, sourceLang, 'YouTube Subtitle');
        }
    }, [cue?.text, isOverlayHovered, handleFullAction, targetLang, sourceLang, fullResult]);

    // Re-translate when language changes explicitly
    useEffect(() => {
        const langChanged = targetLang !== prevTargetLang.current || sourceLang !== prevSourceLang.current;
        prevTargetLang.current = targetLang;
        prevSourceLang.current = sourceLang;

        if (langChanged && cue?.text) {
            lastTranslatedText.current = cue.text;
            handleFullAction(cue.text, 'TRANSLATE', targetLang, sourceLang, 'YouTube Subtitle');
        }
    }, [targetLang, sourceLang, cue?.text, handleFullAction]);

    // Re-translate hovered word when language changes
    useEffect(() => {
        const changed = targetLang !== prevWordLangTarget.current || sourceLang !== prevWordLangSource.current;
        prevWordLangTarget.current = targetLang;
        prevWordLangSource.current = sourceLang;
        if (changed && hoveredWord) {
            handleAction(hoveredWord.text, mode, targetLang, sourceLang, cue?.text);
        }
    }, [targetLang, sourceLang]); // eslint-disable-line react-hooks/exhaustive-deps

    const clearLastTranslatedText = () => {
        lastTranslatedText.current = '';
    };

    return { clearLastTranslatedText };
}
