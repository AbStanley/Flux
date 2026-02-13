import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { YouTubeSubtitleOverlay } from './YouTubeSubtitleOverlay';
import * as UseAIHandler from '../hooks/useAIHandler';
import { wordsApi } from '../../infrastructure/api/words';

// Mock child components
vi.mock('../../infrastructure/api/words', () => ({
    wordsApi: {
        create: vi.fn().mockResolvedValue({})
    }
}));

vi.mock('@/lib/chrome-storage', () => ({
    chromeStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
    }
}));

vi.mock('./FluxMinimalPopup', () => ({
    FluxMinimalPopup: ({ isSaved }: any) => <div data-testid="flux-popup-minimal" data-is-saved={isSaved}>Popup</div>
}));

vi.mock('./SubtitleToken', () => ({
    SubtitleToken: ({ token, onMouseEnter, onMouseLeave, onClick }: any) => (
        <span
            data-testid="token"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
        >
            {token}
        </span>
    )
}));

// Mock hooks
vi.mock('../hooks/useDraggable', () => ({
    useDraggable: () => ({ pos: { x: 0, y: 0 }, isDragging: false, handleMouseDown: vi.fn() })
}));

vi.mock('../hooks/useResizable', () => ({
    useResizable: () => ({ size: { width: 800, height: 160 }, handleResizeMouseDown: vi.fn() })
}));

// Mock store
vi.mock('@/presentation/features/reader/store/useReaderStore', () => ({
    useReaderStore: () => ({ selectionMode: 'WORD' })
}));

