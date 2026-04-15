import { useCallback } from 'react';
import { useReaderStore } from '../store/useReaderStore';
import { useTranslationStore } from '../store/useTranslationStore';

export const useFocusMode = () => {
    const isReading = useReaderStore((state) => state.isReading);
    const text = useReaderStore((state) => state.text);
    const setIsReading = useReaderStore((state) => state.setIsReading);
    const closeRichInfo = useTranslationStore((state) => state.closeRichInfo);

    const hasText = text.trim().length > 0;

    const enterReaderMode = useCallback(() => {
        if (hasText) {
            setIsReading(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [hasText, setIsReading]);

    const exitReaderMode = useCallback(() => {
        setIsReading(false);
        closeRichInfo();
    }, [setIsReading, closeRichInfo]);

    return {
        isReading,
        hasText,
        enterReaderMode,
        exitReaderMode,
    };
};
