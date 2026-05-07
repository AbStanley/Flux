import { useCallback } from 'react';
import { getLanguageCode } from '../../presentation/features/word-manager/utils/languageUtils';

export function useFluxAudio() {
    const playAudio = useCallback((text: string, langName: string) => {
        if (!text) return;

        const cleanText = text.replace(/[*_#>`~]/g, '');
        const speechCode = getLanguageCode(langName);

        const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime?.id;
        console.log(`[Flux TTS] text="${cleanText}" lang=${speechCode} isExtension=${isExtension}`);

        if (isExtension) {
            chrome.runtime.sendMessage(
                { type: 'PLAY_TTS', data: { text: cleanText, lang: speechCode } },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('[Flux TTS] sendMessage failed:', chrome.runtime.lastError.message);
                    } else {
                        console.log('[Flux TTS] Background responded:', response);
                    }
                }
            );
        } else {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = speechCode;
            utterance.rate = 0.9;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        }
    }, []);

    return { playAudio };
}
