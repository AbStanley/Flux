import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { useGameAudio } from '../../hooks/useGameAudio';
import { soundService } from '@/core/services/SoundService';
import type { WordBrickData, WordSlotData } from '../types';

/**
 * Custom hook for Sentence Scramble game logic.
 * Tokenizes target sentence, shuffles words, handles placement and validation.
 */
export function useSentenceScrambleLogic() {
    const { items, currentIndex, submitAnswer, nextItem, timeLeft, config } = useGameStore();
    const { playAudio, stopAudio } = useGameAudio();

    const currentItem = items[currentIndex];

    // Core state
    const [slots, setSlots] = useState<WordSlotData[]>([]);
    const [wordPool, setWordPool] = useState<WordBrickData[]>([]);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    // Tokenize sentence into words
    const tokenize = useCallback((sentence: string): string[] => {
        return sentence.split(/\s+/).filter(s => s.length > 0);
    }, []);

    // Shuffle array (Fisher-Yates)
    const shuffle = useCallback(<T,>(arr: T[]): T[] => {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }, []);

    // Initialize round
    useEffect(() => {
        if (!currentItem) return;

        const words = tokenize(currentItem.answer);
        const newSlots: WordSlotData[] = words.map((_, idx) => ({
            index: idx,
            word: '',
            isFilled: false,
            status: 'none'
        }));

        const shuffledWords = shuffle(words);
        const newPool: WordBrickData[] = shuffledWords.map((word, idx) => ({
            id: `brick-${idx}-${word}`,
            word,
            isUsed: false
        }));

        setTimeout(() => {
            setSlots(newSlots);
            setWordPool(newPool);
            setIsRevealed(false);
            setIsComplete(false);
        }, 0);
    }, [currentItem, tokenize, shuffle]);

    // Auto-play question audio
    useEffect(() => {
        if (currentItem && !isRevealed) {
            const timer = setTimeout(() => {
                playAudio(currentItem.question, currentItem.lang?.source, currentItem.audioUrl);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [currentItem, isRevealed, playAudio]);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopAudio();
    }, [stopAudio]);

    // Handle clicking a word in the pool
    // Handle clicking a word in the pool
    const handleWordClick = useCallback((brickId: string) => {
        if (isComplete || isRevealed) return;
        if (!currentItem) return;

        const brick = wordPool.find(b => b.id === brickId);
        if (!brick || brick.isUsed) return;

        // Find first empty slot
        const emptySlotIdx = slots.findIndex(s => !s.isFilled);
        if (emptySlotIdx === -1) return;

        // Check if this word is correct for this position
        const correctWords = tokenize(currentItem.answer);
        const expectedWord = correctWords[emptySlotIdx];
        const isCorrect = brick.word === expectedWord;

        // Play immediate feedback sound
        if (isCorrect) {
            soundService.playClick();
            // Play the word audio in the target language (delayed to avoid conflict with click sound)
            setTimeout(() => {
                playAudio(brick.word, currentItem?.lang?.target);
            }, 10);
        } else {
            soundService.playWrong();
        }

        // Mark brick as used
        setWordPool(prev => prev.map(b =>
            b.id === brickId ? { ...b, isUsed: true } : b
        ));

        // Update slots
        const newSlots = slots.map((s, idx) =>
            idx === emptySlotIdx
                ? {
                    ...s,
                    word: brick.word,
                    isFilled: true,
                    sourceBrickId: brickId,
                    status: (isCorrect ? 'correct' : 'wrong') as 'correct' | 'wrong'
                }
                : s
        );

        setSlots(newSlots);

        // Check for completion immediately on the new state
        const allFilled = newSlots.every(s => s.isFilled);
        if (allFilled) {
            const allCorrect = newSlots.every(s => s.status === 'correct');
            if (allCorrect) {
                soundService.playCorrect();
                setIsComplete(true);
                submitAnswer(true);

                playAudio(currentItem.answer, currentItem.lang?.target, undefined).then(() => {
                    setTimeout(() => nextItem(), 1000);
                });
            } else {
                soundService.playWrong();
            }
        }
    }, [isComplete, isRevealed, wordPool, slots, currentItem, tokenize, playAudio, submitAnswer, nextItem]);

    // Handle clicking a filled slot to return word
    const handleSlotClick = useCallback((slotIndex: number) => {
        if (isComplete || isRevealed) return;

        const slot = slots[slotIndex];
        if (!slot.isFilled) return;

        soundService.playBackspace();

        // Return word to pool
        setWordPool(prev => prev.map(b =>
            b.id === slot.sourceBrickId ? { ...b, isUsed: false } : b
        ));

        // Clear slot
        setSlots(prev => prev.map((s, idx) =>
            idx === slotIndex
                ? { ...s, word: '', isFilled: false, status: 'none', sourceBrickId: undefined }
                : s
        ));
    }, [isComplete, isRevealed, slots]);

    // Check completion when all slots filled
    // Completion check moved to handleWordClick to avoid set-state-in-effect
    // Removed useEffect that was here

    // Handle give up
    const handleGiveUp = useCallback(() => {
        if (!currentItem) return;

        soundService.playWrong();
        submitAnswer(false);
        setIsRevealed(true);

        const correctWords = tokenize(currentItem.answer);
        setSlots(correctWords.map((word, idx) => ({
            index: idx,
            word,
            isFilled: true,
            status: 'revealed',
            sourceBrickId: undefined
        })));

        playAudio(currentItem.answer, currentItem.lang?.target, undefined);
    }, [currentItem, submitAnswer, tokenize, playAudio]);

    // Watch for Timeout
    useEffect(() => {
        if (config.timerEnabled && timeLeft === 0 && !isRevealed && !isComplete) {
            setTimeout(() => handleGiveUp(), 0);
        }
    }, [timeLeft, config.timerEnabled, isRevealed, isComplete, handleGiveUp]);

    // Handle proceeding to next after reveal
    const handleNext = useCallback(() => {
        nextItem();
    }, [nextItem]);

    return {
        currentItem,
        slots,
        wordPool,
        isRevealed,
        isComplete,
        handleWordClick,
        handleSlotClick,
        handleGiveUp,
        handleNext,
        playAudio
    };
}
