import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FluxPopup } from './FluxPopup';
import type { Mode } from '../hooks/useAIHandler';

describe('FluxPopup', () => {
    const defaultProps = {
        selection: { text: 'Hello', x: 100, y: 100 },
        result: 'Translated text',
        loading: false,
        error: null,
        mode: 'TRANSLATE' as Mode,
        targetLang: 'French',
        onModeChange: vi.fn(),
        onLangChange: vi.fn(),
        onAction: vi.fn(),
        onClose: vi.fn(),
        onMouseEnter: vi.fn(),
        onMouseLeave: vi.fn(),
        autoSave: false,
        onAutoSaveChange: vi.fn(),
        isSaving: false,
    };

    it('renders at correct position', () => {
        const { container } = render(<FluxPopup {...defaultProps} />);
        // The outer div has the absolute positioning
        const outerDiv = container.firstChild as HTMLElement;
        expect(outerDiv).toHaveStyle({
            position: 'fixed',
            left: '100px',
            top: '100px',
        });
    });

    it('triggers mouse enter/leave events', () => {
        const { container } = render(<FluxPopup {...defaultProps} />);
        const outerDiv = container.firstChild as HTMLElement;

        fireEvent.mouseEnter(outerDiv);
        expect(defaultProps.onMouseEnter).toHaveBeenCalled();

        fireEvent.mouseLeave(outerDiv);
        expect(defaultProps.onMouseLeave).toHaveBeenCalled();
    });

    it('prevents propagation on mouse down', () => {
        const handleParentMouseDown = vi.fn();
        render(
            <div onMouseDown={handleParentMouseDown}>
                <FluxPopup {...defaultProps} />
            </div>
        );

        // The popup is absolute positioned, so we find it by text or role content
        // Since we render FluxHeader inside, we can find "Flux Analysis"
        const popupContent = screen.getByText('Flux').closest('div')?.parentElement;

        if (popupContent) {
            fireEvent.mouseDown(popupContent);
        }

        expect(handleParentMouseDown).not.toHaveBeenCalled();
    });

    it('renders children components correctly', () => {
        render(<FluxPopup {...defaultProps} />);
        // Header
        expect(screen.getByText('Flux')).toBeInTheDocument();
        // Controls
        expect(screen.getByRole('button', { name: /Translate/i })).toBeInTheDocument();
        // Content
        expect(screen.getByText('Translated text')).toBeInTheDocument();
    });
});
