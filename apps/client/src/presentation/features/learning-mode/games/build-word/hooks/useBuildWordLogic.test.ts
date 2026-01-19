import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBuildWordLogic } from './useBuildWordLogic';
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

describe('useBuildWordLogic', () => {
    const mockSubmitAnswer = vi.fn();
    const mockNextItem = vi.fn();
    const mockPlayAudio = vi.fn().mockResolvedValue(undefined);
    const mockStopAudio = vi.fn();

    const createMockStore = (overrides = {}) => ({
        items: [{
            id: '1',
            answer: 'Cat',
            question: 'Gato',
            lang: { source: 'es', target: 'en' }
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
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Initialization', () => {
        it('should initialize slots correctly for single word', () => {
            const { result } = renderHook(() => useBuildWordLogic());

            expect(result.current.slots.length).toBe(1);
            expect(result.current.slots[0].length).toBe(3); // C-a-t
            expect(result.current.currentItem).toEqual(expect.objectContaining({
                id: '1',
                answer: 'Cat'
            }));
        });

        it('should generate letter pool with distractors', () => {
            const { result } = renderHook(() => useBuildWordLogic());

            // Pool should have Cat letters + at least 3 distractors
            expect(result.current.letterPool.length).toBeGreaterThanOrEqual(6);
        });

        it('should play audio on initialization', () => {
            renderHook(() => useBuildWordLogic());
            act(() => {
                vi.advanceTimersByTime(200);
            });
            expect(mockPlayAudio).toHaveBeenCalledWith('Gato', 'es', undefined);
        });

        it('should handle multi-word answers (comma separated)', () => {
            (useGameStore as any).mockReturnValue(createMockStore({
                items: [{ id: '1', answer: 'Cat, Dog', question: 'Test' }]
            }));

            const { result } = renderHook(() => useBuildWordLogic());
            expect(result.current.slots.length).toBe(2); // Two words
        });

        it('should handle punctuation as static slots', () => {
            (useGameStore as any).mockReturnValue(createMockStore({
                items: [{ id: '1', answer: "It's", question: 'Test' }]
            }));

            const { result } = renderHook(() => useBuildWordLogic());
            const apostropheSlot = result.current.slots[0].find(s => s.char === "'");
            expect(apostropheSlot?.isStatic).toBe(true);
        });
    });

    describe('Input Handling', () => {
        it('should fill slot with correct character', () => {
            const { result } = renderHook(() => useBuildWordLogic());

            const cBtn = result.current.letterPool.find(p => p.char.toLowerCase() === 'c');

            act(() => {
                result.current.handleInput('c', cBtn?.id);
            });

            expect(result.current.slots[0][0].char).toBe('c');
            expect(result.current.slots[0][0].status).toBe('correct');
            expect(soundService.playClick).toHaveBeenCalled();
        });

        it('should mark wrong character with wrong status', () => {
            const { result } = renderHook(() => useBuildWordLogic());

            // Find any letter that's not 'c' (first expected letter)
            const wrongBtn = result.current.letterPool.find(p =>
                p.char.toLowerCase() !== 'c' && !p.isUsed
            );

            act(() => {
                result.current.handleInput(wrongBtn!.char, wrongBtn!.id);
            });

            expect(result.current.slots[0][0].status).toBe('wrong');
            expect(soundService.playWrong).toHaveBeenCalled();
        });

        it('should mark letter as used after input', () => {
            const { result } = renderHook(() => useBuildWordLogic());

            const cBtn = result.current.letterPool.find(p => p.char.toLowerCase() === 'c');
            const btnId = cBtn?.id;

            act(() => {
                result.current.handleInput('c', btnId);
            });

            const usedBtn = result.current.letterPool.find(p => p.id === btnId);
            expect(usedBtn?.isUsed).toBe(true);
        });
    });

    describe('Completion', () => {
        it('should submit correct answer when all slots filled correctly', () => {
            const { result } = renderHook(() => useBuildWordLogic());

            // Fill C-a-t correctly
            act(() => {
                const c = result.current.letterPool.find(p => p.char.toLowerCase() === 'c');
                result.current.handleInput('c', c?.id);
            });
            act(() => {
                const a = result.current.letterPool.find(p => p.char.toLowerCase() === 'a' && !p.isUsed);
                result.current.handleInput('a', a?.id);
            });
            act(() => {
                const t = result.current.letterPool.find(p => p.char.toLowerCase() === 't' && !p.isUsed);
                result.current.handleInput('t', t?.id);
            });

            expect(result.current.isComplete).toBe(true);
            expect(mockSubmitAnswer).toHaveBeenCalledWith(true);
            expect(soundService.playCorrect).toHaveBeenCalled();
        });
    });

    describe('Give Up / Reveal', () => {
        it('should reveal answer and mark as wrong on give up', () => {
            const { result } = renderHook(() => useBuildWordLogic());

            act(() => {
                result.current.handleGiveUp();
            });

            expect(result.current.isRevealed).toBe(true);
            expect(mockSubmitAnswer).toHaveBeenCalledWith(false);
            expect(soundService.playWrong).toHaveBeenCalled();
        });

        it('should fill all slots with correct answer on reveal', () => {
            const { result } = renderHook(() => useBuildWordLogic());

            act(() => {
                result.current.handleGiveUp();
            });

            // All slots should be filled with 'Cat'
            expect(result.current.slots[0][0].char).toBe('C');
            expect(result.current.slots[0][1].char).toBe('a');
            expect(result.current.slots[0][2].char).toBe('t');
        });
    });

    describe('Timer / Timeout Bug Fix', () => {
        it('should auto-reveal when timeout is triggered', async () => {
            // Start with normal time
            const { result, rerender } = renderHook(() => useBuildWordLogic());

            expect(result.current.isRevealed).toBe(false);

            // Simulate timeout by updating mock to timeLeft=0
            (useGameStore as any).mockReturnValue(createMockStore({ timeLeft: 0 }));
            rerender();

            // The effect watching timeLeft=0 should trigger reveal
            expect(result.current.isRevealed).toBe(true);
        });

        it('should not reveal if timer disabled', () => {
            (useGameStore as any).mockReturnValue(createMockStore({
                timeLeft: 0,
                config: { timerEnabled: false }
            }));

            const { result } = renderHook(() => useBuildWordLogic());

            expect(result.current.isRevealed).toBe(false);
        });
    });

    describe('Cleanup', () => {
        it('should stop audio on unmount', () => {
            const { unmount } = renderHook(() => useBuildWordLogic());
            unmount();
            expect(mockStopAudio).toHaveBeenCalled();
        });
    });
});
