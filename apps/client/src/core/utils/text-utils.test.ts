import { describe, it, expect } from 'vitest';
import { getSentenceRange } from './text-utils';

describe('getSentenceRange', () => {
    it('should select a simple sentence', () => {
        const tokens = ['Hello', ' ', 'world', '.', ' ', 'Next', ' ', 'sentence', '.'];
        const result = getSentenceRange(2, tokens);
        expect(result).toEqual([0, 1, 2, 3]);
    });

    it('should select a sentence with abbreviation', () => {
        const tokens = ['Hello', ' ', 'Mr.', ' ', 'Smith', '.', ' ', 'Next', '.'];
        const result = getSentenceRange(4, tokens);
        expect(result).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('should respect boundaries', () => {
        const tokens = ['First', '.', ' ', 'Second', ' ', 'sentence', '.', ' ', 'Third', '.'];
        const result = getSentenceRange(5, tokens);
        expect(result).toEqual([3, 4, 5, 6]);
    });
});
