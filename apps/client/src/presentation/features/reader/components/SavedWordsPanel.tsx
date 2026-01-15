import { useEffect, useState } from 'react';
import { useReaderStore } from '../store/useReaderStore';
import { useWords } from '../../word-manager/hooks/useWords';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Button } from '../../../components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { type Word, type CreateWordRequest } from '../../../../infrastructure/api/words';
import { EditWordDialog } from '../../word-manager/components/EditWordDialog';

export function SavedWordsPanel() {
    const setActivePanel = useReaderStore(state => state.setActivePanel);
    const { words, fetchWords, deleteWord, updateWord } = useWords();
    const [editingWord, setEditingWord] = useState<Word | undefined>(undefined);

    // Refresh words when panel opens
    useEffect(() => {
        fetchWords('word');
    }, [fetchWords]);

    const handleEdit = (word: Word) => {
        setEditingWord(word);
    };

    const handleUpdate = async (data: CreateWordRequest) => {
        if (editingWord) {
            await updateWord(editingWord.id, data);
            setEditingWord(undefined);
        }
    };

    return (
        <div className={`hidden min-[1200px]:flex flex-col flex-shrink-0 relative overflow-hidden h-full transition-all duration-300 w-[500px] pl-2`}>
            <div className="w-[450px] h-full flex flex-col bg-background border-l shadow-sm rounded-l-xl">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-semibold">Saved Words</h2>
                    <button
                        onClick={() => setActivePanel('DETAILS')}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        Close
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="p-4 space-y-3">
                            {words.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">
                                    No words saved yet.
                                </p>
                            ) : (
                                words.map((word: Word) => (
                                    <div key={word.id} className="border p-3 rounded-lg bg-card/50 hover:bg-card transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-medium text-lg text-primary">{word.text}</h3>
                                                {word.pronunciation && (
                                                    <span className="text-xs text-muted-foreground block mb-1">/{word.pronunciation}/</span>
                                                )}
                                                <p className="text-sm">{word.definition}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(word)}>
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteWord(word.id, 'word')}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        {word.context && (
                                            <div className="mt-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                                                "{word.context}"
                                            </div>
                                        )}
                                        {word.examples && word.examples.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {word.examples.slice(0, 1).map((ex) => (
                                                    <div key={ex.id || Math.random()} className="text-xs italic">
                                                        "{ex.sentence}"
                                                        {ex.translation && <span className="text-muted-foreground block not-italic">— {ex.translation}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            <EditWordDialog
                isOpen={!!editingWord}
                onClose={() => setEditingWord(undefined)}
                onSubmit={handleUpdate}
                initialData={editingWord}
            />
        </div>
    );
};
