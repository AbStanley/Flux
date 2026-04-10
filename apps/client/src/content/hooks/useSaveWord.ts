import { useState, useCallback } from 'react';
import { wordsApi } from '../../infrastructure/api/words';

interface UseSaveWordParams {
    sourceLang: string;
    targetLang: string;
    context?: string;
}

export function useSaveWord({ sourceLang, targetLang, context }: UseSaveWordParams) {
    const [isSaved, setIsSaved] = useState(false);

    const handleSaveWord = useCallback(async (text: string, definition?: string) => {
        try {
            await wordsApi.create({
                text,
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                context: context || window.location.href,
                definition,
            });
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (err) {
            console.error('[Flux YouTube] Failed to save word:', err);
        }
    }, [sourceLang, targetLang, context]);

    return { isSaved, handleSaveWord };
}
