import { useRef, useCallback } from 'react';
import { type Word } from '../../../../infrastructure/api/words';
import { getLanguageCode } from '../utils/languageUtils';
import { ScrollArea, ScrollBar } from '../../../components/ui/scroll-area';
import { useGameStore } from '../../learning-mode/store/useGameStore';
import { useViewStore } from '../../navigation/store/useViewStore';
import { AppView } from '../../navigation/types';
import { AnimatePresence } from 'framer-motion';
import { WordTableDesktop } from './WordTableDesktop';
import { WordListMobile } from './WordListMobile';

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
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = getLanguageCode(language);
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const desktopObserver = useRef<IntersectionObserver | null>(null);
    const mobileObserver = useRef<IntersectionObserver | null>(null);

    const desktopWordElementRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading || !hasMore) return;
        if (desktopObserver.current) desktopObserver.current.disconnect();

        if (node) {
            const scrollContainer = node.closest('[data-radix-scroll-area-viewport]') || null;
            desktopObserver.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore && !isLoading) {
                        onLoadMore?.();
                    }
                },
                {
                    root: scrollContainer,
                    rootMargin: '100px', // Reduced margin to be less aggressive
                    threshold: 0.1
                }
            );
            desktopObserver.current.observe(node);
        }
    }, [isLoading, hasMore, onLoadMore]);

    const mobileWordElementRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading || !hasMore) return;
        if (mobileObserver.current) mobileObserver.current.disconnect();

        if (node) {
            mobileObserver.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore && !isLoading) {
                        onLoadMore?.();
                    }
                },
                {
                    root: null,
                    rootMargin: '100px',
                    threshold: 0.1
                }
            );
            mobileObserver.current.observe(node);
        }
    }, [isLoading, hasMore, onLoadMore]);

    const isEmpty = words.length === 0 && !isLoading;

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-all hover:shadow-md h-[600px] md:h-[calc(100vh-400px)] min-h-[400px] flex flex-col">
            <ScrollArea className="hidden md:block h-full w-full">
                <AnimatePresence mode="wait">
                    <WordTableDesktop
                        words={words} isLoading={!!isLoading} isEmpty={isEmpty}
                        emptyMessage={emptyMessage} hasMore={!!hasMore}
                        onEdit={onEdit} onDelete={onDelete}
                        onPractice={handlePractice} onPlayAudio={handlePlayAudio}
                        sentinelRef={desktopWordElementRef}
                    />
                </AnimatePresence>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <div className="block md:hidden flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <WordListMobile
                        words={words} isLoading={!!isLoading} isEmpty={isEmpty}
                        emptyMessage={emptyMessage} hasMore={!!hasMore}
                        onEdit={onEdit} onDelete={onDelete}
                        onPractice={handlePractice} onPlayAudio={handlePlayAudio}
                        sentinelRef={mobileWordElementRef}
                    />
                </AnimatePresence>
            </div>
        </div>
    );
}
