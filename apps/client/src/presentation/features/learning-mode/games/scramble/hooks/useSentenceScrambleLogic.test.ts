import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSentenceScrambleLogic } from './useSentenceScrambleLogic';
import { useGameStore } from '../../../store/useGameStore';
import { useGameAudio } from '../../hooks/useGameAudio';
import { soundService } from '@/core/services/SoundService';

// Mocks
vi.mock('../../../store/useGameStore');
vi.mock('../../hooks/useGameAudio');
vi.mock('@/core/services/SoundService', () => ({
    soundService: {
        playClick: vi.fn(),
        playWrong: vi.fn(),
        playCorrect: vi.fn(),
        playBackspace: vi.fn()
    }
}));

describe('useSentenceScrambleLogic', () => {
    const mockSubmitAnswer = vi.fn();
    const mockNextItem = vi.fn();
    const mockPlayAudio = vi.fn().mockResolvedValue(undefined);
    const mockStopAudio = vi.fn();

    const createMockStore = (overrides = {}) => ({
        items: [{
            id: '1',
            answer: 'El gato',
            question: 'The cat',
            lang: { source: 'en', target: 'es' }
        }],
        currentIndex: 0,
        submitAnswer: mockSubmitAnswer,
        nextItem: mockNextItem,
        isTimerPaused: false,
        timeLeft: 100,
        config: { timerEnabled: true },
        ...overrides
    });

    beforeEach(() => {
        vi.clearAllMocks();
        (useGameStore as any).mockReturnValue(createMockStore());
        (useGameAudio as any).mockReturnValue({
            playAudio: mockPlayAudio,
            stopAudio: mockStopAudio
        });
    });

    it('should initialize slots and pool correctly', async () => {
        const { result } = renderHook(() => useSentenceScrambleLogic());

        await waitFor(() => {
            expect(result.current.slots.length).toBe(2); // El, gato
        });
        expect(result.current.wordPool.length).toBe(2);
        expect(result.current.wordPool.some(w => w.word === 'El')).toBe(true);
        expect(result.current.wordPool.some(w => w.word === 'gato')).toBe(true);
    });

    it('should place correct word and play click sound', async () => {
        const { result } = renderHook(() => useSentenceScrambleLogic());

        await waitFor(() => {
            expect(result.current.wordPool.length).toBe(2);
        });

        const elBrick = result.current.wordPool.find(w => w.word === 'El');

        act(() => {
            result.current.handleWordClick(elBrick!.id);
        });

        expect(result.current.slots[0].word).toBe('El');
        expect(result.current.slots[0].status).toBe('correct');
        expect(soundService.playClick).toHaveBeenCalled();
    });

    it('should place wrong word and play wrong sound', async () => {
        const { result } = renderHook(() => useSentenceScrambleLogic());

        await waitFor(() => {
            expect(result.current.wordPool.length).toBe(2);
        });

        const gatoBrick = result.current.wordPool.find(w => w.word === 'gato');

        // Try to place 'gato' in first slot (should be 'El')
        act(() => {
            result.current.handleWordClick(gatoBrick!.id);
        });

        expect(result.current.slots[0].word).toBe('gato');
        expect(result.current.slots[0].status).toBe('wrong');
        expect(soundService.playWrong).toHaveBeenCalled();
    });

    it('should play wrong sound when sentence is filled INCORRECTLY (Bug Fix Verification)', async () => {
        const { result } = renderHook(() => useSentenceScrambleLogic());

        await waitFor(() => {
            expect(result.current.wordPool.length).toBe(2);
        });

        // Target: El gato
        // Fill: gato El (Both wrong positions)

        const gatoBrick = result.current.wordPool.find(w => w.word === 'gato');
        const elBrick = result.current.wordPool.find(w => w.word === 'El');

        // Clear previous calls
        (soundService.playWrong as any).mockClear();

        act(() => {
            result.current.handleWordClick(gatoBrick!.id);
        });
        // 1st wrong placement sound
        expect(soundService.playWrong).toHaveBeenCalledTimes(1);

        act(() => {
            result.current.handleWordClick(elBrick!.id);
        });

        // Expect TWO more calls:
        // 1. Wrong placement of 'El' in 2nd slot (wait, 'El' is correct for 2nd slot? No, target is 'El gato'. 2nd slot is 'gato'. 'El' is wrong there too)

        // Wait, 'El gato'. Slot 0: El. Slot 1: gato.
        // We put 'gato' in Slot 0 -> Wrong.
        // We put 'El' in Slot 1 -> Wrong.

        // So placement 2 is also wrong. -> playWrong() called. Total 2.
        // Effect runs -> allFilled=true. allCorrect=false (both wrong). -> playWrong() called again. Total 3.

        // Verify we have at least 2 calls (one for placement, one for completion check)
        expect(soundService.playWrong).toHaveBeenCalledTimes(3);
    });

    it('should complete level when filled correctly', async () => {
        const { result } = renderHook(() => useSentenceScrambleLogic());

        await waitFor(() => {
            expect(result.current.wordPool.length).toBe(2);
        });

        const elBrick = result.current.wordPool.find(w => w.word === 'El');
        const gatoBrick = result.current.wordPool.find(w => w.word === 'gato');

        act(() => { result.current.handleWordClick(elBrick!.id); });
        act(() => { result.current.handleWordClick(gatoBrick!.id); });

        expect(result.current.isComplete).toBe(true);
        expect(mockSubmitAnswer).toHaveBeenCalledWith(true);
        expect(soundService.playCorrect).toHaveBeenCalled();
    });

    it('should reveal answer and fail round when timer runs out', async () => {
        const { result, rerender } = renderHook(() => useSentenceScrambleLogic());

        await waitFor(() => {
            expect(result.current.slots.length).toBe(2);
        });

        // Initial state: not revealed, correct
        expect(result.current.isRevealed).toBe(false);

        // Simulate timeout
        (useGameStore as any).mockReturnValue({
            ...(useGameStore as any)(),
            timeLeft: 0,
            config: { timerEnabled: true }
        });

        rerender();

        await waitFor(() => {
            expect(result.current.isRevealed).toBe(true);
        });
        expect(mockSubmitAnswer).toHaveBeenCalledWith(false);
        expect(soundService.playWrong).toHaveBeenCalled();
    });
});
