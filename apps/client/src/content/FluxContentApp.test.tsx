import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { FluxContentApp } from './FluxContentApp';
import * as UseAIHandler from './hooks/useAIHandler';
import * as UseTextSelection from './hooks/useTextSelection';

import { ServiceProvider } from '../presentation/contexts/ServiceContext';

vi.mock('../infrastructure/ai/ServerAIService', () => {
    const ServerAIServiceMock = vi.fn();
    ServerAIServiceMock.prototype.getAvailableModels = vi.fn().mockResolvedValue(['llama3']);
    ServerAIServiceMock.prototype.setModel = vi.fn();
    ServerAIServiceMock.prototype.getModel = vi.fn().mockReturnValue('llama3');
    ServerAIServiceMock.prototype.explainText = vi.fn();
    ServerAIServiceMock.prototype.translateText = vi.fn();
    ServerAIServiceMock.prototype.checkHealth = vi.fn();
    return { ServerAIService: ServerAIServiceMock };
});

vi.mock('@/infrastructure/ai/ServerAIService', () => {
    const ServerAIServiceMock = vi.fn();
    ServerAIServiceMock.prototype.getAvailableModels = vi.fn().mockResolvedValue(['llama3']);
    ServerAIServiceMock.prototype.setModel = vi.fn();
    ServerAIServiceMock.prototype.getModel = vi.fn().mockReturnValue('llama3');
    ServerAIServiceMock.prototype.explainText = vi.fn();
    ServerAIServiceMock.prototype.translateText = vi.fn();
    ServerAIServiceMock.prototype.checkHealth = vi.fn();
    return { ServerAIService: ServerAIServiceMock };
});

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
        cancel: vi.fn(),
        reset: vi.fn(),
    };

    // We need to capture the callbacks passed to useTextSelection
    let triggerSelection: (sel: { text: string; x: number; y: number }) => void;
    let triggerClear: () => void;

    afterEach(() => {
        cleanup();
    });

    beforeEach(() => {
        vi.clearAllMocks();

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
        render(<ServiceProvider><FluxContentApp /></ServiceProvider>);
        expect(screen.queryByTestId('flux-popup')).toBeNull();
    });

    it('shows popup when selection is detected by default', async () => {
        render(<ServiceProvider><FluxContentApp /></ServiceProvider>);

        const mockSelection = { text: 'Hello World', x: 100, y: 100 };

        // Trigger selection via our captured mock callback
        act(() => {
            triggerSelection(mockSelection);
        });

        const popup = screen.getByTestId('flux-popup');
        expect(popup).toBeTruthy();
        expect(screen.getByText('Popup for: Hello World')).toBeTruthy();

        // It should auto-trigger action
        expect(handleActionMock).toHaveBeenCalledWith('Hello World', 'TRANSLATE', 'English', 'Auto');
    });

    it('hides popup when cleared', () => {
        render(<ServiceProvider><FluxContentApp /></ServiceProvider>);

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
        render(<ServiceProvider><FluxContentApp /></ServiceProvider>);

        // Show
        act(() => {
            triggerSelection({ text: 'Manual', x: 0, y: 0 });
        });

        // Reset auto-trigger call (which happened automatically)
        handleActionMock.mockClear();

        // Click Manual Action
        const btn = screen.getByText('Manual Action');
        act(() => {
            btn.click();
        });

        expect(handleActionMock).toHaveBeenCalledWith('Manual', 'TRANSLATE', 'English', 'Auto');
    });

    it('updates mode correctly', () => {
        render(<ServiceProvider><FluxContentApp /></ServiceProvider>);

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
        render(<ServiceProvider><FluxContentApp /></ServiceProvider>);

        act(() => {
            triggerSelection({ text: 'Mode Trigger', x: 0, y: 0 });
        });

        // Clear initial auto-call from selection
        handleActionMock.mockClear();

        // Change mode via UI (mocked button)
        const btn = screen.getByText('Set Explain');
        act(() => {
            btn.click();
        });

        // Verify handleAction called with new mode
        expect(handleActionMock).toHaveBeenCalledWith('Mode Trigger', 'EXPLAIN', 'English', 'Auto');
    });

    it('adapts trigger mode to FAB on intentional dismissal and restores to Popup on FAB click', async () => {
        render(<ServiceProvider><FluxContentApp /></ServiceProvider>);

        // 1. Initial selection: opens popup directly
        act(() => {
            triggerSelection({ text: 'First Selection', x: 0, y: 0 });
        });
        expect(screen.getByTestId('flux-popup')).toBeTruthy();
        expect(screen.queryByTitle('Translate with Flux')).toBeNull();

        // 2. Intentional dismissal: click close button
        const closeBtn = screen.getByText('Close');
        act(() => {
            closeBtn.click();
        });
        expect(screen.queryByTestId('flux-popup')).toBeNull();

        // 3. Subsequent selection: shows FAB only (does not auto-trigger popup)
        handleActionMock.mockClear();
        act(() => {
            triggerSelection({ text: 'Second Selection', x: 0, y: 0 });
        });
        expect(screen.queryByTestId('flux-popup')).toBeNull();
        const fab = screen.getByTitle('Translate with Flux');
        expect(fab).toBeTruthy();
        expect(handleActionMock).not.toHaveBeenCalled();

        // 4. Click FAB: triggers popup and resets auto-trigger
        act(() => {
            fab.click();
        });
        expect(screen.getByTestId('flux-popup')).toBeTruthy();
        expect(handleActionMock).toHaveBeenCalledWith('Second Selection', 'TRANSLATE', 'English', 'Auto');

        // 5. Clear selection (unfocus) - autoShowPopup should remain true
        act(() => {
            triggerClear();
        });
        expect(screen.queryByTestId('flux-popup')).toBeNull();

        // 6. Third selection: opens popup directly again
        act(() => {
            triggerSelection({ text: 'Third Selection', x: 0, y: 0 });
        });
        expect(screen.getByTestId('flux-popup')).toBeTruthy();
    });
});
