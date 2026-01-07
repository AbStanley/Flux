import { useCallback } from 'react';
import { useAudioStore } from '../store/useAudioStore';

/**
 * Hook to determine which page the reader should be on based on audio playback.
 * Returns the page number if audio is playing and should force a page view.
 * Returns null if audio is paused or stopped, allowing manual navigation.
 */
export const useAudioPageSync = (pageSize: number): number | null => {
    return useAudioStore(useCallback(s => {
        // Only enforce page if explicitly playing
        if (!s.isPlaying || s.currentWordIndex === null) return null;

        // Calculate page (1-based)
        return Math.floor(s.currentWordIndex / pageSize) + 1;
    }, [pageSize]));
};
