import { useEffect, useState, useRef } from 'react';
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

    const currentItem = items[currentIndex];

    // Generate Options
    const [options, setOptions] = useState<string[]>([]);

    // Generate Options
    useEffect(() => {
        if (!currentItem || items.length < 4) {
            setOptions([]);
            return;
        }

        const correctAnswer = currentItem.answer;
        const pool = items.filter(i => i.id !== currentItem.id);
        const distractors = pool.sort(() => 0.5 - Math.random()).slice(0, 3).map(i => i.answer);

        setOptions([...distractors, correctAnswer].sort(() => 0.5 - Math.random()));
    }, [currentItem, items]);

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
        if (currentItem) {
            const timer = setTimeout(() => {
                if (mounted) playAudio(currentItem.question, currentItem.lang?.source, currentItem.audioUrl);
            }, 500);
            return () => {
                mounted = false;
                clearTimeout(timer);
            };
        }
    }, [currentItem, playAudio]);

    // Handle Timeout
    useEffect(() => {
        if (timerEnabled && timeLeft === 0 && !isProcessing) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsProcessing(true);
            soundService.playWrong();

            playAudio(currentItem.answer, currentItem.lang?.target, undefined).then(() => {
                timeoutRef.current = setTimeout(() => nextItem(), 1500);
            });
        }
    }, [timeLeft, timerEnabled, isProcessing, playAudio, currentItem, nextItem]);

    // Reset local state when item changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedOption(null);
        setIsProcessing(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, [currentIndex]);

    const handleOptionClick = async (option: string) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setSelectedOption(option);

        const isCorrect = option === currentItem.answer;

        if (isCorrect) {
            soundService.playCorrect();
        } else {
            soundService.playWrong();
        }

        submitAnswer(isCorrect);

        await playAudio(currentItem.answer, currentItem.lang?.target, undefined);

        timeoutRef.current = setTimeout(() => {
            nextItem();
        }, 500);
    };

    if (!currentItem) return null;

    if (items.length < 4) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <h3 className="text-2xl font-bold">Not Enough Vocabulary</h3>
                <p className="text-muted-foreground">You need at least 4 items to play Multiple Choice.</p>
                <Button onClick={() => window.location.reload()} variant="outline">Back</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full justify-center items-center gap-8 animate-in fade-in duration-500">
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

            {/* Hint */}
            {isProcessing && selectedOption !== currentItem.answer && currentItem.context && (
                <div className="text-sm text-muted-foreground animate-in slide-in-from-top-2 bg-secondary/50 px-4 py-2 rounded-lg">
                    💡 Hint: {currentItem.context}
                </div>
            )}
        </div>
    );
};
