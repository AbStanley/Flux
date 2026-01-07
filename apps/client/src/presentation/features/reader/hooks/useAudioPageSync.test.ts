import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAudioPageSync } from './useAudioPageSync';

// Mock the store
const mockUseAudioStore = vi.fn();

// Mock zustand selector behavior
// The real hook uses `useAudioStore(selector)`
// mock the default export of useAudioStore.ts
vi.mock('../store/useAudioStore', () => ({
    useAudioStore: (selector: any) => mockUseAudioStore(selector)
}));

describe('useAudioPageSync', () => {
    const PAGE_SIZE = 500;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return correct page when playing', () => {
        // Setup state: Playing at word index 550 (Page 2)
        const mockState = {
            isPlaying: true,
            currentWordIndex: 550
        };

        // Mock implementation to execute the selector with our mock state
        mockUseAudioStore.mockImplementation((selector: (state: any) => any) => selector(mockState));

        const { result } = renderHook(() => useAudioPageSync(PAGE_SIZE));

        expect(result.current).toBe(2); // 550 / 500 = 1.1 -> floor(1.1) + 1 = 2
    });

    it('should return null when paused', () => {
        // Setup state: Paused at word index 550
        const mockState = {
            isPlaying: false,
            currentWordIndex: 550
        };

        mockUseAudioStore.mockImplementation((selector: (state: any) => any) => selector(mockState));

        const { result } = renderHook(() => useAudioPageSync(PAGE_SIZE));

        expect(result.current).toBeNull();
    });

    it('should return null when stopped/no word index', () => {
        // Setup state: Playing but no index (unlikely but possible in transient states)
        const mockState = {
            isPlaying: true,
            currentWordIndex: null
        };

        mockUseAudioStore.mockImplementation((selector: (state: any) => any) => selector(mockState));

        const { result } = renderHook(() => useAudioPageSync(PAGE_SIZE));

        expect(result.current).toBeNull();
    });

    it('should handle page boundaries correctly', () => {
        // Index 499 -> Page 1 (0-499 is 500 words)
        // Index 500 -> Page 2

        let mockState = { isPlaying: true, currentWordIndex: 499 };
        mockUseAudioStore.mockImplementation((selector: (state: any) => any) => selector(mockState));

        let { result, rerender } = renderHook(() => useAudioPageSync(PAGE_SIZE));
        expect(result.current).toBe(1);

        // Update state to boundary
        mockState = { isPlaying: true, currentWordIndex: 500 };
        rerender(); // The hook re-runs the selector with new state
        expect(result.current).toBe(2);
    });
});
