import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SentenceScrambleGame } from './SentenceScrambleGame';
import { useSentenceScrambleLogic } from './hooks/useSentenceScrambleLogic';
import * as ServiceContextModule from '../../../../contexts/ServiceContext';

// Mock the custom hook
vi.mock('./hooks/useSentenceScrambleLogic');

// Mock the game store
vi.mock('../../store/useGameStore', () => ({
    useGameStore: vi.fn(() => ({
        updateConfig: vi.fn()
    }))
}));

// Mock the ServiceContext
const mockUseServices = vi.fn();
vi.spyOn(ServiceContextModule, 'useServices').mockImplementation(() => mockUseServices());

describe('SentenceScrambleGame', () => {
    const mockHandleWordClick = vi.fn();
    const mockHandleSlotClick = vi.fn();
    const mockHandleGiveUp = vi.fn();
    const mockHandleNext = vi.fn();
    const mockPlayAudio = vi.fn();

    const createMockLogic = (overrides = {}) => ({
        currentItem: {
            id: '1',
            question: 'El gato está en la casa',
            answer: 'The cat is in the house',
            lang: { source: 'es', target: 'en' },
            audioUrl: undefined
        },
        slots: [
            { index: 0, word: 'The', isFilled: true, status: 'none' },
            { index: 1, word: '', isFilled: false, status: 'none' },
            { index: 2, word: '', isFilled: false, status: 'none' },
            { index: 3, word: '', isFilled: false, status: 'none' },
            { index: 4, word: '', isFilled: false, status: 'none' },
            { index: 5, word: '', isFilled: false, status: 'none' }
        ],
        wordPool: [
            { id: 'brick-0', word: 'house', isUsed: false },
            { id: 'brick-1', word: 'cat', isUsed: false },
            { id: 'brick-2', word: 'The', isUsed: true },
            { id: 'brick-3', word: 'is', isUsed: false },
            { id: 'brick-4', word: 'in', isUsed: false },
            { id: 'brick-5', word: 'the', isUsed: false }
        ],
        isRevealed: false,
        isComplete: false,
        handleWordClick: mockHandleWordClick,
        handleSlotClick: mockHandleSlotClick,
        handleGiveUp: mockHandleGiveUp,
        handleNext: mockHandleNext,
        playAudio: mockPlayAudio,
        config: { scrambleManualNext: false },
        ...overrides
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseServices.mockReturnValue({
            aiService: {
                translateText: vi.fn().mockResolvedValue('gato')
            }
        });
        (useSentenceScrambleLogic as any).mockReturnValue(createMockLogic());
    });

    it('should render question prompt', () => {
        render(<SentenceScrambleGame />);
        expect(screen.getByText('El gato está en la casa')).toBeDefined();
    });

    it('should render word pool buttons', () => {
        render(<SentenceScrambleGame />);
        expect(screen.getByText('house')).toBeDefined();
        expect(screen.getByText('cat')).toBeDefined();
        expect(screen.getByText('is')).toBeDefined();
    });

    it('should render Replay button', () => {
        render(<SentenceScrambleGame />);
        expect(screen.getByText('Replay')).toBeDefined();
    });

    it('should call playAudio when Replay clicked', () => {
        render(<SentenceScrambleGame />);
        const replayBtn = screen.getByText('Replay');
        fireEvent.click(replayBtn);
        expect(mockPlayAudio).toHaveBeenCalledWith('El gato está en la casa', 'es', undefined);
    });

    it('should call handleWordClick when word button clicked', () => {
        render(<SentenceScrambleGame />);
        const wordBtn = screen.getByText('cat');
        fireEvent.click(wordBtn);
        expect(mockHandleWordClick).toHaveBeenCalledWith('brick-1');
    });

    it('should render Give Up button when not revealed', () => {
        render(<SentenceScrambleGame />);
        expect(screen.getByText('Give Up')).toBeDefined();
    });

    it('should call handleGiveUp when Give Up clicked', () => {
        render(<SentenceScrambleGame />);
        const giveUpBtn = screen.getByText('Give Up');
        fireEvent.click(giveUpBtn);
        expect(mockHandleGiveUp).toHaveBeenCalled();
    });

    it('should render Next Sentence button when revealed', () => {
        (useSentenceScrambleLogic as any).mockReturnValue(createMockLogic({ isRevealed: true }));
        render(<SentenceScrambleGame />);
        expect(screen.getByText(/Next Sentence/)).toBeDefined();
    });

    it('should call handleNext when Next Sentence clicked', () => {
        (useSentenceScrambleLogic as any).mockReturnValue(createMockLogic({ isRevealed: true }));
        render(<SentenceScrambleGame />);
        const nextBtn = screen.getByText(/Next Sentence/);
        fireEvent.click(nextBtn);
        expect(mockHandleNext).toHaveBeenCalled();
    });

    it('should return null if no currentItem', () => {
        (useSentenceScrambleLogic as any).mockReturnValue(createMockLogic({ currentItem: null }));
        const { container } = render(<SentenceScrambleGame />);
        expect(container.firstChild).toBeNull();
    });

    it('should disable used word buttons', () => {
        render(<SentenceScrambleGame />);
        // 'The' is used (isUsed: true at brick-2)
        const usedBtns = screen.getAllByText('The');
        // Find the button (not the slot)
        const usedBtn = usedBtns.find(el => el.tagName === 'BUTTON');
        expect(usedBtn).toHaveProperty('disabled', true);
    });

    it('should show Correct message when isComplete', () => {
        (useSentenceScrambleLogic as any).mockReturnValue(createMockLogic({ isComplete: true }));
        render(<SentenceScrambleGame />);
        expect(screen.getByText(/Correct/)).toBeDefined();
    });
});
