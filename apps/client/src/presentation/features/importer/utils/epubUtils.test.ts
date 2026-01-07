import { describe, it, expect, vi } from 'vitest';
import { processToc, flattenToc, extractEpubText } from './epubUtils';
import type { Chapter } from './epubUtils';

describe('epubUtils', () => {
    describe('processToc', () => {
        it('should transform raw items into Chapter structure', () => {
            const rawItems = [
                { id: '1', label: 'Chapter 1', href: 'ch1.html', subitems: [] },
                {
                    id: '2',
                    label: 'Chapter 2',
                    href: 'ch2.html',
                    subitems: [
                        { id: '2.1', label: 'Section 1', href: 'ch2-1.html' }
                    ]
                }
            ];

            const result = processToc(rawItems);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: '1',
                label: 'Chapter 1',
                href: 'ch1.html',
                subitems: []
            });

            expect(result[1].subitems).toHaveLength(1);
            expect(result[1].subitems![0].label).toBe('Section 1');
        });
    });

    describe('flattenToc', () => {
        it('should flatten nested structure', () => {
            const toc: Chapter[] = [
                { id: '1', label: '1', href: '1', subitems: [] },
                {
                    id: '2', label: '2', href: '2', subitems: [
                        { id: '2.1', label: '2.1', href: '2.1' }
                    ]
                }
            ];

            const result = flattenToc(toc);
            expect(result).toHaveLength(3);
            expect(result.map(c => c.label)).toEqual(['1', '2', '2.1']);
        });
    });

    describe('extractEpubText', () => {
        it('should extract text from selected hrefs in order', async () => {
            const mockSpineItem = {
                load: vi.fn(),
                unload: vi.fn()
            };

            const mockBook = {
                spine: {
                    get: vi.fn(),
                    items: []
                },
                load: vi.fn() // passed to spine item load
            };

            // Mock spine.get to return our mock item
            (mockBook.spine.get as any).mockImplementation((href: string) => {
                if (href === 'intro.xhtml') return mockSpineItem;
                if (href === 'ch1.xhtml') return mockSpineItem;
                return undefined;
            });

            // Mock spine item load to return a simple document string
            (mockSpineItem.load as any).mockImplementation(async () => {
                // Return generic XML string
                return '<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><body><p>Content</p></body></html>';
            });

            const toc: Chapter[] = [
                { id: '1', label: 'Intro', href: 'intro.xhtml' },
                { id: '2', label: 'Chapter 1', href: 'ch1.xhtml' },
                { id: '3', label: 'Chapter 2', href: 'ch2.xhtml' }
            ];

            const selectedHrefs = new Set(['ch1.xhtml', 'intro.xhtml']);

            // flattenToc puts Intro first, then Ch1.
            // Expected order: Intro -> Ch1 (because of TOC order), NOT selection checking order.

            const result = await extractEpubText(mockBook, selectedHrefs, toc);

            // Should contain both contents
            expect(result).toContain('### Intro');
            expect(result).toContain('### Chapter 1');

            // Validate Order: "Intro" should appear before "Chapter 1" in the string
            const introIndex = result.indexOf('### Intro');
            const ch1Index = result.indexOf('### Chapter 1');
            expect(introIndex).toBeGreaterThan(-1);
            expect(ch1Index).toBeGreaterThan(-1);
            expect(introIndex).toBeLessThan(ch1Index);
        });

        it('should handle missing spine items gracefully', async () => {
            const mockBook = {
                spine: {
                    get: vi.fn().mockReturnValue(undefined), // nothing found
                    items: []
                }
            };
            const toc: Chapter[] = [{ id: '1', label: 'Ch1', href: 'ch1.xhtml' }];
            const selectedHrefs = new Set(['ch1.xhtml']);

            // Should warn but not throw
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            const result = await extractEpubText(mockBook, selectedHrefs, toc);

            expect(result).toBe('');
            expect(spy).toHaveBeenCalledWith(expect.stringContaining('Could not find spine item'));

            spy.mockRestore();
        });
    });
});
