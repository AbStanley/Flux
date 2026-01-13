import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { usePdf } from './usePdf';
vi.mock('../utils/pdfUtils', () => ({
    extractPdfText: vi.fn(),
}));

import { extractPdfText } from '../utils/pdfUtils';

describe('usePdf', () => {
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => usePdf(file));
        expect(result.current.numPages).toBe(0);
        expect(result.current.isExtracting).toBe(false);
    });

    it('updates numPages on load success', () => {
        const { result } = renderHook(() => usePdf(file));

        act(() => {
            result.current.onDocumentLoadSuccess({ numPages: 10 });
        });

        expect(result.current.numPages).toBe(10);
    });

    it('calls extractPdfText when extracting', async () => {
        (extractPdfText as any).mockResolvedValue('Extracted Text');

        const { result } = renderHook(() => usePdf(file));
        const selectedPages = new Set([1, 2]);

        let text = '';
        await act(async () => {
            text = await result.current.extract(selectedPages);
        });

        expect(extractPdfText).toHaveBeenCalledWith(file, selectedPages);
        expect(text).toBe('Extracted Text');
        expect(result.current.isExtracting).toBe(false);
    });

    it('returns empty string if no pages selected', async () => {
        const { result } = renderHook(() => usePdf(file));

        let text = '';
        await act(async () => {
            text = await result.current.extract(new Set());
        });

        expect(text).toBe('');
        expect(extractPdfText).not.toHaveBeenCalled();
    });
});
