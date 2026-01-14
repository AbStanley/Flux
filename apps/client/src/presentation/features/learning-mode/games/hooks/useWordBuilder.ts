import { useState, useCallback, useEffect } from 'react';
import { soundService } from '@/core/services/SoundService';
import type { SlotData, LetterParams } from '../types';

interface UseWordBuilderProps {
    targetWords: string[];
    onComplete: (isCorrect: boolean) => void;
    isTimerPaused?: boolean;
}

export const useWordBuilder = ({ targetWords, onComplete, isTimerPaused = false }: UseWordBuilderProps) => {
    const [slots, setSlots] = useState<SlotData[][]>([]);
    const [letterPool, setLetterPool] = useState<LetterParams[]>([]);
    const [focusedWordIndex, setFocusedWordIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);

    // Initialize Slots
    const initializeSlots = useCallback((targets: string[]) => {
        const newSlots = targets.map((word) => {
            return word.split('').map(char => {
                const isStatic = !/[\p{L}\p{N}]/u.test(char);
                return {
                    char: isStatic ? char : '',
                    isFilled: isStatic,
                    isStatic,
                    status: 'none' as const
                };
            });
        });
        setSlots(newSlots);
        setFocusedWordIndex(0);
        setIsComplete(false);
        setIsRevealed(false);
    }, []);

    // Initialize Pool
    const initializePool = useCallback((targets: string[]) => {
        const combinedChars = targets.join('').split('').filter(c => /[\p{L}\p{N}]/u.test(c));
        const neededCount = combinedChars.length;
        const distractorCount = Math.max(3, Math.floor(neededCount * 0.4));

        const alphabet = "abcdefghijklmnopqrstuvwxyz";
        const extras: string[] = [];
        for (let i = 0; i < distractorCount; i++) {
            extras.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
        }

        const pool = [...combinedChars, ...extras].sort(() => 0.5 - Math.random()).map((char, idx) => ({
            id: `btn-${idx}-${char}`,
            char,
            isUsed: false
        }));
        setLetterPool(pool);
    }, []);

    const checkCompletion = useCallback((currentSlots: SlotData[][]) => {
        const allFilled = currentSlots.every(row => row.every(s => s.isFilled));
        if (!allFilled) return;

        const allCorrect = currentSlots.every(row => row.every(s => s.isStatic || s.status === 'correct'));

        if (allCorrect) {
            setIsComplete(true);
            soundService.playCorrect();
            onComplete(true);
        }
    }, [onComplete]);

    const handleInput = useCallback((char: string, btnId?: string) => {
        if (isComplete || isTimerPaused || isRevealed) return;

        // Safety check if slots are not ready
        if (slots.length === 0 || !slots[focusedWordIndex]) return;

        const currentWordSlots = slots[focusedWordIndex];
        const nextEmptyIdx = currentWordSlots.findIndex(s => !s.isFilled);

        if (nextEmptyIdx === -1) {
            soundService.playWrong();
            return;
        }

        const targetChar = targetWords[focusedWordIndex][nextEmptyIdx];
        const isCorrectChar = char.toLowerCase() === targetChar.toLowerCase();

        let actualBtnId = btnId;
        if (!actualBtnId) {
            const match = letterPool.find(p => p.char.toLowerCase() === char.toLowerCase() && !p.isUsed);
            if (match) actualBtnId = match.id;
        }

        if (!actualBtnId) {
            soundService.playWrong();
            return;
        }

        if (isCorrectChar) {
            soundService.playClick();
        } else {
            soundService.playWrong();
        }

        const newSlots = [...slots];
        newSlots[focusedWordIndex][nextEmptyIdx] = {
            ...newSlots[focusedWordIndex][nextEmptyIdx],
            char: char,
            isFilled: true,
            sourceBtnId: actualBtnId,
            status: isCorrectChar ? 'correct' : 'wrong'
        };
        setSlots(newSlots);
        setLetterPool(prev => prev.map(p => p.id === actualBtnId ? { ...p, isUsed: true } : p));
        checkCompletion(newSlots);
    }, [slots, focusedWordIndex, letterPool, isComplete, isTimerPaused, isRevealed, targetWords, checkCompletion]);

    const handleBackspace = useCallback(() => {
        if (isComplete || isTimerPaused || isRevealed) return;
        if (slots.length === 0) return;

        const currentWordSlots = [...slots[focusedWordIndex]];
        let foundIdx = -1;
        for (let i = currentWordSlots.length - 1; i >= 0; i--) {
            if (currentWordSlots[i].isFilled && !currentWordSlots[i].isStatic) {
                foundIdx = i;
                break;
            }
        }

        if (foundIdx === -1) {
            if (focusedWordIndex > 0) {
                setFocusedWordIndex(focusedWordIndex - 1);
            }
            return;
        }

        const slot = currentWordSlots[foundIdx];
        const newSlots = [...slots];
        newSlots[focusedWordIndex][foundIdx] = {
            ...slot,
            char: '',
            isFilled: false,
            sourceBtnId: undefined,
            status: 'none'
        };
        setSlots(newSlots);

        if (slot.sourceBtnId) {
            setLetterPool(prev => prev.map(p => p.id === slot.sourceBtnId ? { ...p, isUsed: false } : p));
        }
        soundService.playBackspace();
    }, [slots, focusedWordIndex, isComplete, isTimerPaused, isRevealed]);

    const handleSlotClick = useCallback((wordIdx: number, slotIdx: number) => {
        if (isComplete || isTimerPaused || isRevealed) return;

        const slot = slots[wordIdx][slotIdx];
        if (slot.isStatic || !slot.isFilled) {
            if (wordIdx !== focusedWordIndex) setFocusedWordIndex(wordIdx);
            return;
        }

        const newSlots = [...slots];
        newSlots[wordIdx][slotIdx] = {
            ...slot,
            char: '',
            isFilled: false,
            sourceBtnId: undefined,
            status: 'none'
        };
        setSlots(newSlots);

        if (slot.sourceBtnId) {
            setLetterPool(prev => prev.map(p => p.id === slot.sourceBtnId ? { ...p, isUsed: false } : p));
        }
        if (wordIdx !== focusedWordIndex) setFocusedWordIndex(wordIdx);
        soundService.playBackspace();
    }, [slots, focusedWordIndex, isComplete, isTimerPaused, isRevealed]);

    const revealAnswer = useCallback(() => {
        if (isRevealed || isComplete) return;

        setIsRevealed(true);
        // We only play wrong sound if it wasn't a correct completion (which is handled by checkCompletion)
        // But typically reveal is called on give up or timeout
        soundService.playWrong();

        setSlots(prev => prev.map((row, wIdx) => {
            return row.map((slot, sIdx) => {
                const targetChar = targetWords[wIdx][sIdx];
                return {
                    ...slot,
                    char: targetChar,
                    isFilled: true,
                    status: slot.status === 'correct' ? 'correct' : 'revealed'
                };
            });
        }));
    }, [isRevealed, isComplete, targetWords]);

    // Keyboard Support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Backspace') {
                handleBackspace();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                setFocusedWordIndex(prev => (prev + 1) % slots.length);
            } else if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
                handleInput(e.key);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleBackspace, handleInput, slots.length]);

    // Auto-initialize when targetWords changes
    useEffect(() => {
        if (targetWords && targetWords.length > 0) {
            initializeSlots(targetWords);
            initializePool(targetWords);
        }
    }, [targetWords, initializeSlots, initializePool]);

    return {
        slots,
        letterPool,
        focusedWordIndex,
        isComplete,
        isRevealed,
        setFocusedWordIndex,
        handleInput,
        handleSlotClick,
        handleBackspace, // Exported if needed by UI
        initializeSlots,
        initializePool,
        revealAnswer
    };
};
