import { motion } from 'framer-motion';
import { Volume2, Gamepad2, Edit, Trash2, Globe, BookOpen, Quote } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { type Word } from '../../../../infrastructure/api/words';
import { SrsBadge } from './SrsBadge';
import { WordListSkeleton } from './WordListSkeleton';
import { WordListEmptyState } from './WordListEmptyState';

interface WordTableDesktopProps {
    words: Word[];
    isLoading: boolean;
    isEmpty: boolean;
    emptyMessage: string;
    hasMore: boolean;
    onEdit: (word: Word) => void;
    onDelete: (id: string) => void;
    onPractice: (word: Word) => void;
    onPlayAudio: (e: React.MouseEvent, text: string, language?: string) => void;
    sentinelRef: (node: HTMLDivElement | null) => void;
}

export function WordTableDesktop({
    words, isLoading, isEmpty, emptyMessage, hasMore,
    onEdit, onDelete, onPractice, onPlayAudio, sentinelRef
}: WordTableDesktopProps) {
    return (
        <table className="w-full caption-bottom text-sm border-collapse table-fixed">
            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-md shadow-sm border-b">
                <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="w-[5%] text-center">Audio</TableHead>
                    <TableHead className="w-[20%] pl-6">Entry</TableHead>
                    <TableHead className="">Definition</TableHead>
                    <TableHead className="w-[15%]">Translation</TableHead>
                    <TableHead className="w-[20%]">Source & Context</TableHead>
                    <TableHead className="w-[15%] text-right pr-6">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading && words.length === 0 ? (
                    <WordListSkeleton />
                ) : isEmpty ? (
                    <TableRow>
                        <TableCell colSpan={6} className="p-0 border-none">
                            <WordListEmptyState message={emptyMessage} />
                        </TableCell>
                    </TableRow>
                ) : (
                    <>
                        {words.map((word, index) => (
                            <motion.tr
                                key={word.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03, duration: 0.3 }}
                                className="group hover:bg-muted/30 transition-colors border-b last:border-0"
                            >
                                <TableCell className="align-top py-4 text-center">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full text-slate-500 hover:text-primary hover:bg-primary/10"
                                        onClick={(e) => onPlayAudio(e, word.text, word.sourceLanguage || word.targetLanguage)}
                                        title="Listen"
                                    >
                                        <Volume2 className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                                <TableCell className="font-semibold text-base py-4 pl-6 align-top">
                                    <div className="flex flex-col gap-1">
                                        <span className="group-hover:text-primary transition-colors">{word.text}</span>
                                        {word.pronunciation && (
                                            <span className="text-xs text-muted-foreground font-normal font-mono">
                                                /{word.pronunciation}/
                                            </span>
                                        )}
                                        <SrsBadge word={word} />
                                    </div>
                                </TableCell>
                                <TableCell className="align-top py-4">
                                    <div className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                        {word.definition || <span className="italic text-muted-foreground/50">No definition</span>}
                                    </div>
                                </TableCell>
                                <TableCell className="align-top py-4">
                                    {(word.sourceLanguage || word.targetLanguage) ? (
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
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
                                            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                                <BookOpen className="w-3 h-3 mt-0.5 shrink-0" />
                                                <span className="truncate max-w-full" title={word.sourceTitle}>
                                                    {word.sourceTitle}
                                                </span>
                                            </div>
                                        )}
                                        {word.context && (
                                            <div className="flex items-start gap-1.5 text-xs text-muted-foreground/80 italic">
                                                <Quote className="w-3 h-3 mt-0.5 shrink-0" />
                                                <span className="truncate max-w-full" title={word.context}>
                                                    "{word.context.trim()}"
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-6 align-top py-4">
                                    <div className="flex justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost" size="icon"
                                            className="h-8 w-8 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400"
                                            onClick={() => onPractice(word)}
                                            title="Practice this word"
                                        >
                                            <Gamepad2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                                            onClick={() => onEdit(word)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                                            onClick={() => onDelete(word.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </motion.tr>
                        ))}
                        {hasMore && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-12 text-center text-muted-foreground border-none p-0">
                                    <div ref={sentinelRef} className="w-full flex items-center justify-center p-4">
                                        {isLoading && (
                                            <div className="flex items-center gap-2 text-primary font-medium animate-pulse">
                                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                                                <span className="ml-2">Loading more...</span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </>
                )}
            </TableBody>
        </table>
    );
}
