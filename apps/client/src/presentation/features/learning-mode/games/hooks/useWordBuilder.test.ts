import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useWordBuilder } from './useWordBuilder';

describe('useWordBuilder', () => {
    const defaultProps = {
        targetWords: ['cat'],
        onComplete: vi.fn(),
        isTimerPaused: false
    };

    it('should initialize slots and letter pool correctly', async () => {
        const { result } = renderHook(() => useWordBuilder(defaultProps));

        // Check slots: 'cat' has 3 letters
        await waitFor(() => {
            expect(result.current.slots).toHaveLength(1);
        });
        expect(result.current.slots[0]).toHaveLength(3); // 3 chars

        // Initial state of slots
        result.current.slots[0].forEach(slot => {
            expect(slot.isFilled).toBe(false);
            expect(slot.char).toBe('');
        });

        // Check pool: 'c', 'a', 't' + extra (if configured to add extra, currently implementation adds slight noise)
        // The implementation scambles, so we just check existence
        expect(result.current.letterPool.length).toBeGreaterThanOrEqual(3);
        const chars = result.current.letterPool.map(l => l.char.toLowerCase());
        expect(chars).toContain('c');
        expect(chars).toContain('a');
        expect(chars).toContain('t');
    });

    it('should handle input correctly', async () => {
        const { result } = renderHook(() => useWordBuilder(defaultProps));

        await waitFor(() => expect(result.current.letterPool.length).toBeGreaterThan(0));

        // Find 'c' in pool
        const cBtn = result.current.letterPool.find(l => l.char.toLowerCase() === 'c');
        expect(cBtn).toBeDefined();

        act(() => {
            result.current.handleInput('c', cBtn!.id);
        });

        // Slot 0 should be filled with 'c'
        expect(result.current.slots[0][0].char.toLowerCase()).toBe('c');
        expect(result.current.slots[0][0].isFilled).toBe(true);
        expect(result.current.slots[0][0].sourceBtnId).toBe(cBtn!.id);

        // Pool button should be used
        const updatedPoolBtn = result.current.letterPool.find(l => l.id === cBtn!.id);
        expect(updatedPoolBtn?.isUsed).toBe(true);
    });

    it('should handle multiple words support if needed (using default 1 word now)', async () => {
        const props = { ...defaultProps, targetWords: ['go'] };
        const { result } = renderHook(() => useWordBuilder(props));
        await waitFor(() => {
            expect(result.current.slots).toHaveLength(1);
            expect(result.current.slots[0]).toHaveLength(2);
        });
    });

    it('should reveal answer when requested', async () => {
        const { result } = renderHook(() => useWordBuilder(defaultProps));

        await waitFor(() => expect(result.current.slots.length).toBeGreaterThan(0));

        act(() => {
            result.current.revealAnswer();
        });

        expect(result.current.isRevealed).toBe(true);
        // All slots should be filled with correct answer
        const word = result.current.slots[0].map(s => s.char).join('').toLowerCase();
        expect(word).toBe('cat');
    });

    it('should trigger onComplete when word is built correctly', async () => {
        const { result } = renderHook(() => useWordBuilder(defaultProps));

        await waitFor(() => expect(result.current.letterPool.length).toBeGreaterThan(0));

        // Type 'c', 'a', 't'
        const letters = ['c', 'a', 't'];

        letters.forEach(char => {
            // Check finding unused buttons to simulate typing
            // Note: In real app user clicks specific button. Logic handles "finding button" if typing? 
            // The logic accepts 'btnId'. We need to find valid ids from the pool.
            const btn = result.current.letterPool.find(l => l.char.toLowerCase() === char && !l.isUsed);
            act(() => {
                result.current.handleInput(char, btn!.id);
            });
        });

        expect(defaultProps.onComplete).toHaveBeenCalledWith(true);
        expect(result.current.isComplete).toBe(true);
    });

    it('should remove letter on slot click (backspace)', async () => {
        const { result } = renderHook(() => useWordBuilder(defaultProps));

        await waitFor(() => expect(result.current.letterPool.length).toBeGreaterThan(0));

        const cBtn = result.current.letterPool.find(l => l.char.toLowerCase() === 'c');

        // Add 'c'
        act(() => {
            result.current.handleInput('c', cBtn!.id);
        });

        expect(result.current.slots[0][0].isFilled).toBe(true);

        // Click slot to remove
        act(() => {
            result.current.handleSlotClick(0, 0); // wordIndex, slotIndex
        });

        expect(result.current.slots[0][0].isFilled).toBe(false);
        expect(result.current.slots[0][0].char).toBe('');

        // Button should be freed
        const freedBtn = result.current.letterPool.find(l => l.id === cBtn!.id);
        expect(freedBtn?.isUsed).toBe(false);
    });
});
