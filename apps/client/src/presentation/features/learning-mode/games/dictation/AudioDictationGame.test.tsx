import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioDictationGame } from './AudioDictationGame';
import { useAudioDictationLogic } from './hooks/useAudioDictationLogic';

// Mock the custom hook
vi.mock('./hooks/useAudioDictationLogic');

describe('AudioDictationGame', () => {
    const mockSetFocusedWordIndex = vi.fn();
    const mockHandleInput = vi.fn();
    const mockHandleSlotClick = vi.fn();
    const mockHandleGiveUp = vi.fn();
    const mockNextItem = vi.fn();
    const mockPlayCurrentAudio = vi.fn();
    const mockToggleAudioMode = vi.fn();

    const createMockLogic = (overrides = {}) => ({
        currentItem: {
            id: '1',
            question: 'Gato',
            answer: 'Cat',
            lang: { source: 'es', target: 'en' },
            audioUrl: undefined
        },
        slots: [
            [
                { char: '', isFilled: false, isStatic: false, status: 'none' },
                { char: '', isFilled: false, isStatic: false, status: 'none' },
                { char: '', isFilled: false, isStatic: false, status: 'none' }
            ]
        ],
        letterPool: [
            { id: 'btn-0', char: 'c', isUsed: false },
            { id: 'btn-1', char: 'a', isUsed: false },
            { id: 'btn-2', char: 't', isUsed: false }
        ],
        focusedWordIndex: 0,
        isRevealed: false,
        isComplete: false,
        audioMode: 'target',
        setFocusedWordIndex: mockSetFocusedWordIndex,
        handleInput: mockHandleInput,
        handleSlotClick: mockHandleSlotClick,
        handleGiveUp: mockHandleGiveUp,
        nextItem: mockNextItem,
        playCurrentAudio: mockPlayCurrentAudio,
        toggleAudioMode: mockToggleAudioMode,
        ...overrides
    });

    beforeEach(() => {
        vi.clearAllMocks();
        (useAudioDictationLogic as any).mockReturnValue(createMockLogic());
    });

    it('should render mode description', () => {
        render(<AudioDictationGame />);
        expect(screen.getByText('Listen and write what you hear')).toBeDefined();
    });

    it('should toggle mode text when mode changes', () => {
        (useAudioDictationLogic as any).mockReturnValue(createMockLogic({ audioMode: 'source' }));
        render(<AudioDictationGame />);
        expect(screen.getByText('Listen to the source and translate')).toBeDefined();
    });

    it('should call playCurrentAudio when audio button is clicked', () => {
        render(<AudioDictationGame />);
        // Find big volume button. Since we use Lucide icons, we can find by role button or just the first button
        // Logic: The first button in the audio area
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]); // Audio button
        expect(mockPlayCurrentAudio).toHaveBeenCalled();
    });

    it('should call toggleAudioMode when switch button is clicked', () => {
        render(<AudioDictationGame />);
        const switchBtn = screen.getByText(/Switch Mode:/);
        fireEvent.click(switchBtn);
        expect(mockToggleAudioMode).toHaveBeenCalled();
    });

    it('should render letter pool buttons', () => {
        render(<AudioDictationGame />);
        expect(screen.getByText('c')).toBeDefined();
        expect(screen.getByText('a')).toBeDefined();
        expect(screen.getByText('t')).toBeDefined();
    });
});
