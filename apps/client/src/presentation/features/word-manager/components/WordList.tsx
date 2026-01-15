import { type Word } from '../../../../infrastructure/api/words';
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Edit, Trash2, BookOpen, Globe, Quote } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';

interface WordListProps {
    words: Word[];
    onEdit: (word: Word) => void;
    onDelete: (id: string) => void;
    emptyMessage?: string;
}

export function WordList({ words, onEdit, onDelete, emptyMessage = "No items found." }: WordListProps) {
    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-all hover:shadow-md">
            {/* Desktop View */}
            <ScrollArea className="hidden md:block h-[600px]">
                <table className="w-full caption-bottom text-sm">
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-md shadow-sm">
                        <TableRow>
                            <TableHead className="w-[200px] pl-6">Entry</TableHead>
                            <TableHead className="w-[300px]">Definition</TableHead>
                            <TableHead className="w-[150px]">Translation</TableHead>
                            <TableHead className="w-[200px]">Source & Context</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {words.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            words.map((word) => (
                                <TableRow key={word.id} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-semibold text-base py-4 pl-6 align-top">
                                        <div className="flex flex-col gap-1">
                                            <span className="group-hover:text-primary transition-colors">{word.text}</span>
                                            {word.pronunciation && (
                                                <span className="text-xs text-muted-foreground font-normal font-mono">
                                                    /{word.pronunciation}/
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top py-4">
                                        <div className="max-w-xs text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                            {word.definition || <span className="italic text-muted-foreground/50">No definition</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top py-4">
                                        {(word.sourceLanguage || word.targetLanguage) ? (
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                                <Globe className="w-3 h-3" />
                                                <span>{word.sourceLanguage || '?'}</span>
                                                <span className="text-muted-foreground/60 px-0.5">→</span>
                                                <span>{word.targetLanguage || '?'}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground/30 text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="align-top py-4">
                                        <div className="flex flex-col gap-1.5">
                                            {word.sourceTitle && (
                                                <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                                    <BookOpen className="w-3 h-3 mt-0.5 shrink-0" />
                                                    <span className="truncate max-w-[160px]" title={word.sourceTitle}>
                                                        {word.sourceTitle}
                                                    </span>
                                                </div>
                                            )}
                                            {word.context && (
                                                <div className="flex items-start gap-1.5 text-xs text-muted-foreground/80 italic">
                                                    <Quote className="w-3 h-3 mt-0.5 shrink-0" />
                                                    <span className="truncate max-w-[160px]" title={word.context}>
                                                        "{word.context.trim()}"
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6 align-top py-4">
                                        <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                                                onClick={() => onEdit(word)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
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
                </table>
            </ScrollArea>

            {/* Mobile View */}
            <div className="block md:hidden divide-y">
                {words.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        {emptyMessage}
                    </div>
                ) : (
                    words.map((word) => (
                        <div key={word.id} className="p-4 space-y-3 bg-card hover:bg-muted/10 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg">{word.text}</h3>
                                        {(word.sourceLanguage || word.targetLanguage) && (
                                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                                {word.sourceLanguage} → {word.targetLanguage}
                                            </Badge>
                                        )}
                                    </div>
                                    {word.pronunciation && (
                                        <span className="text-sm text-muted-foreground font-mono">/{word.pronunciation}/</span>
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
                                        className="h-8 w-8 text-destructive/70 hover:text-destructive"
                                        onClick={() => onDelete(word.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {word.definition && (
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                    {word.definition}
                                </p>
                            )}

                            {(word.sourceTitle || word.context) && (
                                <div className="space-y-1 pt-1">
                                    {word.sourceTitle && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <BookOpen className="w-3 h-3" />
                                            <span className="truncate">{word.sourceTitle}</span>
                                        </div>
                                    )}
                                    {word.context && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 italic">
                                            <Quote className="w-3 h-3" />
                                            <span className="line-clamp-1">"{word.context.trim()}"</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
