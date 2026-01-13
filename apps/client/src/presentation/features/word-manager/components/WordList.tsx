import React from 'react';
import { type Word } from '../../../../infrastructure/api/words';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface WordListProps {
    words: Word[];
    onEdit: (word: Word) => void;
    onDelete: (id: string) => void;
}

export const WordList: React.FC<WordListProps> = ({ words, onEdit, onDelete }) => {
    return (
        <div className="rounded-md border-none">
            {/* Desktop View */}
            <div className="hidden md:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Word</TableHead>
                            <TableHead>Definition</TableHead>
                            <TableHead>Language</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {words.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No words found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            words.map((word) => (
                                <TableRow key={word.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col gap-1">
                                            <span>{word.text}</span>
                                            {word.type && (
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded w-fit ${word.type === 'phrase'
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                    {word.type}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">{word.definition || '-'}</TableCell>
                                    <TableCell>
                                        {word.targetLanguage && word.sourceLanguage
                                            ? `${word.sourceLanguage} → ${word.targetLanguage}`
                                            : '-'}
                                    </TableCell>
                                    <TableCell>{word.sourceTitle || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(word)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => onDelete(word.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View */}
            <div className="block md:hidden space-y-4">
                {words.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-md">
                        No words found.
                    </div>
                ) : (
                    words.map((word) => (
                        <div key={word.id} className="bg-card text-card-foreground rounded-lg border shadow-sm p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg">{word.text}</h3>
                                        {word.type && (
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${word.type === 'phrase'
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                {word.type}
                                            </span>
                                        )}
                                    </div>
                                    {word.pronunciation && (
                                        <span className="text-xs text-muted-foreground">{word.pronunciation}</span>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => onEdit(word)}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => onDelete(word.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {word.definition && (
                                <div className="text-sm">
                                    <span className="font-medium text-muted-foreground">Definition: </span>
                                    {word.definition}
                                </div>
                            )}

                            {(word.sourceLanguage || word.targetLanguage) && (
                                <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded w-fit">
                                    {word.sourceLanguage} → {word.targetLanguage}
                                </div>
                            )}

                            {word.sourceTitle && (
                                <div className="text-xs text-muted-foreground italic truncate">
                                    Source: {word.sourceTitle}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
