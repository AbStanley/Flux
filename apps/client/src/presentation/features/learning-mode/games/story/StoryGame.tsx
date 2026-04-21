import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Button } from "@/presentation/components/ui/button";
import { Card } from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { Check, X, ArrowRight, BookOpen } from 'lucide-react';
import { cn } from "@/lib/utils";

export const StoryGame = () => {
    const { items, currentIndex, submitAnswer, nextItem, setTime, history } = useGameStore();
    const [currentItem] = useState(() => items[currentIndex]);

    const result = currentItem ? history[currentItem.id] : undefined;
    const isSubmitted = result !== undefined;
    const isCorrect = result === true;

    const [userAnswer, setUserAnswer] = useState('');

    const handleSubmit = useCallback((e?: FormEvent) => {
        e?.preventDefault();
        if (!currentItem) return;

        if (isSubmitted) {
            nextItem();
            setUserAnswer('');
            return;
        }

        const cleanUser = userAnswer.trim().toLowerCase();
        const cleanAnswer = currentItem.answer.toLowerCase();

        const correct = cleanUser === cleanAnswer;

        submitAnswer(correct);
        setTime(0); // Stop timer visually
    }, [currentItem, isSubmitted, nextItem, submitAnswer, setTime, userAnswer]);

    // Global listener for Enter key when input is disabled or focused on the button
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && isSubmitted) {
                handleSubmit();
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isSubmitted, handleSubmit]);

    if (!currentItem) return null;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            <Card className="p-8 border-2 shadow-sm min-h-[300px] flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-6 text-muted-foreground uppercase tracking-widest text-sm font-bold">
                        <BookOpen className="w-4 h-4" />
                        Story Segment {currentIndex + 1} / {items.length}
                    </div>

                    <p className="text-2xl md:text-3xl leading-relaxed font-serif text-foreground/90 mb-8">
                        {/* 
                         In story mode, context is the full segment. 
                         We highlight the question word conceptually, or just show the context.
                         The strategy returns:
                         context: "Había una vez un gato."
                         question: "gato" (Target Lang)
                         answer: "cat" (Source Lang)
                         
                         Let's display the context, maybe highlighting the word if possible.
                       */}
                        {currentItem.context?.split(' ').map((word, i) => {
                            // Very basic highlighting if word matches question
                            const isTarget = word.toLowerCase().includes(currentItem.question.toLowerCase());
                            return (
                                <span key={i} className={cn(isTarget ? "bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded" : "")}>
                                    {word}{' '}
                                </span>
                            )
                        })}
                    </p>
                </div>

                <div className="bg-muted/30 p-6 rounded-xl space-y-4">
                    <p className="font-medium text-lg">
                        Translate: <span className="text-primary font-bold">"{currentItem.question}"</span>
                    </p>

                    <form onSubmit={handleSubmit} className="relative">
                        <Input
                            autoFocus
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Type translation..."
                            className={cn(
                                "text-lg h-14 pr-12 transition-all",
                                isSubmitted && isCorrect === true && "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700",
                                isSubmitted && isCorrect === false && "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700"
                            )}
                            disabled={isSubmitted}
                        />
                        <div className="absolute right-3 top-3">
                            {isSubmitted && isCorrect === true && <Check className="w-8 h-8 text-green-500" />}
                            {isSubmitted && isCorrect === false && <X className="w-8 h-8 text-red-500" />}
                        </div>
                    </form>

                    {isSubmitted && !isCorrect && (
                        <div className="animate-in fade-in slide-in-from-top-1 text-red-600 dark:text-red-400 font-medium">
                            Correct answer: {currentItem.answer}
                        </div>
                    )}
                </div>
            </Card>

            <div className="flex justify-center">
                {isSubmitted ? (
                    <Button
                        size="lg"
                        onClick={nextItem}
                        className="w-full md:w-auto min-w-[200px] text-lg font-bold h-14 animate-in zoom-in-95"
                    >
                        Next Segment <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        onClick={() => handleSubmit()}
                        className="w-full md:w-auto min-w-[200px] text-lg font-bold h-14"
                        disabled={!userAnswer.trim()}
                    >
                        Verify
                    </Button>
                )}
            </div>
        </div>
    );
};
