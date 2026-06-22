import { useState, useCallback } from 'react';
import { useWordsStore } from '../../word-manager/store/useWordsStore';
import { useReaderStore } from '../store/useReaderStore';

export function useTokenSave(token: string, groupTranslation: string | undefined) {
    const addWord = useWordsStore(state => state.addWord);
    const savedWords = useWordsStore(state => state.wordsState.items);
    const savedPhrases = useWordsStore(state => state.phrasesState.items);
    
    const sourceLang = useReaderStore(state => state.sourceLang);
    const targetLang = useReaderStore(state => state.targetLang);

    const [isSavedTemp, setIsSavedTemp] = useState(false);
    const [savedItemKeys, setSavedItemKeys] = useState<Set<string>>(new Set());

    const isTextSaved = useCallback((txt: string) => {
        if (!txt) return false;
        const cleaned = txt.trim().toLowerCase();
        return savedWords.some(w => w.text.trim().toLowerCase() === cleaned) ||
               savedPhrases.some(p => p.text.trim().toLowerCase() === cleaned);
    }, [savedWords, savedPhrases]);

    const handleSaveItem = useCallback((itemIndex?: number, translationText?: string, sourceText?: string) => {
        const textToSave = sourceText || token;
        const transToSave = translationText || groupTranslation || '';
        if (!textToSave.trim()) return;

        addWord({
            text: textToSave,
            definition: transToSave,
            context: "",
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            type: textToSave.includes(' ') && textToSave.length > 20 ? 'phrase' : 'word'
        }).then(() => {
            const key = itemIndex !== undefined ? `${itemIndex}-${itemIndex}` : 'single';
            setSavedItemKeys(prev => new Set(prev).add(key));
            setIsSavedTemp(true);
            setTimeout(() => setIsSavedTemp(false), 2000);
        }).catch(err => console.error(err));
    }, [token, groupTranslation, addWord, sourceLang, targetLang]);

    return {
        isSavedTemp,
        savedItemKeys,
        isTextSaved,
        handleSaveItem
    };
}
