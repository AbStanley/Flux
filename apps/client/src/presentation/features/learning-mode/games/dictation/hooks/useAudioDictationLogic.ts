import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGameStore } from '../../../store/useGameStore';
import { useGameAudio } from '../../hooks/useGameAudio';
import { useWordBuilder } from '../../hooks/useWordBuilder';

export type AudioMode = 'target' | 'source';

export const useAudioDictationLogic = () => {
    const { items, currentIndex, submitAnswer, nextItem, isTimerPaused: globalTimerPaused, timeLeft, config } = useGameStore();
    const timerEnabled = config.timerEnabled;
    const { playAudio, stopAudio } = useGameAudio();
    const currentItem = items[currentIndex];

    // Local State
    const [audioMode, setAudioMode] = useState<AudioMode>('target');
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
        // Always play target on completion
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

    const playCurrentAudio = useCallback(() => {
        if (!currentItem) return;
        if (audioMode === 'target') {
            // Dictation Mode: Target Language
            playAudio(currentItem.answer, currentItem.lang?.target, undefined);
        } else {
            // Translation Mode: Source Language (Question)
            playAudio(currentItem.question, currentItem.lang?.source, currentItem.audioUrl);
        }
    }, [currentItem, audioMode, playAudio]);

    // Initialization Logic
    // Initialization Logic
    useEffect(() => {
        if (targetWords.length === 0) return;

        // Initialize Builder
        initializeSlots(targetWords);
        initializePool(targetWords);

        // Play Audio immediately (Debounced)
        const timer = setTimeout(() => {
            if (audioMode === 'target') {
                playAudio(currentItem.answer, currentItem.lang?.target, undefined);
            } else {
                playAudio(currentItem.question, currentItem.lang?.source, currentItem.audioUrl);
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            stopAudio();
        };
    }, [targetWords, initializeSlots, initializePool, playAudio, stopAudio, audioMode, currentItem]); // Added missing deps

    // Handle Mode Toggle
    const toggleAudioMode = useCallback(() => {
        setAudioMode(prev => {
            const newMode = prev === 'target' ? 'source' : 'target';
            // Play new audio immediately
            if (!currentItem) return newMode;

            if (newMode === 'target') {
                playAudio(currentItem.answer, currentItem.lang?.target, undefined);
            } else {
                playAudio(currentItem.question, currentItem.lang?.source, currentItem.audioUrl);
            }
            return newMode;
        });
    }, [currentItem, playAudio]);

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
        audioMode,
        setFocusedWordIndex,
        handleInput,
        handleSlotClick,
        handleGiveUp,
        nextItem,
        playCurrentAudio,
        toggleAudioMode
    };
};
