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
 * Shows a context sentence with a word blanked out. The user types the missing word.
 *
 * The tricky part: `context` is always in the source language of the original word,
 * but items can be swapped (reverse-fetched), so `question` might not appear in `context`.
 * We detect which of question/answer appears in context, blank that one, show the other as hint.
 */

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface ClozeData {
    /** The sentence with a blank */
    sentence: string;
    /** The word the user must type */
    wordToGuess: string;
    /** The hint/translation shown to the user */
    hint: string;
    /** Language of the hint */
    hintLang: string;
    /** Language of the sentence/blank */
    sentenceLang: string;
}

function buildClozeData(item: { question: string; answer: string; context?: string; lang?: { source: string; target: string } }): ClozeData | null {
    if (!item.context) return null;

    const ctx = item.context;
    const qRegex = new RegExp(`\\b${escapeRegex(item.question)}\\b`, 'i');
    const aRegex = new RegExp(`\\b${escapeRegex(item.answer)}\\b`, 'i');

    const bracketMatch = ctx.match(/\[(.*?)\]/);
    if (bracketMatch) {
        return {
            sentence: ctx.replace(/\[.*?\]/, '_____'),
            wordToGuess: bracketMatch[1],
            hint: item.question,
            hintLang: item.lang?.source ?? '',
            sentenceLang: item.lang?.target ?? '',
        };
    }

    const questionInContext = qRegex.test(ctx);
    const answerInContext = aRegex.test(ctx);

    if (questionInContext) {
        // Normal case: question word is in the context sentence
        return {
            sentence: ctx.replace(qRegex, '_____'),
            wordToGuess: item.question,
            hint: item.answer,
            hintLang: item.lang?.target ?? '',
            sentenceLang: item.lang?.source ?? '',
        };
    }

    if (answerInContext) {
        // Swapped case: answer word is in the context sentence
        return {
            sentence: ctx.replace(aRegex, '_____'),
            wordToGuess: item.answer,
            hint: item.question,
            hintLang: item.lang?.source ?? '',
            sentenceLang: item.lang?.target ?? '',
        };
    }

    return null;
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

    // Filter to items that work for cloze (have context with a matchable word)
    const clozeItems = useMemo(
        () => items.filter(i => buildClozeData(i) !== null),
        [items]
    );

    // Use the current item from the store directly so submitAnswer records
    // history against the correct item id. Auto-skip items that can't be clozed.
    const activeItem = items[currentIndex] ?? null;
    const cloze = activeItem ? buildClozeData(activeItem) : null;

    useEffect(() => {
        if (items.length > 0 && clozeItems.length > 0 && activeItem && !cloze) {
            nextItem();
        }
    }, [currentIndex, cloze, activeItem, items.length, clozeItems.length, nextItem]);

    // Progressive hints
    const answerHint = (() => {
        if (!cloze || hintLevel === 0) return '';
        const w = cloze.wordToGuess;
        if (hintLevel === 1) return w[0] + '·'.repeat(w.length - 1);
        const half = Math.ceil(w.length / 2);
        return w.slice(0, half) + '·'.repeat(w.length - half);
    })();

    // 20s timer for typing
    useEffect(() => {
        if (timerEnabled) setTime(200);
    }, [currentIndex, timerEnabled, setTime]);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [currentIndex]);

    useEffect(() => {
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, []);

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
        if (processingRef.current || !cloze || !input.trim()) return;
        processingRef.current = true;
        setIsProcessing(true);
        setShowAnswer(true);

        const isCorrect = input.trim().toLowerCase() === cloze.wordToGuess.toLowerCase();
        (isCorrect ? soundService.playCorrect : soundService.playWrong).call(soundService);
        submitAnswer(isCorrect);
        timeoutRef.current = setTimeout(() => nextItem(), isCorrect ? 1200 : 2500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    };

    // No usable items — but only show error if items have loaded
    if (items.length > 0 && clozeItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <h3 className="text-2xl font-bold">No Cloze Items Available</h3>
                <p className="text-muted-foreground max-w-md">
                    Cloze mode needs words with example sentences that contain the word.
                    Add context sentences to your saved words, or try a different source.
                </p>
                <Button onClick={() => useGameStore.getState().reset()} variant="outline">Back</Button>
            </div>
        );
    }

    // Still loading
    if (items.length === 0) return null;

    if (!cloze) return null;

    const isCorrect = input.trim().toLowerCase() === cloze.wordToGuess.toLowerCase();

    return (
        <div className="flex flex-col h-full justify-center items-center gap-6 animate-in fade-in duration-500">
            <Card className="w-full max-w-2xl bg-gradient-to-br from-card to-secondary/20 border-2 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center p-8 md:p-12 min-h-[220px] gap-5">
                    {/* Hint: the translation of the missing word */}
                    <div className="text-center space-y-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            {cloze.hintLang && `${cloze.hintLang} · `}Translation
                        </p>
                        <h2 className="text-3xl md:text-4xl font-black text-primary">
                            {cloze.hint}
                        </h2>
                    </div>

                    {/* Context sentence with blank */}
                    <div className="border-t pt-4 w-full text-center">
                        <p className="text-sm uppercase tracking-wider text-muted-foreground mb-3">
                            {cloze.sentenceLang && `${cloze.sentenceLang} · `}Fill in the missing word
                        </p>
                        <p className="text-xl md:text-2xl font-semibold leading-relaxed">
                            {cloze.sentence.split('_____').map((part, i, arr) => (
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
                                            {showAnswer ? cloze.wordToGuess : (input || answerHint || '\u00A0')}
                                        </span>
                                    )}
                                </span>
                            ))}
                        </p>
                    </div>

                    {/* Letter count + hint */}
                    {!showAnswer && (
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{cloze.wordToGuess.length} letters</span>
                            {hintLevel > 0 && (
                                <span className="font-mono text-primary font-bold tracking-widest">{answerHint}</span>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Input */}
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
                                onClick={() => hintLevel < 2 && setHintLevel(hintLevel + 1)}
                                disabled={hintLevel >= 2}
                                className="gap-2"
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

                {showAnswer && !isCorrect && (
                    <p className="text-center text-lg animate-in fade-in slide-in-from-bottom-2">
                        Correct: <span className="font-bold text-green-500">{cloze.wordToGuess}</span>
                    </p>
                )}
            </div>
        </div>
    );
}
