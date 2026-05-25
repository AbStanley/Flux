import { useRef, useCallback } from 'react';
import type { SubtitleCue } from '../services/YouTubeService';
import { seekViaPlayer, getCurrentTime } from '../services/YouTubePlayerAPI';

interface HistoryItem {
    text: string;
    time: number;
}

/**
 * Dead-simple subtitle navigation using YouTube's player API.
 *
 * KEY FIX: Uses movie_player.seekTo() instead of raw video.currentTime.
 * YouTube's player API handles buffering, keyframe alignment, and internal
 * state synchronization — raw currentTime assignment bypasses all of that.
 *
 * Design: Computes current position fresh on every call (no stale React state).
 * Only tracks the last seek target to handle rapid clicks.
 */
export function useYouTubeNavigation(allCues: SubtitleCue[], history: HistoryItem[]) {
    const lastSeekTime = useRef(0);
    const lastSeekTarget = useRef<number | null>(null);

    const getTime = (): number => {
        const ct = getCurrentTime();
        // Trust the last seek target if we seeked very recently (< 1500ms) to support rapid clicks
        // even when YouTube player lagging/buffering makes current time temporarily stale.
        const isRecent = Date.now() - lastSeekTime.current < 1500;
        
        if (isRecent && lastSeekTarget.current !== null) {
            return lastSeekTarget.current;
        }
        return ct;
    };

    const doSeek = (targetTime: number) => {
        const safeTime = Math.max(0, targetTime);
        lastSeekTime.current = Date.now();
        lastSeekTarget.current = safeTime;
        seekViaPlayer(safeTime);
    };

    const seekPrev = useCallback(() => {
        const time = getTime();
        const cues = allCues.length > 0 ? allCues.map(c => c.start) : history.map(h => h.time);
        
        if (cues.length === 0) {
            doSeek(Math.max(0, time - 5));
            return;
        }

        // 1. Find the cue we are currently in (or just after)
        let currentIdx = -1;
        for (let i = cues.length - 1; i >= 0; i--) {
            if (cues[i] <= time + 0.1) {
                currentIdx = i;
                break;
            }
        }

        if (currentIdx !== -1) {
            const currentCueStart = cues[currentIdx];
            // If we are significantly deep into the current subtitle (> 1.0s),
            // seek to the beginning of this current subtitle first so they can re-read it.
            if (time - currentCueStart >= 1.0) {
                doSeek(currentCueStart);
                return;
            }
        }

        // 2. We want to go to a cue that is meaningfully earlier than the current one.
        // We skip any cues that are within 0.8s of the current one to avoid 
        // getting stuck on word fragments or duplicate history entries.
        let targetIdx = currentIdx - 1;
        while (targetIdx >= 0) {
            const gap = currentIdx >= 0 ? (cues[currentIdx] - cues[targetIdx]) : (time - cues[targetIdx]);
            if (gap >= 0.8) break;
            targetIdx--;
        }

        if (targetIdx < 0) {
            doSeek(0);
        } else {
            doSeek(cues[targetIdx]);
        }
    }, [allCues, history]);

    const seekNext = useCallback(() => {
        const time = getTime();
        const cues = allCues.length > 0 ? allCues.map(c => c.start) : history.map(h => h.time);

        if (cues.length === 0) {
            doSeek(time + 5);
            return;
        }

        // Find first cue that starts meaningfully after current time
        let targetTime = time + 5;
        for (let i = 0; i < cues.length; i++) {
            if (cues[i] > time + 0.8) {
                targetTime = cues[i];
                break;
            }
        }
        doSeek(targetTime);
    }, [allCues, history]);

    return { seekPrev, seekNext };
}

