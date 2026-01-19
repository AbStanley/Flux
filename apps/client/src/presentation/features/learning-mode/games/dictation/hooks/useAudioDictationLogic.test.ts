import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAudioDictationLogic } from './useAudioDictationLogic';
import { useGameStore } from '../../../store/useGameStore';
import { useGameAudio } from '../../hooks/useGameAudio';

// Mock dependencies
vi.mock('../../../store/useGameStore');
vi.mock('../../hooks/useGameAudio');

describe('useAudioDictationLogic', () => {
    // Setup Mocks
    const mockSubmitAnswer = vi.fn();
    const mockNextItem = vi.fn();
    const mockPlayAudio = vi.fn();
    const mockStopAudio = vi.fn();

    const mockItem = {
        id: '1',
        answer: 'TargetWord',
        question: 'SourceWord',
        lang: { source: 'es', target: 'en' },
        type: 'word',
        audioUrl: 'http://example.com/audio.mp3'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Mock Store
        (useGameStore as any).mockReturnValue({
            items: [mockItem],
            currentIndex: 0,
            submitAnswer: mockSubmitAnswer,
            nextItem: mockNextItem,
            isTimerPaused: false,
            timeLeft: 30,
            config: { timerEnabled: true }
        });

        // Mock Audio
        (useGameAudio as any).mockReturnValue({
            playAudio: mockPlayAudio,
            stopAudio: mockStopAudio
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize and play target audio by default', () => {
        const { result } = renderHook(() => useAudioDictationLogic());

        // Default mode is target (dictation)
        expect(result.current.audioMode).toBe('target');

        act(() => {
            vi.advanceTimersByTime(200);
        });

        // Should play target audio (answer + target lang)
        expect(mockPlayAudio).toHaveBeenCalledWith(mockItem.answer, mockItem.lang.target, undefined);
    });

    it('should switch to translation mode and play source audio', () => {
        const { result } = renderHook(() => useAudioDictationLogic());

        mockPlayAudio.mockClear();

        act(() => {
            result.current.toggleAudioMode();
        });

        expect(result.current.audioMode).toBe('source');

        // Should play source audio (question + source lang + url)
        expect(mockPlayAudio).toHaveBeenCalledWith(mockItem.question, mockItem.lang.source, mockItem.audioUrl);
    });

    it('should play correct audio when playCurrentAudio is called', () => {
        const { result } = renderHook(() => useAudioDictationLogic());

        // 1. Target Mode
        mockPlayAudio.mockClear();
        act(() => result.current.playCurrentAudio());
        expect(mockPlayAudio).toHaveBeenCalledWith(mockItem.answer, mockItem.lang.target, undefined);

        // 2. Source Mode
        act(() => result.current.toggleAudioMode());
        mockPlayAudio.mockClear();

        act(() => result.current.playCurrentAudio());
        expect(mockPlayAudio).toHaveBeenCalledWith(mockItem.question, mockItem.lang.source, mockItem.audioUrl);
    });
});
