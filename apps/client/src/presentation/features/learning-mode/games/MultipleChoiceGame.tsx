import { useEffect, useState, useRef, useMemo } from 'react';
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { useGameStore } from '../store/useGameStore';
import { cn } from "@/lib/utils";
import { Volume2 } from 'lucide-react';
import { soundService } from '../../../../core/services/SoundService';
import { useGameAudio } from './hooks/useGameAudio';

export function MultipleChoiceGame() {
    const { items, currentIndex, submitAnswer, nextItem, timeLeft, config } = useGameStore();
    const timerEnabled = config.timerEnabled;
    const [interaction, setInteraction] = useState<{ itemId: string; selectedOption: string | null; isProcessing: boolean }>({
        itemId: '',
        selectedOption: null,
        isProcessing: false,
    });
    const { playAudio, stopAudio } = useGameAudio();
    const abortControllerRef = useRef<AbortController | null>(null);
    const timeoutHandledRef = useRef<string>('');

    // Setup AbortController for clean async cancellation
    useEffect(() => {
        abortControllerRef.current = new AbortController();
        return () => {
            abortControllerRef.current?.abort();
        };
    }, [currentIndex]); // Re-create per question to kill lingering promises when advancing

    const baseItem = items[currentIndex];

    // Mix Mode Logic: Randomly flip question/answer for this item
    const currentItem = useMemo(() => {
        if (!baseItem) return null;
        if (!config.mixMode) return baseItem;

        // Deterministic pseudo-random based on id to prevent flipping on re-renders
        const charCode = baseItem.id.charCodeAt(baseItem.id.length - 1);
        const shouldFlip = charCode % 2 === 0;

        if (shouldFlip) {
            return {
                ...baseItem,
                question: baseItem.answer,
                answer: baseItem.question,
                lang: {
                    source: baseItem.lang?.target,
                    target: baseItem.lang?.source
                }
            };
        }
        return baseItem;
    }, [baseItem, config.mixMode]);

    const hashString = (value: string) => {
        let hash = 0;
        for (let i = 0; i < value.length; i += 1) {
            hash = (hash * 31 + value.charCodeAt(i)) | 0;
        }
        return Math.abs(hash);
    };

    const seededShuffle = <T,>(arr: T[], seed: number): T[] => {
        const result = [...arr];
        let s = seed || 1;
        for (let i = result.length - 1; i > 0; i -= 1) {
            s = (s * 1664525 + 1013904223) >>> 0;
            const j = s % (i + 1);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    };

    const optionsData = useMemo(() => {
        if (!currentItem || items.length < 4) {
            return { options: [] as string[], distractorIds: [] as string[] };
        }

        const correctAnswer = currentItem.answer;
        const pool = items.filter(i => i.id !== currentItem.id);
        const recentSet = new Set(useGameStore.getState().recentDistractorIds);
        const fresh = pool.filter(i => !recentSet.has(i.id));
        const stale = pool.filter(i => recentSet.has(i.id));

        const baseSeed = hashString(`${currentItem.id}|${currentIndex}|${items.length}`);
        const pickedItems = [
            ...seededShuffle(fresh, baseSeed + 1),
            ...seededShuffle(stale, baseSeed + 2),
        ].slice(0, 3);

        const distractors = pickedItems.map(i => {
            if (i.lang?.target === currentItem.lang?.target) return i.answer;
            if (i.lang?.source === currentItem.lang?.target) return i.question;
            return i.answer;
        });

        const finalOptions = seededShuffle([...distractors, correctAnswer], baseSeed + 3);
        return { options: finalOptions, distractorIds: pickedItems.map(i => i.id) };
    }, [currentItem, currentIndex, items]);

    const options = optionsData.options;
    const isCurrentInteraction = currentItem ? interaction.itemId === currentItem.id : false;
    const selectedOption = isCurrentInteraction ? interaction.selectedOption : null;
    const isProcessing = isCurrentInteraction ? interaction.isProcessing : false;
    const timedOut = timerEnabled && timeLeft === 0;

    useEffect(() => {
        if (currentItem && optionsData.distractorIds.length > 0) {
            useGameStore.getState().setRecentDistractorIds(optionsData.distractorIds);
        }
    }, [currentItem, optionsData.distractorIds]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAudio();
        };
    }, [stopAudio]);

    const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
        if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        });
    });

    // Auto-play Question on load
    useEffect(() => {
        let mounted = true;
        if (currentItem && options.length > 0) {
            const timer = setTimeout(() => {
                if (mounted) playAudio(currentItem.question, currentItem.lang?.source, currentItem.audioUrl);
            }, 300);
            return () => {
                mounted = false;
                clearTimeout(timer);
            };
        }
    }, [currentItem, options.length, playAudio]);

    // Handle Timeout
    useEffect(() => {
        if (!currentItem || !timerEnabled || timeLeft !== 0) return;
        if (timeoutHandledRef.current === currentItem.id) return;

        timeoutHandledRef.current = currentItem.id;
        soundService.playWrong();
        submitAnswer(false);

        const processTimeout = async () => {
            try {
                await playAudio(currentItem.answer, currentItem.lang?.target, undefined);
                await sleep(1500, abortControllerRef.current?.signal);
                nextItem();
            } catch (e) {
                if (e instanceof Error && e.name === 'AbortError') return;
                console.error(e);
            }
        };
        void processTimeout();
    }, [timeLeft, timerEnabled, playAudio, currentItem, submitAnswer, nextItem]);

    const currentItemId = currentItem?.id;
    useEffect(() => {
        if (currentItemId) {
            timeoutHandledRef.current = '';
        }
    }, [currentItemId]);

    const handleOptionClick = async (option: string) => {
        if (isProcessing) return;
        if (!currentItem) return;

        setInteraction({
            itemId: currentItem.id,
            selectedOption: option,
            isProcessing: true,
        });

        const isCorrect = option === currentItem.answer;
        submitAnswer(isCorrect);

        try {
            if (isCorrect) {
                soundService.playCorrect();
                await playAudio(option, currentItem.lang?.target, undefined);
                await sleep(500, abortControllerRef.current?.signal);
                nextItem();
            } else {
                soundService.playWrong();
                await playAudio(currentItem.answer, currentItem.lang?.target, undefined);
                await sleep(1500, abortControllerRef.current?.signal); // Give enough time, but strictly controlled
                nextItem();
            }
        } catch (e) {
            if (e instanceof Error && e.name === 'AbortError') return;
            console.error(e);
        }
    };

    if (!currentItem || options.length === 0) return null;

    if (items.length < 4) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <h3 className="text-2xl font-bold">Not Enough Vocabulary</h3>
                <p className="text-muted-foreground">You need at least 4 items to play Multiple Choice.</p>
                <Button onClick={() => window.location.reload()} variant="outline">Back</Button>
            </div>
        )
    }

    const isWrongOrTimeout = (isProcessing && selectedOption !== currentItem.answer) || timedOut;

    return (
        <div className="flex flex-col h-full justify-center items-center gap-8 w-full">
            {/* Question Card */}
            <Card className="w-full max-w-2xl bg-gradient-to-br from-card to-secondary/20 border-2 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="flex flex-col items-center justify-center p-12 min-h-[200px] gap-6">
                    <h2 className="text-4xl md:text-5xl font-black text-center text-primary drop-shadow-sm tracking-tight leading-tight">
                        {currentItem.question}
                    </h2>

                    {/* Audio Button */}
                    <div className="flex gap-2 justify-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => playAudio(currentItem.question, currentItem.lang?.source, currentItem.audioUrl)}
                            className="rounded-full h-12 w-12 hover:bg-primary/20 hover:text-primary transition-colors"
                        >
                            <Volume2 className="w-6 h-6" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {options.map((option, idx) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = option === currentItem.answer;

                    // Base: Darker matte feel
                    let variantClass = "bg-card/5 hover:bg-card/10 border-slate-700 hover:border-slate-500 text-foreground transition-all duration-200";

                    if (isProcessing) {
                        if (isCorrect) {
                            variantClass = "bg-green-600 border-green-600 text-white scale-[1.02] shadow-lg shadow-green-900/20";
                        } else if (isSelected) {
                            variantClass = "bg-red-600 border-red-600 text-white animate-shake shadow-lg shadow-red-900/20";
                        } else {
                            variantClass = "opacity-30 grayscale";
                        }
                    }

                    return (
                        <Button
                            key={idx}
                            variant="outline"
                            className={cn(
                                "h-auto py-6 text-xl font-bold transition-all duration-200 border-2 min-h-[80px] rounded-xl whitespace-normal leading-tight hover:translate-y-[-2px] disabled:opacity-100",
                                variantClass
                            )}
                            onClick={() => handleOptionClick(option)}
                            disabled={isProcessing || timedOut}
                        >
                            {option}
                        </Button>
                    );
                })}
            </div>

            {/* Hint & Continue Button Wrapper */}
            <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center justify-between gap-4 h-14">
                <div className="flex-1">
                    {isWrongOrTimeout && currentItem.context && (
                        <div className="text-sm text-muted-foreground animate-in slide-in-from-left-4 bg-secondary/50 px-4 py-2 rounded-lg">
                            💡 Hint: {currentItem.context}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
