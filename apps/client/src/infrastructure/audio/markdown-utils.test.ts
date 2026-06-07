import { describe, it, expect } from 'vitest';
import { stripMarkdown } from './markdown-utils';

describe('stripMarkdown', () => {
    it('should pass through plain text unmodified', () => {
        const input = 'Hello world, this is a plain text.';
        const { cleanText, indexMap } = stripMarkdown(input);
        expect(cleanText).toBe(input);
        expect(indexMap).toHaveLength(input.length);
        for (let i = 0; i < input.length; i++) {
            expect(indexMap[i]).toBe(i);
        }
    });

    it('should strip bold and italic markers', () => {
        const input = 'This is **bold** and *italic* and _italic2_ and ~~strike~~.';
        const { cleanText, indexMap } = stripMarkdown(input);
        expect(cleanText).toBe('This is bold and italic and italic2 and strike.');
        
        const bIndex = cleanText.indexOf('bold');
        expect(indexMap[bIndex]).toBe(input.indexOf('bold'));

        const iIndex = cleanText.indexOf('italic');
        expect(indexMap[iIndex]).toBe(input.indexOf('italic'));
    });

    it('should strip markdown links but preserve the link text', () => {
        const input = 'Check out [my github link](https://github.com/astau) here.';
        const { cleanText, indexMap } = stripMarkdown(input);
        expect(cleanText).toBe('Check out my github link here.');

        const gIndex = cleanText.indexOf('my github link');
        expect(indexMap[gIndex]).toBe(input.indexOf('my github link'));
    });

    it('should strip markdown images completely', () => {
        const input = 'Before ![Alt text](image.png) After';
        const { cleanText } = stripMarkdown(input);
        expect(cleanText).toBe('Before  After');
    });

    it('should strip headers and formatting symbols', () => {
        const input = '# Header\nSome `code` here.';
        const { cleanText } = stripMarkdown(input);
        expect(cleanText).toBe('Header\nSome code here.');
    });

    it('should strip HTML tags', () => {
        const input = 'This <span>is</span> a <a href="#">link</a>.';
        const { cleanText } = stripMarkdown(input);
        expect(cleanText).toBe('This is a link.');
    });
});