describe('YouTubeSubtitleOverlay', () => {
    const handleFullActionMock = vi.fn();
    const setFullResultMock = vi.fn();

    const defaultAIHandlerMock = {
        result: '',
        loading: false,
        error: null,
        handleAction: handleFullActionMock,
        setResult: setFullResultMock,
    };

    beforeEach(() => {
        vi.resetAllMocks();
        vi.useRealTimers();

        // Use persistent mock return value to handle multiple renders
        vi.spyOn(UseAIHandler, 'useAIHandler').mockReturnValue(defaultAIHandlerMock as any);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const defaultProps = {
        cue: { text: "Hello world", start: 0, duration: 1 },
        onHover: vi.fn(),
        targetLang: "Spanish",
        onTargetLangChange: vi.fn(),
        sourceLang: "English",
        onSourceLangChange: vi.fn(),
        autoSave: false,
        onAutoSaveChange: vi.fn(),
        hasPrev: true,
        hasNext: true,
        fluxEnabled: true,
        onPopupStateChange: vi.fn(),
        onPrev: vi.fn(),
        onNext: vi.fn()
    };

    it('renders tokens', () => {
        render(<YouTubeSubtitleOverlay {...defaultProps} />);
        expect(screen.getAllByTestId('token')).toHaveLength(3); // "Hello", " ", "world"
    });

    it('does NOT trigger translation on mount (requires hover)', () => {
        render(<YouTubeSubtitleOverlay {...defaultProps} />);
        expect(handleFullActionMock).not.toHaveBeenCalled();
    });

    it('triggers translation on overlay mouse enter', () => {
        const { container } = render(<YouTubeSubtitleOverlay {...defaultProps} />);
        const overlay = container.querySelector('.flux-youtube-overlay');

        expect(overlay).toBeTruthy();

        // Hover
        fireEvent.mouseEnter(overlay!);

        expect(handleFullActionMock).toHaveBeenCalledWith("Hello world", 'TRANSLATE', "Spanish", "English", 'YouTube Subtitle');

        // Also verify onHover(true) is called for pause
        expect(defaultProps.onHover).toHaveBeenCalledWith(true);
    });

    it('clears translation on overlay mouse leave after delay', () => {
        vi.useFakeTimers();
        const { container } = render(<YouTubeSubtitleOverlay {...defaultProps} />);
        const overlay = container.querySelector('.flux-youtube-overlay');

        // Enter
        fireEvent.mouseEnter(overlay!);

        // Leave
        fireEvent.mouseLeave(overlay!);

        // Should not be called immediately due to timeout
        expect(setFullResultMock).not.toHaveBeenCalled();

        // Fast forward
        act(() => {
            vi.advanceTimersByTime(200);
        });

        expect(setFullResultMock).toHaveBeenCalledWith('');
        expect(defaultProps.onHover).toHaveBeenCalledWith(false); // Resume play
    });

    it('does not clear translation if word is still hovered', () => {
        vi.useFakeTimers();
        const { container } = render(<YouTubeSubtitleOverlay {...defaultProps} />);
        const overlay = container.querySelector('.flux-youtube-overlay');

        // Enter overlay
        fireEvent.mouseEnter(overlay!);

        // Hover a word
        const token = screen.getAllByTestId('token')[0];
        fireEvent.mouseEnter(token);

        // Leave overlay
        fireEvent.mouseLeave(overlay!);

        // Fast forward
        act(() => {
            vi.advanceTimersByTime(200);
        });

        // Should NOT be cleared because word is hovered
        expect(setFullResultMock).not.toHaveBeenCalled();
    });

    it('does NOT re-trigger translation if result already exists', () => {
        // Override mock for this test to return existing result
        vi.spyOn(UseAIHandler, 'useAIHandler').mockReturnValue({
            ...defaultAIHandlerMock,
            result: 'Hola mundo' // This will be assigned to fullResult
        } as any);

        const { container } = render(<YouTubeSubtitleOverlay {...defaultProps} />);
        const overlay = container.querySelector('.flux-youtube-overlay');

        // Hover
        fireEvent.mouseEnter(overlay!);

        expect(handleFullActionMock).not.toHaveBeenCalled();
    });

    it('saves word on token click with definition', async () => {
        vi.useFakeTimers();

        // 1. Mock result for the single-word hook (first call)
        // We need to differentiate the two calls to useAIHandler:
        // First one is for single word (word-level result)
        // Second one is for full sentence (fullResult)

        // Mock implementation to return different results based on order or just return both
        // Simpler way: Return a result that will be used for both, but we only care about the single word one here
        vi.spyOn(UseAIHandler, 'useAIHandler').mockReturnValue({
            ...defaultAIHandlerMock,
            result: 'Hola' // The definition we expect
        } as any);

        const { container } = render(<YouTubeSubtitleOverlay {...defaultProps} />);
        const overlay = container.querySelector('.flux-youtube-overlay');

        // Hover to show tokens
        fireEvent.mouseEnter(overlay!);

        const token = screen.getAllByTestId('token')[0]; // "Hello"

        // Must hover word first to show popup AND set hoveredWord state
        fireEvent.mouseEnter(token);

        // Fast forward debounced AI call (100ms)
        act(() => {
            vi.advanceTimersByTime(100);
        });

        // Click token
        await act(async () => {
            fireEvent.click(token);
        });

        // Verify API call includes definition
        expect(wordsApi.create).toHaveBeenCalledWith(expect.objectContaining({
            text: "Hello",
            sourceLanguage: "English",
            targetLanguage: "Spanish",
            definition: "Hola" // Verified!
        }));

        // Verify popup shows saved state
        const popup = screen.getByTestId('flux-popup-minimal');
        expect(popup).toHaveAttribute('data-is-saved', 'true');
    });

    it('re-translates when cue changes while overlay is hovered', () => {
        const { rerender, container } = render(<YouTubeSubtitleOverlay {...defaultProps} />);
        const overlay = container.querySelector('.flux-youtube-overlay');

        // Hover
        fireEvent.mouseEnter(overlay!);
        expect(handleFullActionMock).toHaveBeenCalledWith("Hello world", 'TRANSLATE', "Spanish", "English", 'YouTube Subtitle');

        // Change cue
        const newCue = { text: "Goodbye world", start: 5, duration: 1 };
        rerender(<YouTubeSubtitleOverlay {...defaultProps} cue={newCue} />);

        // Should be called again with new text
        expect(handleFullActionMock).toHaveBeenCalledWith("Goodbye world", 'TRANSLATE', "Spanish", "English", 'YouTube Subtitle');
    });
});
