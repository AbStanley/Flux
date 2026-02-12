import { cleanResponse } from './ollama-utils';

describe('ollama-utils', () => {
    describe('cleanResponse', () => {
        it('should return empty string for empty input', () => {
            expect(cleanResponse('')).toBe('');
        });

        it('should remove <think> tags', () => {
            const input = 'Only <think>some thought</think>the result.';
            expect(cleanResponse(input)).toBe('Only the result.');
        });

        it('should remove markdown code blocks', () => {
            const input = 'Here is the code: ```json\n{"key": "value"}\n```';
            expect(cleanResponse(input)).toBe('{"key": "value"}');
        });

        it('should remove surrounding quotes', () => {
            expect(cleanResponse('"hello"')).toBe('hello');
            expect(cleanResponse("'world'")).toBe('world');
        });

        it('should remove common prefixes', () => {
            expect(cleanResponse('Translation: hello')).toBe('hello');
            expect(cleanResponse('The translation is: world')).toBe('world');
        });

        it('should truncate to first line by default', () => {
            const input = 'First line.\nSecond line.';
            expect(cleanResponse(input)).toBe('First line.');
            expect(cleanResponse(input, { multiline: false })).toBe('First line.');
        });

        it('should keep multiple lines when multiline option is true', () => {
            const input = 'First line.\nSecond line.';
            expect(cleanResponse(input, { multiline: true })).toBe('First line.\nSecond line.');
        });

        it('should still clean prefixes and tags in multiline mode', () => {
            const input = '<think>thinking</think>Translation: First line.\nSecond line.';
            expect(cleanResponse(input, { multiline: true })).toBe('First line.\nSecond line.');
        });
    });
});
