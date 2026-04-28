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
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { playAudio, stopAudio } = useGameAudio();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    const optionsRef = useRef<{ id: string, options: string[], distractors: string[] }>({ id: '', options: [], distractors: [] });

    // Compute options synchronously when currentItem changes to avoid double transition flash
    if (currentItem && optionsRef.current.id !== currentItem.id && items.length >= 4) {
        const correctAnswer = currentItem.answer;
        const pool = items.filter(i => i.id !== currentItem.id);
        const recentSet = new Set(useGameStore.getState().recentDistractorIds);
        
        const fresh = pool.filter(i => !recentSet.has(i.id));
        const stale = pool.filter(i => recentSet.has(i.id));
        const shuffle = <T,>(arr: T[]) => arr.slice().sort(() => 0.5 - Math.random());
        
        const pickedItems = [...shuffle(fresh), ...shuffle(stale)].slice(0, 3);
        const distractors = pickedItems.map(i => {
            if (i.lang?.target === currentItem.lang?.target) return i.answer;
            if (i.lang?.source === currentItem.lang?.target) return i.question;
            return i.answer;
        });

        const finalOptions = [...distractors, correctAnswer].sort(() => 0.5 - Math.random());
        optionsRef.current = { id: currentItem.id, options: finalOptions, distractors: pickedItems.map(i => i.id) };
    }

    const options = currentItem ? optionsRef.current.options : [];

    useEffect(() => {
        if (currentItem && optionsRef.current.distractors.length > 0) {
            useGameStore.getState().setRecentDistractorIds(optionsRef.current.distractors);
        }
    }, [currentItem]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            stopAudio();
        };
    }, [stopAudio]);

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
        if (timerEnabled && timeLeft === 0 && !isProcessing) {
            setIsProcessing(true);
            soundService.playWrong();
            submitAnswer(false);
            playAudio(currentItem!.answer, currentItem!.lang?.target, undefined).then(() => {
                timeoutRef.current = setTimeout(() => nextItem(), 1500);
            });
        }
    }, [timeLeft, timerEnabled, isProcessing, playAudio, currentItem, submitAnswer, nextItem]);

    // Reset local state when item changes
    useEffect(() => {
        setSelectedOption(null);
        setIsProcessing(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, [currentIndex]);

    const handleOptionClick = async (option: string) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setSelectedOption(option);

        const isCorrect = option === currentItem!.answer;
        submitAnswer(isCorrect);

        if (isCorrect) {
            soundService.playCorrect();
            await playAudio(option, currentItem!.lang?.target, undefined);
            timeoutRef.current = setTimeout(() => {
                nextItem();
            }, 500);
        } else {
            soundService.playWrong();
            await playAudio(currentItem!.answer, currentItem!.lang?.target, undefined);
            timeoutRef.current = setTimeout(() => {
                nextItem();
            }, 1000); // Auto-advance after giving time to hear audio and see hint
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

    const isWrongOrTimeout = isProcessing && (selectedOption !== currentItem.answer || timeLeft === 0);

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
                            disabled={isProcessing}
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
