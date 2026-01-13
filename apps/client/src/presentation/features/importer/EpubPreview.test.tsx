import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EpubPreview } from './EpubPreview';

// Mock dependencies
const mockExtract = vi.fn();
const mockChapters = [
    { id: '1', label: 'Chapter 1', href: 'ch1.html' },
    { id: '2', label: 'Chapter 2', href: 'ch2.html' }
];

vi.mock('./hooks/useEpub', () => ({
    useEpub: () => ({
        chapters: mockChapters,
        loading: false,
        isExtracting: false,
        extract: mockExtract
    })
}));

vi.mock('./components/EpubChapterList', () => ({
    EpubChapterList: ({ selectedHrefs, onToggle }: any) => (
        <div data-testid="epub-chapter-list">
            <button onClick={() => onToggle('ch1.html')}>Toggle Chapter 1</button>
            <div data-testid="selected-count">{selectedHrefs.size}</div>
        </div>
    )
}));

describe('EpubPreview', () => {
    const mockOnExtract = vi.fn();
    const mockOnCancel = vi.fn();
    const file = new File([''], 'test.epub', { type: 'application/epub+zip' });

    it('renders file name', () => {
        render(<EpubPreview file={file} onExtract={mockOnExtract} onCancel={mockOnCancel} />);
        expect(screen.getByText('test.epub')).toBeInTheDocument();
    });

    it('toggles chapters interaction', async () => {
        render(<EpubPreview file={file} onExtract={mockOnExtract} onCancel={mockOnCancel} />);

        const toggleBtn = screen.getByText('Toggle Chapter 1');

        // Select chapter
        fireEvent.click(toggleBtn);
        expect(screen.getByTestId('selected-count')).toHaveTextContent('1');

        // Deselect chapter
        fireEvent.click(toggleBtn);
        expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
    });

    it('calls extract when chapters selected and import clicked', async () => {
        mockExtract.mockResolvedValue('Extracted EPUB Text');
        render(<EpubPreview file={file} onExtract={mockOnExtract} onCancel={mockOnCancel} />);

        // Select a chapter
        fireEvent.click(screen.getByText('Toggle Chapter 1'));

        const importBtn = screen.getByText(/Import Selected/);
        expect(importBtn).not.toBeDisabled();

        fireEvent.click(importBtn);

        await waitFor(() => {
            expect(mockExtract).toHaveBeenCalled();
            expect(mockOnExtract).toHaveBeenCalledWith('Extracted EPUB Text');
        });
    });
});
