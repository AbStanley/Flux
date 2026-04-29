import { motion } from 'framer-motion';
import { Volume2, Gamepad2, Edit, Trash2, Globe, BookOpen, Quote, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { type Word } from '../../../../infrastructure/api/words';
import { getLanguageCode } from '../utils/languageUtils';
import { SrsBadge } from './SrsBadge';
import { WordListSkeleton } from './WordListSkeleton';
import { WordListEmptyState } from './WordListEmptyState';

interface WordListMobileProps {
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

export function WordListMobile({
    words, isLoading, isEmpty, emptyMessage, hasMore,
    onEdit, onDelete, onPractice, onPlayAudio, sentinelRef
}: WordListMobileProps) {
    return (
        <div className="space-y-3 p-3">
            {isLoading && words.length === 0 ? (
                <WordListSkeleton isMobile />
            ) : isEmpty ? (
                <WordListEmptyState message={emptyMessage} />
            ) : (
                <>
                    {words.map((word, index) => (
                        <motion.div
                            key={word.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.03, duration: 0.2 }}
                            className="bg-card rounded-xl border shadow-sm p-4 space-y-3 active:scale-[0.98] transition-transform duration-200"
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
                                    onClick={(e) => onPlayAudio(e, word.text, word.sourceLanguage || word.targetLanguage)}
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
                                    variant="ghost" size="sm"
                                    className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                                    onClick={() => onPractice(word)}
                                >
                                    <Gamepad2 className="mr-1.5 h-3.5 w-3.5" />
                                    Practice
                                </Button>
                                <Button
                                    variant="ghost" size="sm"
                                    className="h-8 px-3 text-muted-foreground hover:text-foreground"
                                    onClick={() => onEdit(word)}
                                >
                                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost" size="sm"
                                    className="h-8 px-3 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => onDelete(word.id)}
                                >
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                    Delete
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                    {hasMore && (
                        <div ref={sentinelRef} className="flex justify-center py-6">
                            {isLoading && (
                                <div className="flex items-center gap-2 text-primary font-medium animate-pulse">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                                    <span className="ml-2 text-sm">Loading more...</span>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
