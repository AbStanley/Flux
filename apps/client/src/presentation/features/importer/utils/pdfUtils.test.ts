import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractPdfText } from './pdfUtils';
import { pdfjs } from 'react-pdf';

// Mock react-pdf/pdfjs
vi.mock('react-pdf', () => ({
    pdfjs: {
        getDocument: vi.fn()
    }
}));

describe('pdfUtils', () => {
    const file = new File([''], 'test.pdf', { type: 'application/pdf' });

    // Mock PDF Document structure
    const mockPage1 = {
        getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: 'Page 1 Text' }]
        })
    };
    const mockPage2 = {
        getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: 'Page 2 Text' }]
        })
    };

    const mockPdfDoc = {
        getPage: vi.fn().mockImplementation((pageNum) => {
            if (pageNum === 1) return Promise.resolve(mockPage1);
            if (pageNum === 2) return Promise.resolve(mockPage2);
            return Promise.reject('Page not found');
        }),
        numPages: 2
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (pdfjs.getDocument as any).mockReturnValue({
            promise: Promise.resolve(mockPdfDoc)
        });
    });

    it('extracts text from selected pages in order', async () => {
        const selectedPages = new Set([1, 2]);
        const text = await extractPdfText(file, selectedPages);

        expect(text).toContain('--- Page 1 ---');
        expect(text).toContain('Page 1 Text');
        expect(text).toContain('--- Page 2 ---');
        expect(text).toContain('Page 2 Text');
    });

    it('returns empty string if no pages selected', async () => {
        const text = await extractPdfText(file, new Set());
        expect(text).toBe('');
        expect(pdfjs.getDocument).not.toHaveBeenCalled();
    });

    it('sorts pages before extraction', async () => {
        const selectedPages = new Set([2, 1]); // Unordered
        const text = await extractPdfText(file, selectedPages);

        const page1Index = text.indexOf('--- Page 1 ---');
        const page2Index = text.indexOf('--- Page 2 ---');

        expect(page1Index).toBeLessThan(page2Index);
    });
});
