import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MultipleChoiceGame } from './MultipleChoiceGame';
import { useGameStore } from '../store/useGameStore';
import { useGameAudio } from './hooks/useGameAudio';
import { soundService } from '@/core/services/SoundService';

// Mocks
vi.mock('../store/useGameStore');
vi.mock('./hooks/useGameAudio');
vi.mock('@/core/services/SoundService', () => ({
    soundService: {
        playClick: vi.fn(),
        playWrong: vi.fn(),
        playCorrect: vi.fn(),
        playBackspace: vi.fn()
    }
}));

describe('MultipleChoiceGame', () => {
    const mockSubmitAnswer = vi.fn();
    const mockNextItem = vi.fn();
    const mockPlayAudio = vi.fn().mockResolvedValue(undefined);
    const mockStopAudio = vi.fn();

    const createMockStore = (overrides = {}) => ({
        items: [
            { id: '1', question: 'Hello', answer: 'Hola', lang: { source: 'en', target: 'es' } },
            { id: '2', question: 'Goodbye', answer: 'Adios', lang: { source: 'en', target: 'es' } },
            { id: '3', question: 'Thanks', answer: 'Gracias', lang: { source: 'en', target: 'es' } },
            { id: '4', question: 'Please', answer: 'Por favor', lang: { source: 'en', target: 'es' } }
        ],
        currentIndex: 0,
        submitAnswer: mockSubmitAnswer,
        nextItem: mockNextItem,
        timeLeft: 100,
        config: { timerEnabled: true },
        ...overrides
    });

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        (useGameStore as any).mockReturnValue(createMockStore());
        (useGameAudio as any).mockReturnValue({
            playAudio: mockPlayAudio,
            stopAudio: mockStopAudio
        });
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('should render question and options', () => {
        render(<MultipleChoiceGame />);
        expect(screen.getByText('Hello')).toBeDefined();
        // Options are generated from items, includes correct answer 'Hola'
        expect(screen.getByText('Hola')).toBeDefined();
    });

    it('should show error message if less than 4 items', () => {
        (useGameStore as any).mockReturnValue(createMockStore({
            items: [{ id: '1', question: 'Hello', answer: 'Hola' }]
        }));
        render(<MultipleChoiceGame />);
        expect(screen.getByText('Not Enough Vocabulary')).toBeDefined();
    });

    it('should play audio on mount (after delay)', async () => {
        render(<MultipleChoiceGame />);

        // Run all timers (including the 500ms delay for audio)
        await vi.runAllTimersAsync();

        expect(mockPlayAudio).toHaveBeenCalledWith('Hello', 'en', undefined);
    });

    it('should stop audio on unmount (Exit Safety Bug Fix)', () => {
        const { unmount } = render(<MultipleChoiceGame />);
        unmount();
        expect(mockStopAudio).toHaveBeenCalled();
    });

    it('should handle correct option selection', async () => {
        render(<MultipleChoiceGame />);

        const correctBtn = screen.getByText('Hola');
        fireEvent.click(correctBtn);

        expect(mockSubmitAnswer).toHaveBeenCalledWith(true);
        expect(soundService.playCorrect).toHaveBeenCalled();
    });

    it('should handle wrong option selection', async () => {
        render(<MultipleChoiceGame />);

        // Find a wrong answer (not 'Hola')
        const wrongBtn = screen.getByText('Adios');
        fireEvent.click(wrongBtn);

        expect(mockSubmitAnswer).toHaveBeenCalledWith(false);
        expect(soundService.playWrong).toHaveBeenCalled();
    });

    it('should call nextItem after selection delay', async () => {
        render(<MultipleChoiceGame />);

        const correctBtn = screen.getByText('Hola');
        await fireEvent.click(correctBtn);

        // Wait for the playAudio promise to resolve and timer to fire
        await vi.runAllTimersAsync();

        expect(mockNextItem).toHaveBeenCalled();
    });

    it('should disable options after selection (prevent double-click)', () => {
        render(<MultipleChoiceGame />);

        const correctBtn = screen.getByText('Hola');
        fireEvent.click(correctBtn);

        // Try clicking again
        fireEvent.click(correctBtn);

        // submitAnswer should only be called once
        expect(mockSubmitAnswer).toHaveBeenCalledTimes(1);
    });

    it('should handle timeout (timer reaches 0)', async () => {
        (useGameStore as any).mockReturnValue(createMockStore({ timeLeft: 0 }));

        render(<MultipleChoiceGame />);

        expect(soundService.playWrong).toHaveBeenCalled();
    });
});
