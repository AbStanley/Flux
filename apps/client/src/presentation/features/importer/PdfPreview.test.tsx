import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PdfPreview } from './PdfPreview';

// Mock dependencies
const mockExtract = vi.fn();
const mockOnDocumentLoadSuccess = vi.fn();
vi.mock('./hooks/usePdf', () => ({
    usePdf: () => ({
        numPages: 5,
        isExtracting: false,
        onDocumentLoadSuccess: mockOnDocumentLoadSuccess,
        extract: mockExtract
    })
}));

// Mock PdfPageGrid to avoid rendering logic here
vi.mock('./components/PdfPageGrid', () => ({
    PdfPageGrid: ({ selectedPages, onToggle }: any) => (
        <div data-testid="pdf-page-grid">
            <button onClick={() => onToggle(1)}>Toggle Page 1</button>
            <div data-testid="selected-count">{selectedPages.size}</div>
        </div>
    )
}));

// Mock react-pdf Document to simply render children (which is PdfPageGrid in our case)
vi.mock('react-pdf', () => ({
    Document: ({ children, onLoadSuccess }: any) => {
        // Simulate load success immediately for testing flow
        setTimeout(() => onLoadSuccess({ numPages: 5 }), 0);
        return <div data-testid="pdf-document">{children}</div>;
    },
    pdfjs: { GlobalWorkerOptions: { workerSrc: '' } }
}));

describe('PdfPreview', () => {
    const mockOnExtract = vi.fn();
    const mockOnCancel = vi.fn();
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });

    it('renders file name', () => {
        render(<PdfPreview file={file} onExtract={mockOnExtract} onCancel={mockOnCancel} />);
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    it('toggles pages via grid interaction', async () => {
        render(<PdfPreview file={file} onExtract={mockOnExtract} onCancel={mockOnCancel} />);

        const toggleBtn = screen.getByText('Toggle Page 1');

        // Select page 1
        fireEvent.click(toggleBtn);
        expect(screen.getByTestId('selected-count')).toHaveTextContent('1');

        // Deselect page 1
        fireEvent.click(toggleBtn);
        expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
    });

    it('disables import button when no pages selected', () => {
        render(<PdfPreview file={file} onExtract={mockOnExtract} onCancel={mockOnCancel} />);
        const importBtn = screen.getByText(/Import Selected/);
        expect(importBtn).toBeDisabled();
    });

    it('calls extract when pages selected and import clicked', async () => {
        mockExtract.mockResolvedValue('Extracted Text');
        render(<PdfPreview file={file} onExtract={mockOnExtract} onCancel={mockOnCancel} />);

        // Select a page first
        fireEvent.click(screen.getByText('Toggle Page 1'));

        const importBtn = screen.getByText(/Import Selected/);
        expect(importBtn).not.toBeDisabled();

        fireEvent.click(importBtn);

        await waitFor(() => {
            expect(mockExtract).toHaveBeenCalled();
            expect(mockOnExtract).toHaveBeenCalledWith('Extracted Text');
        });
    });

    it('calls onCancel when cancel clicked', () => {
        render(<PdfPreview file={file} onExtract={mockOnExtract} onCancel={mockOnCancel} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(mockOnCancel).toHaveBeenCalled();
    });
});
