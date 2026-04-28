import { useRef, useCallback } from 'react';
import { type Word } from '../../../../infrastructure/api/words';
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Edit, Trash2, BookOpen, Globe, Quote, Volume2, ArrowRight, Clock, Gamepad2 } from 'lucide-react';
import { getLanguageCode } from '../utils/languageUtils';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { useGameStore } from '../../learning-mode/store/useGameStore';
import { useViewStore } from '../../navigation/store/useViewStore';
import { AppView } from '../../navigation/types';

interface WordListProps {
    words: Word[];
    onEdit: (word: Word) => void;
    onDelete: (id: string) => void;
    emptyMessage?: string;
    hasMore?: boolean;
    isLoading?: boolean;
    onLoadMore?: () => void;
}

export function WordList({ words, onEdit, onDelete, emptyMessage = "No items found.", hasMore, isLoading, onLoadMore }: WordListProps) {
    const handlePractice = (word: Word) => {
        const gameStore = useGameStore.getState();
        gameStore.updateConfig({
            sourceLang: word.sourceLanguage || 'Spanish',
            targetLang: word.targetLanguage || 'English',
        });
        gameStore.startGame();
        useViewStore.getState().setView(AppView.LearningMode);
    };

    const handlePlayAudio = (e: React.MouseEvent, text: string, language?: string) => {
        e.stopPropagation();

        // Cancel any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getLanguageCode(language);
        utterance.rate = 0.9; // Slightly slower for better clarity

        window.speechSynthesis.speak(utterance);
    };

    const desktopObserver = useRef<IntersectionObserver | null>(null);
    const mobileObserver = useRef<IntersectionObserver | null>(null);

    const desktopWordElementRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (isLoading) return;
            if (desktopObserver.current) desktopObserver.current.disconnect();

            if (node) {
                // Desktop uses Radix ScrollArea, which requires a specific viewport root
                const scrollContainer = node.closest('[data-radix-scroll-area-viewport]') || null;

                desktopObserver.current = new IntersectionObserver(
                    (entries) => {
                        if (entries[0].isIntersecting && hasMore) {
                            onLoadMore?.();
                        }
                    },
                    {
                        root: scrollContainer,
                        rootMargin: '200px'
                    }
                );
                desktopObserver.current.observe(node);
            }
        },
        [isLoading, hasMore, onLoadMore]
    );

    const mobileWordElementRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (isLoading) return;
            if (mobileObserver.current) mobileObserver.current.disconnect();

            if (node) {
                // Mobile uses the native browser window window for scrolling, no inner root needed
                mobileObserver.current = new IntersectionObserver(
                    (entries) => {
                        if (entries[0].isIntersecting && hasMore) {
                            onLoadMore?.();
                        }
                    },
                    {
                        root: null,
                        rootMargin: '200px'
                    }
                );
                mobileObserver.current.observe(node);
            }
        },
        [isLoading, hasMore, onLoadMore]
    );

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-all hover:shadow-md">
            {/* Desktop View */}
            <ScrollArea className="hidden md:block h-[600px]">
                <table className="w-full caption-bottom text-sm">
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-md shadow-sm">
                        <TableRow>
                            <TableHead className="w-[50px] text-center">Audio</TableHead>
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
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            words.map((word) => (
                                <TableRow key={word.id} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell className="align-top py-4 text-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-full text-slate-500 hover:text-primary hover:bg-primary/10"
                                            onClick={(e) => handlePlayAudio(e, word.text, word.sourceLanguage || word.targetLanguage)}
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
                                        <div className="max-w-xs text-sm text-muted-foreground leading-relaxed line-clamp-2">
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
                                                className="h-8 w-8 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400"
                                                onClick={() => handlePractice(word)}
                                                title="Practice this word"
                                            >
                                                <Gamepad2 className="h-4 w-4" />
                                            </Button>
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
                        {/* Sentinel row right at the end of the table data */}
                        {hasMore && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-12 text-center text-muted-foreground border-none p-0">
                                    <div ref={desktopWordElementRef} className="w-full flex items-center justify-center p-4">
                                        {isLoading ? 'Loading more items...' : ''}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </table>
            </ScrollArea>

            {/* Mobile View */}

            <div className="block md:hidden space-y-3 p-3">
                {words.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-medium text-lg text-foreground">No items yet</h3>
                            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                        </div>
                    </div>
                ) : (
                    words.map((word) => (
                        <div
                            key={word.id}
                            className="bg-card rounded-xl border shadow-sm p-4 space-y-3 active:scale-[0.99] transition-transform duration-200"
                        >
                            <div className="flex justify-between items-start gap-3">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-bold text-xl tracking-tight text-primary">
                                            {word.text}
                                        </h3>
                                        {word.pronunciation && (
                                            <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                                                /{word.pronunciation}/
                                            </span>
                                        )}
                                    </div>

                                    {(word.sourceLanguage || word.targetLanguage) && (
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                            <Globe className="w-3 h-3" />
                                            <span>{getLanguageCode(word.sourceLanguage).toUpperCase()}</span>
                                            <ArrowRight className="w-3 h-3 opacity-50" />
                                            <span>{getLanguageCode(word.targetLanguage).toUpperCase()}</span>
                                        </div>
                                    )}
                                    <SrsBadge word={word} />
                                </div>

                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-10 w-10 rounded-full shrink-0 shadow-sm"
                                    onClick={(e) => handlePlayAudio(e, word.text, word.sourceLanguage || word.targetLanguage)}
                                >
                                    <Volume2 className="h-5 w-5 text-primary" />
                                </Button>
                            </div>

                            {word.definition && (
                                <div className="text-sm text-foreground/90 leading-relaxed border-l-2 border-primary/20 pl-3 py-0.5">
                                    {word.definition}
                                </div>
                            )}

                            {(word.sourceTitle || word.context) && (
                                <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-xs">
                                    {word.context && (
                                        <div className="flex gap-2">
                                            <Quote className="w-3 h-3 text-primary/50 shrink-0 mt-0.5" />
                                            <p className="italic text-muted-foreground leading-relaxed">
                                                "{word.context.trim()}"
                                            </p>
                                        </div>
                                    )}
                                    {word.sourceTitle && (
                                        <div className="flex items-center gap-1.5 text-muted-foreground/70 font-medium">
                                            <BookOpen className="w-3 h-3" />
                                            <span className="truncate">{word.sourceTitle}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-2 flex justify-end gap-2 border-t border-border/50">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                                    onClick={() => handlePractice(word)}
                                >
                                    <Gamepad2 className="mr-1.5 h-3.5 w-3.5" />
                                    Practice
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-muted-foreground hover:text-foreground"
                                    onClick={() => onEdit(word)}
                                >
                                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => onDelete(word.id)}
                                >
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))
                )}
                {hasMore && (
                    <div ref={mobileWordElementRef} className="flex justify-center py-4 text-sm text-muted-foreground">
                        {isLoading ? 'Loading more items...' : ''}
                    </div>
                )}
            </div>
        </div>
    );
};

function SrsBadge({ word }: { word: Word }) {
    if (!word.srsNextReview) return null;

    const isDue = new Date(word.srsNextReview) <= new Date();
    const reps = word.srsRepetitions ?? 0;

    if (isDue) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full w-fit border border-destructive/20">
                <Clock className="w-2.5 h-2.5" />
                Due
            </span>
        );
    }

    if (reps > 0) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full w-fit">
                {reps}x reviewed
            </span>
        );
    }

    return null;
}
