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

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Vocabulary Manager</h2>
                    <p className="text-muted-foreground">Manage your vocabulary, phrases, and flashcards.</p>
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
                    <Button onClick={openCreateDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Word
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-md bg-destructive/15 text-destructive font-medium">
                    {error}
                </div>
            )}

            {isLoading && words.length === 0 ? (
                <div className="text-center py-10">Loading words...</div>
            ) : (
                <WordList
                    words={words}
                    onEdit={openEditDialog}
                    onDelete={deleteWord}
                />
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
