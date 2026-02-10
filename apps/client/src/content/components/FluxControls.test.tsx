import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FluxControls } from './FluxControls';
import type { Mode } from '../hooks/useAIHandler';

describe('FluxControls', () => {
    const defaultProps = {
        mode: 'TRANSLATE' as Mode,
        targetLang: 'French',
        result: 'Translated text',
        selection: { text: 'Hello' },
        onModeChange: vi.fn(),
        onLangChange: vi.fn(),
        onAction: vi.fn(),
        autoSave: false,
        onAutoSaveChange: vi.fn(),
        isSaving: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockImplementation(() => Promise.resolve()),
            },
        });

        // Mock Chrome API
        global.window.chrome = {
            storage: {
                local: {
                    set: vi.fn((_, cb) => cb && cb()),
                },
            },
            runtime: {
                sendMessage: vi.fn(),
            },
        } as unknown as typeof chrome;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // @ts-expect-error - Testing missing title
        delete global.window.chrome;
    });

    it('renders language selector and buttons', () => {
        render(<FluxControls {...defaultProps} />);
        expect(screen.getByRole('button', { name: /Translate/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Explain/i })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: "Target Language" })).toHaveValue('French');
        expect(screen.getByRole('button', { name: /Go/i })).toBeInTheDocument();
    });

    it('calls onModeChange when mode buttons are clicked', () => {
        render(<FluxControls {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /Explain/i }));
        expect(defaultProps.onModeChange).toHaveBeenCalledWith('EXPLAIN');
    });

    it('calls onLangChange when language is changed', () => {
        render(<FluxControls {...defaultProps} />);
        fireEvent.change(screen.getByRole('combobox', { name: "Target Language" }), { target: { value: 'Spanish' } });
        expect(defaultProps.onLangChange).toHaveBeenCalledWith('Spanish');
    });

    it('calls onAction when Go is clicked', () => {
        render(<FluxControls {...defaultProps} />);
        fireEvent.click(screen.getByRole('button', { name: /Go/i }));
        expect(defaultProps.onAction).toHaveBeenCalled();
    });

    it('copies to clipboard when copy button is clicked', async () => {
        render(<FluxControls {...defaultProps} />);
        const copyBtn = screen.getByTitle('Copy Result');
        fireEvent.click(copyBtn);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Translated text');

        // Should show success icon
        expect(await screen.findByText('✓')).toBeInTheDocument();
    });

    it('saves to chrome storage when save button is clicked', () => {
        render(<FluxControls {...defaultProps} />);
        const saveBtn = screen.getByTitle('Read in Flux');
        fireEvent.click(saveBtn);

        expect(window.chrome.storage.local.set).toHaveBeenCalledWith(
            { pendingText: 'Hello' },
            expect.any(Function)
        );
        expect(window.chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'TEXT_SELECTED', text: 'Hello' });
        expect(window.chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'TEXT_SELECTED', text: 'Hello' });
    });

    it('toggles auto-save when button is clicked', () => {
        render(<FluxControls {...defaultProps} />);
        const toggleBtn = screen.getByTitle('Auto-Save Off');
        fireEvent.click(toggleBtn);
        expect(defaultProps.onAutoSaveChange).toHaveBeenCalledWith(true);
    });
});
