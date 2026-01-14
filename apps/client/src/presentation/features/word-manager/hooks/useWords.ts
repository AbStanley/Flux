import { useWordsStore } from '../../word-manager/store/useWordsStore';

export const useWords = () => {
    const wordsState = useWordsStore(state => state.wordsState);
    const error = useWordsStore(state => state.error);
    const fetchWords = useWordsStore(state => state.fetchWords);
    const addWord = useWordsStore(state => state.addWord);
    const deleteWord = useWordsStore(state => state.deleteWord);
    const updateWord = useWordsStore(state => state.updateWord);

    return {
        words: wordsState.items,
        isLoading: wordsState.isLoading,
        error,
        fetchWords,
        addWord,
        deleteWord,
        updateWord
    };
};
