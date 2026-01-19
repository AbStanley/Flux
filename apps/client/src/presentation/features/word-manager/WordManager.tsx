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

    const [activeTab, setActiveTab] = useState<'word' | 'phrase'>('word');

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 md:space-y-8 pb-20 md:pb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        Vocabulary Manager
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">Manage your collection.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="flex gap-2 ml-auto">
                        <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={wordsState.total + phrasesState.total === 0}>
                            <FileDown className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">CSV</span>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleExport('anki')} disabled={wordsState.total + phrasesState.total === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Anki</span>
                        </Button>
                        <Button size="sm" onClick={() => { setEditingWord(undefined); setIsDialogOpen(true); }} className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Entry
                        </Button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-md bg-destructive/15 text-destructive font-medium animate-in fade-in slide-in-from-top-2">
                    {error}
                </div>
            )}

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Custom Tabs */}
                <div className="flex p-1 bg-muted/30 rounded-lg w-full md:w-fit gap-1 border">
                    <button
                        onClick={() => setActiveTab('word')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'word'
                            ? 'bg-background text-foreground shadow-sm scale-[1.02]'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                    >
                        Words
                        <span className="ml-2 text-xs opacity-60 bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
                            {wordsState.total}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('phrase')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'phrase'
                            ? 'bg-background text-foreground shadow-sm scale-[1.02]'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                    >
                        Phrases
                        <span className="ml-2 text-xs opacity-60 bg-muted-foreground/10 px-1.5 py-0.5 rounded-full">
                            {phrasesState.total}
                        </span>
                    </button>
                </div>

                <div className="min-h-[400px]">
                    {activeTab === 'word' ? (
                        wordsState.isLoading && wordsState.items.length === 0 ? (
                            <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
                                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                                Loading words...
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <WordList
                                    words={wordsState.items}
                                    onEdit={openEditDialog}
                                    onDelete={(id) => handleDelete(id, 'word')}
                                    emptyMessage="No words saved yet."
                                />
                                {wordsState.hasMore && (
                                    <div className="flex justify-center py-4">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => fetchWords('word', wordsState.page + 1)}
                                            disabled={wordsState.isLoading}
                                            className="w-full md:w-auto"
                                        >
                                            {wordsState.isLoading ? 'Loading...' : 'Load More Words'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        phrasesState.isLoading && phrasesState.items.length === 0 ? (
                            <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
                                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                                Loading phrases...
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <WordList
                                    words={phrasesState.items}
                                    onEdit={openEditDialog}
                                    onDelete={(id) => handleDelete(id, 'phrase')}
                                    emptyMessage="No phrases saved yet."
                                />
                                {phrasesState.hasMore && (
                                    <div className="flex justify-center py-4">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => fetchWords('phrase', phrasesState.page + 1)}
                                            disabled={phrasesState.isLoading}
                                            className="w-full md:w-auto"
                                        >
                                            {phrasesState.isLoading ? 'Loading...' : 'Load More Phrases'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>
            </div>

            <EditWordDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSubmit={editingWord ? handleUpdate : handleCreate}
                initialData={editingWord}
                // Pass the active tab as default type for new entries
                defaultType={activeTab}
            />
        </div>
    );
};
