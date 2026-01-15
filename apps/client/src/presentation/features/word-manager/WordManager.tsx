import { useState, useEffect } from 'react';
import { useWordsStore } from './store/useWordsStore';
import { WordList } from './components/WordList';
import { EditWordDialog } from './components/EditWordDialog';
import { Button } from '../../components/ui/button';
import { Plus, Download, FileDown } from 'lucide-react';
import { type CreateWordRequest, type Word, wordsApi } from '../../../infrastructure/api/words';
import { exportToCSV, exportToAnki } from './utils/exportUtils';

export function WordManager() {
    const { wordsState, phrasesState, error, addWord, updateWord, deleteWord, fetchWords } = useWordsStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingWord, setEditingWord] = useState<Word | undefined>(undefined);

    useEffect(() => {
        fetchWords('word', 1);
        fetchWords('phrase', 1);
    }, [fetchWords]);

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

    const openCreateDialog = () => {
        setEditingWord(undefined);
        setIsDialogOpen(true);
    };

    const openEditDialog = (word: Word) => {
        setEditingWord(word);
        setIsDialogOpen(true);
    };

    const handleExport = async (format: 'csv' | 'anki') => {
        try {
            // Fetch ALL items for both types
            const [wordsResponse, phrasesResponse] = await Promise.all([
                wordsApi.getAll({ type: 'word' }),
                wordsApi.getAll({ type: 'phrase' })
            ]);

            const allItems = [...wordsResponse.items, ...phrasesResponse.items];

            if (format === 'csv') {
                exportToCSV(allItems);
            } else {
                exportToAnki(allItems);
            }
        } catch (error) {
            console.error('Failed to export:', error);
            // Optionally set error state here if you want UI feedback
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-slate-100 dark:to-slate-400">
                        Vocabulary Manager
                    </h2>
                    <p className="text-muted-foreground mt-1">Manage your personal collection of words and phrases.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExport('csv')} disabled={wordsState.total + phrasesState.total === 0}>
                        <FileDown className="mr-2 h-4 w-4" />
                        CSV
                    </Button>
                    <Button variant="outline" onClick={() => handleExport('anki')} disabled={wordsState.total + phrasesState.total === 0}>
                        <Download className="mr-2 h-4 w-4" />
                        Anki
                    </Button>
                    <Button onClick={openCreateDialog} className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Entry
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-md bg-destructive/15 text-destructive font-medium animate-in fade-in slide-in-from-top-2">
                    {error}
                </div>
            )}

            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Words Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <h3 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-200">
                            Words
                        </h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {wordsState.total}
                        </span>
                    </div>

                    {wordsState.isLoading && wordsState.items.length === 0 ? (
                        <div className="py-10 text-center text-muted-foreground">Loading words...</div>
                    ) : (
                        <div className="space-y-4">
                            <WordList
                                words={wordsState.items}
                                onEdit={openEditDialog}
                                onDelete={(id) => handleDelete(id, 'word')}
                                emptyMessage="No words saved yet."
                            />
                            {wordsState.hasMore && (
                                <div className="flex justify-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => fetchWords('word', wordsState.page + 1)}
                                        disabled={wordsState.isLoading}
                                    >
                                        {wordsState.isLoading ? 'Loading...' : 'Show More'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Phrases Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <h3 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-200">
                            Phrases
                        </h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                            {phrasesState.total}
                        </span>
                    </div>

                    {phrasesState.isLoading && phrasesState.items.length === 0 ? (
                        <div className="py-10 text-center text-muted-foreground">Loading phrases...</div>
                    ) : (
                        <div className="space-y-4">
                            <WordList
                                words={phrasesState.items}
                                onEdit={openEditDialog}
                                onDelete={(id) => handleDelete(id, 'phrase')}
                                emptyMessage="No phrases saved yet."
                            />
                            {phrasesState.hasMore && (
                                <div className="flex justify-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => fetchWords('phrase', phrasesState.page + 1)}
                                        disabled={phrasesState.isLoading}
                                    >
                                        {phrasesState.isLoading ? 'Loading...' : 'Show More'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            <EditWordDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSubmit={editingWord ? handleUpdate : handleCreate}
                initialData={editingWord}
            />
        </div>
    );
};
