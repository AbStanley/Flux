import { useState, useCallback } from 'react';
import { wordsApi } from '../../infrastructure/api/words';

interface UseSaveWordParams {
    sourceLang: string;
    targetLang: string;
    context?: string;
}

export function useSaveWord({ sourceLang, targetLang, context }: UseSaveWordParams) {
    const [isSaved, setIsSaved] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const handleSaveWord = useCallback(async (text: string, definition?: string) => {
        setSaveError(null);
        // Check if logged in
        const { getAuthToken } = await import('../../infrastructure/api/api-client');
        const token = await getAuthToken();
        if (!token) {
            setSaveError('Log in via the extension popup to save words.');
            setTimeout(() => setSaveError(null), 4000);
            return;
        }
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
            if (typeof window !== 'undefined') {
                (window as unknown as { chrome?: { runtime?: { sendMessage?: (msg: unknown) => void } } })
                    .chrome?.runtime?.sendMessage?.({ type: 'WORD_SAVED' });
            }
        } catch (err) {
            console.error('[Flux] Failed to save word:', err);
            const msg = err instanceof Error ? err.message : 'Save failed';
            setSaveError(msg);
            setTimeout(() => setSaveError(null), 4000);
        }
    }, [sourceLang, targetLang, context]);

    return { isSaved, saveError, handleSaveWord };
}
