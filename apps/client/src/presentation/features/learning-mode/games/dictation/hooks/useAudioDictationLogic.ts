import { useState, useEffect, useCallback } from 'react';
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
    const [targetWords, setTargetWords] = useState<string[]>([]);

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
    useEffect(() => {
        if (!currentItem) return;

        // 1. Parse Answer (Same logic as BuildWord)
        const raw = currentItem.answer;
        const targets = raw.split(/[,;]+/)
            .map(s => {
                let clean = s.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s*\[.*?\]\s*/g, ' ').replace(/\s*\{.*?\}\s*/g, ' ').trim();
                if (clean.includes('/')) clean = clean.split('/')[0].trim();
                return clean;
            })
            .filter(s => s.length > 0);

        setTargetWords(targets);

        // 2. Initialize Builder
        initializeSlots(targets);
        initializePool(targets);

        // 3. Play Audio immediately
        // We need to wait for state update? No, hooks run sequentially in effect.
        // NOTE: playCurrentAudio depends on audioMode state, which might be stale if we just set it?
        // Actually we want to persist audioMode across rounds, so we don't reset it here.

        // We call play explicitly here
        if (audioMode === 'target') {
            playAudio(currentItem.answer, currentItem.lang?.target, undefined);
        } else {
            playAudio(currentItem.question, currentItem.lang?.source, currentItem.audioUrl);
        }

        return () => {
            stopAudio();
        };
    }, [currentItem, initializeSlots, initializePool, playAudio, stopAudio]); // Intentionally exclude playCurrentAudio/audioMode to avoid re-triggering loop

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
