import { useEffect, useCallback, useMemo } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useWordBuilder } from '../../hooks/useWordBuilder';

export const useBuildWordLogic = () => {
    const { items, currentIndex, submitAnswer, nextItem, isTimerPaused: globalTimerPaused, timeLeft, config } = useGameStore();
    const timerEnabled = config.timerEnabled;
    const { playAudio, stopAudio } = useGameAudio();
    const currentItem = items[currentIndex];

    // Local state for target parsing
    // Local state for target parsing
    const targetWords = useMemo(() => {
        if (!currentItem) return [];
        const raw = currentItem.answer;
        return raw.split(/[,;]+/)
            .map(s => {
                let clean = s.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s*\[.*?\]\s*/g, ' ').replace(/\s*\{.*?\}\s*/g, ' ').trim();
                if (clean.includes('/')) clean = clean.split('/')[0].trim();
                return clean;
            })
            .filter(s => s.length > 0);
    }, [currentItem]);

    // Handler when word is completed successfully
    const onWordComplete = useCallback((isCorrect: boolean) => {
        if (!currentItem) return;
        submitAnswer(isCorrect);
        playAudio(currentItem.answer, currentItem.lang?.target, undefined);
        setTimeout(() => nextItem(), 800);
    }, [currentItem, submitAnswer, playAudio, nextItem]);

    // Use the core builder logic
    const {
        slots,
        letterPool,
        focusedWordIndex,
        isComplete,
        isRevealed,
        setFocusedWordIndex,
        handleInput,
        handleSlotClick,
        initializeSlots,
        initializePool,
        revealAnswer
    } = useWordBuilder({
        targetWords,
        onComplete: onWordComplete,
        isTimerPaused: globalTimerPaused
    });

    // Initialization Logic
    // Initialization Logic
    useEffect(() => {
        if (targetWords.length === 0) return;

        // Initialize Builder
        initializeSlots(targetWords);
        initializePool(targetWords);
    }, [targetWords, initializeSlots, initializePool]);

    // Audio Logic
    useEffect(() => {
        if (!currentItem) return;

        // Debounce audio to prevent double-play on rapid re-renders
        const timer = setTimeout(() => {
            playAudio(currentItem.question, currentItem.lang?.source, currentItem.audioUrl);
        }, 100);

        return () => {
            clearTimeout(timer);
            stopAudio();
        };
    }, [currentItem, playAudio, stopAudio]);

    // Handle Give Up
    const handleGiveUp = useCallback(() => {
        if (isRevealed || isComplete) return;
        submitAnswer(false);
        revealAnswer();
        playAudio(currentItem.answer, currentItem.lang?.target, undefined);
    }, [isRevealed, isComplete, submitAnswer, revealAnswer, playAudio, currentItem]);

    // Watch for Timeout
    useEffect(() => {
        if (timerEnabled && timeLeft === 0 && !isRevealed && !isComplete) {
            handleGiveUp();
        }
    }, [timeLeft, timerEnabled, isRevealed, isComplete, handleGiveUp]);

    return {
        currentItem,
        slots,
        letterPool,
        focusedWordIndex,
        isRevealed,
        isComplete,
        setFocusedWordIndex,
        handleInput,
        handleSlotClick,
        handleGiveUp,
        nextItem,
        playAudio
    };
};

