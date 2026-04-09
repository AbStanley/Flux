import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FluxHeader } from './FluxHeader';
import { THEMES } from '../constants';

describe('FluxHeader', () => {
    it('renders with correct title', () => {
        render(<FluxHeader
            onClose={() => { }}
            onPinToggle={() => { }}
            onSave={() => { }}
            isPinned={false}
            isCollapsed={false}
            onCollapseToggle={() => { }}
            theme={THEMES.dark}
        />);
        expect(screen.getByText('Flux')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const handleClose = vi.fn();
        render(<FluxHeader
            onClose={handleClose}
            onPinToggle={() => { }}
            onSave={() => { }}
            isPinned={false}
            isCollapsed={false}
            onCollapseToggle={() => { }}
            theme={THEMES.dark}
        />);

        const closeButton = screen.getByRole('button', { name: /✕/i });
        fireEvent.click(closeButton);

        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
