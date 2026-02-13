import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { FluxContentApp } from './FluxContentApp';
import * as UseAIHandler from './hooks/useAIHandler';
import * as UseTextSelection from './hooks/useTextSelection';

// Mock child components to simplify testing
// Mock child components to simplify testing
vi.mock('./components/FluxPopup', () => ({
    FluxPopup: ({ selection, result, mode, onAction, onClose, onModeChange, onSave, autoSave, onAutoSaveChange }: any) => (
        <div data-testid="flux-popup">
            <span>Popup for: {selection?.text}</span>
            <span>Result: {result}</span>
            <span>Mode: {mode}</span>
            <button onClick={onAction}>Manual Action</button>
            <button onClick={onClose}>Close</button>
            <button onClick={() => onModeChange('EXPLAIN')}>Set Explain</button>
            <button onClick={onSave}>Save</button>
            <button onClick={() => onAutoSaveChange(!autoSave)}>Toggle AutoSave</button>
        </div>
    )
}));

describe('FluxContentApp', () => {
    // Mocks
    const handleActionMock = vi.fn();
    const useAIHandlerMock = {
        result: '',
        loading: false,
        error: null,
        handleAction: handleActionMock,
        setResult: vi.fn(),
        setError: vi.fn(),
    };

    // We need to capture the callbacks passed to useTextSelection
    let triggerSelection: (sel: { text: string; x: number; y: number }) => void;
    let triggerClear: () => void;

    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        vi.resetAllMocks();

        // Setup useAIHandler mock
        vi.spyOn(UseAIHandler, 'useAIHandler').mockReturnValue(useAIHandlerMock);

        // Setup useTextSelection mock
        vi.spyOn(UseTextSelection, 'useTextSelection').mockImplementation((_, onSelection, onClear) => {
            triggerSelection = onSelection;
            triggerClear = onClear;
            return { selectionRef: { current: null } };
        });
    });

    it('renders nothing initially (HIDDEN state)', () => {
        render(<FluxContentApp />);
        expect(screen.queryByTestId('flux-popup')).toBeNull();
    });

    it('shows popup when selection is detected', async () => {
        render(<FluxContentApp />);

        const mockSelection = { text: 'Hello World', x: 100, y: 100 };

        // Trigger selection via our captured mock callback
        act(() => {
            triggerSelection(mockSelection);
        });

        const popup = screen.getByTestId('flux-popup');
        expect(popup).toBeTruthy();
        expect(screen.getByText('Popup for: Hello World')).toBeTruthy();

        // It should also auto-trigger action
        expect(handleActionMock).toHaveBeenCalledWith('Hello World', 'TRANSLATE', 'English', 'Auto');
    });

    it('hides popup when cleared', () => {
        render(<FluxContentApp />);

        // Show logic
        act(() => {
            triggerSelection({ text: 'Test', x: 0, y: 0 });
        });
        expect(screen.getByTestId('flux-popup')).toBeTruthy();

        // Clear logic
        act(() => {
            triggerClear();
        });
        expect(screen.queryByTestId('flux-popup')).toBeNull();
    });

    it('calls handleAction manually when requested', () => {
        render(<FluxContentApp />);

        // Show
        act(() => {
            triggerSelection({ text: 'Manual', x: 0, y: 0 });
        });

        // Reset auto-trigger call
        handleActionMock.mockClear();

        // Click Manual Action
        const btn = screen.getByText('Manual Action');
        act(() => {
            btn.click();
        });

        expect(handleActionMock).toHaveBeenCalledWith('Manual', 'TRANSLATE', 'English', 'Auto');
    });

    it('updates mode correctly', () => {
        render(<FluxContentApp />);

        act(() => {
            triggerSelection({ text: 'Mode Test', x: 0, y: 0 });
        });

        // Verify default check
        expect(screen.getByText('Mode: TRANSLATE')).toBeTruthy();

        // Change mode via UI (mocked button)
        const btn = screen.getByText('Set Explain');
        act(() => {
            btn.click();
        });

        expect(screen.getByText('Mode: EXPLAIN')).toBeTruthy();
    });

    it('triggers action when mode changes', () => {
        render(<FluxContentApp />);

        act(() => {
            triggerSelection({ text: 'Mode Trigger', x: 0, y: 0 });
        });

        // Clear initial auto-call
        handleActionMock.mockClear();

        // Change mode via UI (mocked button)
        const btn = screen.getByText('Set Explain');
        act(() => {
            btn.click();
        });

        // Verify handleAction called with new mode
        expect(handleActionMock).toHaveBeenCalledWith('Mode Trigger', 'EXPLAIN', 'English', 'Auto');
    });
});
