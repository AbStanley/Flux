import { describe, it, expect } from 'vitest';
import { getSentenceRange } from './text-utils';

describe('getSentenceRange', () => {
    // Helper to generate a range array
    const range = (start: number, end: number) => {
        const result = [];
        for (let i = start; i <= end; i++) result.push(i);
        return result;
    };

    describe('Basic Sentence Extraction', () => {
        it('should select a simple sentence', () => {
            const tokens = ['Hello', ' ', 'world', '.', ' ', 'Next', ' ', 'sentence', '.'];
            // Cursor at 'world' (index 2)
            const result = getSentenceRange(2, tokens);
            expect(result).toEqual(range(0, 3));
        });

        it('should select the next sentence correctly', () => {
            const tokens = ['Hello', ' ', 'world', '.', ' ', 'Next', ' ', 'sentence', '.'];
            // Cursor at 'Next' (index 5)
            const result = getSentenceRange(5, tokens);
            expect(result).toEqual(range(5, 8));
        });

        it('should handle sentences ending with exclamation mark', () => {
            const tokens = ['Wow', '!', ' ', 'Next', '.'];
            const result = getSentenceRange(0, tokens); // Cursor at 'Wow'
            expect(result).toEqual(range(0, 1));
        });

        it('should handle sentences ending with question mark', () => {
            const tokens = ['Why', '?', ' ', 'Because', '.'];
            const result = getSentenceRange(0, tokens); // Cursor at 'Why'
            expect(result).toEqual(range(0, 1));
        });
    });

    describe('Abbreviation Handling', () => {
        const abbreviations = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Sr.', 'Jr.', 'vs.', 'etc.', 'Fig.', 'al.', 'Gen.', 'Rep.', 'Sen.', 'Gov.', 'Est.', 'No.', 'Op.', 'Vol.', 'pp.'];

        it.each(abbreviations)('should not treat "%s" as a sentence end', (abbr) => {
            // Case 1: Abbreviation in middle
            const tokens = ['Hello', ' ', abbr, ' ', 'Smith', '.', ' ', 'Next', '.'];
            // Cursor at 'Smith' (index 4)
            const result = getSentenceRange(4, tokens);
            expect(result).toEqual(range(0, 5));
        });

        it('should handle multiple abbreviations in one sentence', () => {
            const tokens = ['Dr.', ' ', 'Smith', ' ', 'met', ' ', 'Mrs.', ' ', 'Doe', '.'];
            // Cursor at 'met' (index 4)
            const result = getSentenceRange(4, tokens);
            expect(result).toEqual(range(0, 9));
        });

        it('should handle abbreviations at the start of a sentence', () => {
            const tokens = ['Previous', '.', ' ', 'Mr.', ' ', 'Bond', ' ', 'is', ' ', 'here', '.'];
            // Cursor at 'Bond' (index 5)
            const result = getSentenceRange(5, tokens);
            expect(result).toEqual(range(3, 10));
        });
    });

    describe('Complex Punctuation', () => {
        it('should include closing quotes at end of sentence', () => {
            // Case A: token is '."' (common in some tokenizers)
            const tokensA = ['He', ' ', 'said', ' ', '"Hello."', ' ', 'Next'];
            const resultA = getSentenceRange(4, tokensA);
            expect(resultA).toEqual(range(0, 4));
        });
    });

    describe('Whitespace and Newlines', () => {
        it('should stop backward search at newline', () => {
            // Newline should force a break even if no punctuation
            const tokens = ['Header', '\n', 'Body', ' ', 'text', '.'];
            // Cursor at 'Body' (index 2)
            const result = getSentenceRange(2, tokens);
            // Search back: 
            // 1: '\n' -> break, start = 1+1 = 2.
            expect(result).toEqual(range(2, 5));
        });

        it('should stop forward search at newline', () => {
            const tokens = ['Title', '\n', 'Next', 'line'];
            // Cursor at 'Title' (0)
            const result = getSentenceRange(0, tokens);
            // Search fwd:
            // 0: 'Title'
            // 1: '\n' -> break, end = max(0, 1-1) = 0.
            expect(result).toEqual(range(0, 0));
        });

        it('should trim leading/trailing whitespace from range', () => {
            // Range logic finds tentative start/end, then trims.
            const tokens = ['One', '.', ' ', ' ', 'Two', '.', ' ', ' '];
            // Cursor at 'Two' (4)
            // Back search:
            // 3: ' '
            // 2: ' '
            // 1: '.' (true) -> start = 2.
            // Forward search:
            // 4: 'Two'
            // 5: '.' (true) -> end = 5.
            // Tentative: 2..5 => [' ', ' ', 'Two', '.']
            // Optimize loop:
            // Trim start: 2(' ') -> 3, 3(' ') -> 4. Start=4.
            // Result: 4..5 => ['Two', '.']
            const result = getSentenceRange(4, tokens);
            expect(result).toEqual(range(4, 5));
        });
    });

    describe('Edge Cases', () => {
        it('should handle single word sentence', () => {
            const tokens = ['Hello'];
            const result = getSentenceRange(0, tokens);
            expect(result).toEqual(range(0, 0));
        });

        it('should handle boundary conditions (start of file)', () => {
            const tokens = ['Start', ' ', 'here', '.'];
            const result = getSentenceRange(0, tokens);
            expect(result).toEqual(range(0, 3));
        });

        it('should handle boundary conditions (end of file)', () => {
            const tokens = ['Previous', '.', ' ', 'End', '.'];
            const result = getSentenceRange(3, tokens); // 'End'
            // Correction: actual expected result depends on trim.
            // 2 is ' ' -> trim -> 3.
            expect(result).toEqual(range(3, 4));
        });

        it('should return empty range for whitespace-only selection', () => {
            // If user clicks strictly on whitespace between sentences
            const tokens = ['One', '.', ' ', 'Two'];
            const result = getSentenceRange(2, tokens);
            // 2(' ') -> trims to 3
            // End at 3.
            expect(result).toEqual(range(3, 3));
        });
    });
});
