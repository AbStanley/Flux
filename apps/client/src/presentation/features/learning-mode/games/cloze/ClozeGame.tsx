import { useEffect, useState, useRef, useMemo } from 'react';
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { useGameStore } from '../../store/useGameStore';
import { cn } from "@/lib/utils";
import { Eye, SkipForward } from 'lucide-react';
import { soundService } from '../../../../../core/services/SoundService';

/**
 * Cloze Deletion Game
 *
 * Shows a context sentence with the target word blanked out.
 * The user must type the missing word.
 *
 * Data flow:
 * - question = the word (e.g. "Gato")
 * - answer   = the translation/definition (e.g. "Cat")
 * - context  = an example sentence containing the word (e.g. "El gato es negro")
 *
 * The blank replaces `question` inside `context`. The hint shown is `answer`.
 */

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function ClozeGame() {
    const { items, currentIndex, submitAnswer, nextItem, timeLeft, config, setTime } = useGameStore();
    const timerEnabled = config.timerEnabled;
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [hintLevel, setHintLevel] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const processingRef = useRef(false);

    const currentItem = items[currentIndex];

    // Filter to only items that have context and are single words
    const clozeItems = useMemo(
        () => items.filter(i => i.type === 'word' && i.context && i.context.toLowerCase().includes(i.question.toLowerCase())),
        [items]
    );

    // Find the current cloze-compatible item
    const clozeItem = clozeItems.length > 0 ? clozeItems[currentIndex % clozeItems.length] : null;
    const item = clozeItem ?? currentItem;

    // The word to blank out is the question (the foreign word in the sentence)
    const targetWord = item?.question ?? '';

    // Build cloze sentence
    const clozeSentence = useMemo(() => {
        if (!item?.context) return null;
        const regex = new RegExp(`(${escapeRegex(targetWord)})`, 'i');
        if (regex.test(item.context)) {
            return item.context.replace(regex, '_____');
        }
        return null;
    }, [item, targetWord]);

    // Progressive hints based on the target word
    const answerHint = (() => {
        if (!targetWord || hintLevel === 0) return '';
        if (hintLevel === 1) return targetWord[0] + '·'.repeat(targetWord.length - 1);
        const half = Math.ceil(targetWord.length / 2);
        return targetWord.slice(0, half) + '·'.repeat(targetWord.length - half);
    })();

    // Give cloze mode more time — 20s instead of 10s
    useEffect(() => {
        if (timerEnabled) setTime(200);
    }, [currentIndex, timerEnabled, setTime]);

    // Focus input
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [currentIndex]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // Handle timeout
    useEffect(() => {
        if (timerEnabled && timeLeft === 0 && !processingRef.current) {
            processingRef.current = true;
            soundService.playWrong();
            submitAnswer(false);
            setTimeout(() => {
                setIsProcessing(true);
                setShowAnswer(true);
            }, 0);
            timeoutRef.current = setTimeout(() => nextItem(), 2500);
        }
    }, [timeLeft, timerEnabled, submitAnswer, nextItem]);

    // Reset on item change
    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        processingRef.current = false;
        setTimeout(() => {
            setInput('');
            setIsProcessing(false);
            setShowAnswer(false);
            setHintLevel(0);
        }, 0);
    }, [currentIndex]);

    const handleSubmit = () => {
        if (processingRef.current || !input.trim()) return;
        processingRef.current = true;
        setIsProcessing(true);
        setShowAnswer(true);

        const isCorrect = input.trim().toLowerCase() === targetWord.toLowerCase();

        if (isCorrect) {
            soundService.playCorrect();
        } else {
            soundService.playWrong();
        }

        submitAnswer(isCorrect);
        timeoutRef.current = setTimeout(() => nextItem(), isCorrect ? 1200 : 2500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    };

    const revealHint = () => {
        if (hintLevel < 2) setHintLevel(hintLevel + 1);
    };

    if (!item) return null;

    // No usable cloze items
    if (!clozeSentence) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <h3 className="text-2xl font-bold">No Cloze Items Available</h3>
                <p className="text-muted-foreground max-w-md">
                    Cloze mode needs words that have example sentences containing the word.
                    Try adding context sentences to your saved words.
                </p>
                <Button onClick={() => useGameStore.getState().reset()} variant="outline">Back</Button>
            </div>
        );
    }

    const isCorrect = input.trim().toLowerCase() === targetWord.toLowerCase();

    return (
        <div className="flex flex-col h-full justify-center items-center gap-6 animate-in fade-in duration-500">
            <Card className="w-full max-w-2xl bg-gradient-to-br from-card to-secondary/20 border-2 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center p-8 md:p-12 min-h-[220px] gap-5">
                    {/* Translation hint — tells user what word to fill in */}
                    <div className="text-center space-y-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            What is the {item.lang?.source ?? 'source'} word for...
                        </p>
                        <h2 className="text-3xl md:text-4xl font-black text-primary">
                            {item.answer}
                        </h2>
                    </div>

                    {/* Context sentence with blank */}
                    <div className="border-t pt-4 w-full text-center">
                        <p className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
                            Fill in the missing word
                        </p>
                        <p className="text-xl md:text-2xl font-semibold leading-relaxed">
                            {clozeSentence.split('_____').map((part, i, arr) => (
                                <span key={i}>
                                    {part}
                                    {i < arr.length - 1 && (
                                        <span className={cn(
                                            "inline-block min-w-[80px] border-b-4 mx-1 px-2 pb-1 font-black",
                                            showAnswer
                                                ? isCorrect
                                                    ? "border-green-500 text-green-500"
                                                    : "border-red-500 text-red-500"
                                                : "border-primary/40 text-primary/70"
                                        )}>
                                            {showAnswer ? targetWord : (input || answerHint || '\u00A0')}
                                        </span>
                                    )}
                                </span>
                            ))}
                        </p>
                    </div>

                    {/* Letter count + hint */}
                    {!showAnswer && (
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{targetWord.length} letters</span>
                            {hintLevel > 0 && (
                                <span className="font-mono text-primary font-bold tracking-widest">{answerHint}</span>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Input area */}
            <div className="w-full max-w-md space-y-3">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isProcessing}
                    placeholder="Type the missing word..."
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className={cn(
                        "w-full text-center text-2xl font-bold py-4 px-6 rounded-xl border-2 bg-background outline-none transition-all",
                        isProcessing
                            ? isCorrect
                                ? "border-green-500 bg-green-500/10"
                                : "border-red-500 bg-red-500/10"
                            : "border-border focus:border-primary"
                    )}
                />

                <div className="flex gap-2">
                    {!isProcessing && (
                        <>
                            <Button
                                variant="outline"
                                onClick={revealHint}
                                disabled={hintLevel >= 2}
                                className="gap-2"
                                title="Reveal hint"
                            >
                                <Eye className="w-4 h-4" />
                                Hint {hintLevel > 0 && `(${hintLevel}/2)`}
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!input.trim()}
                                className="flex-1 h-12 text-lg font-bold shadow-lg"
                            >
                                Check
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => { submitAnswer(false); nextItem(); }}
                                title="Skip"
                            >
                                <SkipForward className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                </div>

                {/* Show correct answer on wrong */}
                {showAnswer && !isCorrect && (
                    <p className="text-center text-lg animate-in fade-in slide-in-from-bottom-2">
                        Correct: <span className="font-bold text-green-500">{targetWord}</span>
                    </p>
                )}
            </div>
        </div>
    );
}
