import { useState, useEffect } from 'react';
import { useWordsStore } from '../store/useWordsStore';
import { type CreateWordRequest, type Word, wordsApi } from '@/infrastructure/api/words';

export function useWordManager() {
    const { wordsState, phrasesState, error, addWord, updateWord, deleteWord, fetchWords } = useWordsStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const [editingWord, setEditingWord] = useState<Word | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState('date_desc');
    const [sourceLanguage, setSourceLanguage] = useState('all');
    const [targetLanguage, setTargetLanguage] = useState('all');
    const [availableLanguages, setAvailableLanguages] = useState<{ sourceLanguage: string; targetLanguage: string }[]>([]);
    const [activeTab, setActiveTab] = useState<'word' | 'phrase'>('word');

    useEffect(() => {
        const loadLanguages = async () => {
            try {
                const response = await wordsApi.getLanguages();
                setAvailableLanguages(Array.isArray(response) ? response : []);
            } catch (err) {
                console.error('Failed to load languages', err);
                setAvailableLanguages([]);
            }
        };
        loadLanguages();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchWords(
                'word',
                1,
                searchQuery,
                sortOption,
                sourceLanguage !== 'all' ? sourceLanguage : undefined,
                targetLanguage !== 'all' ? targetLanguage : undefined
            );
            fetchWords(
                'phrase',
                1,
                searchQuery,
                sortOption,
                sourceLanguage !== 'all' ? sourceLanguage : undefined,
                targetLanguage !== 'all' ? targetLanguage : undefined
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, sortOption, sourceLanguage, targetLanguage, fetchWords]);

    const handleCreate = async (data: CreateWordRequest) => {
        await addWord(data);
        setIsDialogOpen(false);
    };

    const handleUpdate = async (data: CreateWordRequest) => {
        if (editingWord) {
            await updateWord(editingWord.id, data);
            setIsDialogOpen(false);
            setEditingWord(undefined);
        }
    };

    const handleDelete = async (id: string, type: 'word' | 'phrase') => {
        await deleteWord(id, type);
    };

    const openEditDialog = (word: Word) => {
        setEditingWord(word);
        setIsDialogOpen(true);
    };

    return {
        wordsState,
        phrasesState,
        error,
        isDialogOpen,
        setIsDialogOpen,
        isExportOpen,
        setIsExportOpen,
        editingWord,
        setEditingWord,
        searchQuery,
        setSearchQuery,
        sortOption,
        setSortOption,
        sourceLanguage,
        setSourceLanguage,
        targetLanguage,
        setTargetLanguage,
        availableLanguages,
        activeTab,
        setActiveTab,
        handleCreate,
        handleUpdate,
        handleDelete,
        openEditDialog,
        fetchWords
    };
}
