import React, { useState, useEffect } from 'react';
import { useWords } from './hooks/useWords';
import { WordList } from './components/WordList';
import { EditWordDialog } from './components/EditWordDialog';
import { Button } from '../../components/ui/button';
import { Plus, Download, FileDown } from 'lucide-react';
import { type CreateWordRequest, type Word } from '../../../infrastructure/api/words';
import { exportToCSV, exportToAnki } from './utils/exportUtils';

export const WordManager: React.FC = () => {
    const { words, isLoading, error, addWord, updateWord, deleteWord, fetchWords } = useWords();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingWord, setEditingWord] = useState<Word | undefined>(undefined);

    useEffect(() => {
        fetchWords();
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

    const openCreateDialog = () => {
        setEditingWord(undefined);
        setIsDialogOpen(true);
    };

    const openEditDialog = (word: Word) => {
        setEditingWord(word);
        setIsDialogOpen(true);
    };

    // Filter words and phrases
    const vocabularyList = words.filter(w => w.type === 'word' || (!w.type && w.text.trim().split(/\s+/).length === 1));
    const phrasesList = words.filter(w => w.type === 'phrase' || (!w.type && w.text.trim().split(/\s+/).length > 1));

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
                    <Button variant="outline" onClick={() => exportToCSV(words)} disabled={words.length === 0}>
                        <FileDown className="mr-2 h-4 w-4" />
                        CSV
                    </Button>
                    <Button variant="outline" onClick={() => exportToAnki(words)} disabled={words.length === 0}>
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

            {isLoading && words.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">Loading your collection...</p>
                </div>
            ) : (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <h3 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-200">
                                Words
                            </h3>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                {vocabularyList.length}
                            </span>
                        </div>
                        <WordList
                            words={vocabularyList}
                            onEdit={openEditDialog}
                            onDelete={deleteWord}
                            emptyMessage="No words saved yet."
                        />
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <h3 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-200">
                                Phrases
                            </h3>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                {phrasesList.length}
                            </span>
                        </div>
                        <WordList
                            words={phrasesList}
                            onEdit={openEditDialog}
                            onDelete={deleteWord}
                            emptyMessage="No phrases saved yet."
                        />
                    </section>
                </div>
            )}

            <EditWordDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSubmit={editingWord ? handleUpdate : handleCreate}
                initialData={editingWord}
            />
        </div>
    );
};
