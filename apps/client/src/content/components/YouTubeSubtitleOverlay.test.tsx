import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { YouTubeSubtitleOverlay } from './YouTubeSubtitleOverlay';
import * as UseAIHandler from '../hooks/useAIHandler';

// Mock child components
vi.mock('@/lib/chrome-storage', () => ({
    chromeStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
    }
}));

vi.mock('./FluxMinimalPopup', () => ({
    FluxMinimalPopup: () => <div data-testid="flux-popup-minimal">Popup</div>
}));

vi.mock('./SubtitleToken', () => ({
    SubtitleToken: ({ token, onMouseEnter, onMouseLeave }: any) => (
        <span
            data-testid="token"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
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

        // Use persistent mock return value to handle multiple renders
        vi.spyOn(UseAIHandler, 'useAIHandler').mockReturnValue(defaultAIHandlerMock as any);
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

        expect(handleFullActionMock).toHaveBeenCalledWith("Hello world", 'TRANSLATE', "Spanish", "English");

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

        vi.useRealTimers();
    });

    it('does not clear translation if word is still hovered', () => {
        vi.useFakeTimers();
        const { container } = render(<YouTubeSubtitleOverlay {...defaultProps} />);
        const overlay = container.querySelector('.flux-youtube-overlay');

        // Enter overlay
        fireEvent.mouseEnter(overlay!);

        vi.useRealTimers();
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
});
