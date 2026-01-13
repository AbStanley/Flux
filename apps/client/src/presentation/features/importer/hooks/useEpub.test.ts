import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEpub } from './useEpub';
import { processToc, extractEpubText } from '../utils/epubUtils';

vi.mock('../utils/epubUtils', () => ({
    processToc: vi.fn(),
    extractEpubText: vi.fn(),
}));

// Mock dependencies
vi.mock('epubjs', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            ready: Promise.resolve(),
            loaded: {
                navigation: Promise.resolve({ toc: [] })
            },
            destroy: vi.fn()
        }))
    };
});

describe('useEpub', () => {
    const file = new File([''], 'test.epub', { type: 'application/epub+zip' });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes and loads epub', async () => {
        (processToc as any).mockReturnValue([{ id: '1', label: 'Chapter 1', href: 'ch1.html' }]);

        const { result } = renderHook(() => useEpub(file));

        // Initially loading
        expect(result.current.loading).toBe(true);

        // Wait for loading to finish by checking side effect
        await waitFor(() => {
            expect(processToc).toHaveBeenCalled();
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.chapters).toHaveLength(1);
    });

    it('calls extractEpubText when extracting', async () => {
        (processToc as any).mockReturnValue([]);
        (extractEpubText as any).mockResolvedValue('Content');

        const { result } = renderHook(() => useEpub(file));

        await waitFor(() => expect(result.current.loading).toBe(false));

        const selectedHrefs = new Set(['ch1.html']);

        await act(async () => {
            await result.current.extract(selectedHrefs);
        });

        expect(extractEpubText).toHaveBeenCalled();
    });
});
