import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FluxHeader } from './FluxHeader';

describe('FluxHeader', () => {
    it('renders with correct title', () => {
        render(<FluxHeader onClose={() => { }} />);
        expect(screen.getByText('Flux Analysis')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const handleClose = vi.fn();
        render(<FluxHeader onClose={handleClose} />);

        const closeButton = screen.getByRole('button', { name: /✕/i });
        fireEvent.click(closeButton);

        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
