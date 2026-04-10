import { useState, useEffect, useRef, useCallback } from 'react';
import type { SubtitleTrack, SubtitleCue, ActiveTrackCue, DetectedVideo } from '../types/subtitles';

function findActiveCue(cues: SubtitleCue[], time: number, offsetMs: number): SubtitleCue | null {
    const adjusted = time - offsetMs / 1000;
    let lo = 0;
    let hi = cues.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (cues[mid].end < adjusted) lo = mid + 1;
        else if (cues[mid].start > adjusted) hi = mid - 1;
        else return cues[mid];
    }
    return null;
}

function isRealVideo(el: HTMLElement): el is HTMLVideoElement {
    return el.tagName === 'VIDEO';
}

export function useVideoSync(video: DetectedVideo | null, tracks: SubtitleTrack[]) {
    const [activeCues, setActiveCues] = useState<ActiveTrackCue[]>([]);
    const [currentTime, setCurrentTime] = useState(0);
    const prevCueKeys = useRef('');

    // Manual timer for iframe-based videos (no currentTime access)
    const [isManualMode, setIsManualMode] = useState(false);
    const [manualPlaying, setManualPlaying] = useState(false);
    const manualStartRef = useRef(0); // wall-clock time when play started
    const manualOffsetRef = useRef(0); // subtitle time when play started

    const toggleManualPlay = useCallback(() => {
        if (manualPlaying) {
            // Pause — save current position
            const elapsed = (Date.now() - manualStartRef.current) / 1000;
            manualOffsetRef.current += elapsed;
            setManualPlaying(false);
        } else {
            // Play
            manualStartRef.current = Date.now();
            setManualPlaying(true);
        }
    }, [manualPlaying]);

    const seekManual = useCallback((time: number) => {
        manualOffsetRef.current = time;
        manualStartRef.current = Date.now();
        setCurrentTime(time);
    }, []);

    useEffect(() => {
        if (!video) {
            const id = setTimeout(() => { setActiveCues([]); setCurrentTime(0); }, 0);
            return () => clearTimeout(id);
        }

        const isReal = isRealVideo(video.element);
        // Defer mode setting to avoid direct setState in effect
        setTimeout(() => setIsManualMode(!isReal), 0);

        const sync = () => {
            let time: number;
            if (isReal) {
                time = video.element.currentTime;
            } else if (manualPlaying) {
                time = manualOffsetRef.current + (Date.now() - manualStartRef.current) / 1000;
            } else {
                time = manualOffsetRef.current;
            }

            setCurrentTime(time);

            const visibleTracks = tracks.filter(t => t.visible);
            const newCues: ActiveTrackCue[] = visibleTracks.map(track => ({
                track,
                cue: findActiveCue(track.cues, time, track.offsetMs),
            }));

            const key = newCues.map(c => `${c.track.id}:${c.cue?.start ?? 'null'}`).join('|');
            if (key !== prevCueKeys.current) {
                prevCueKeys.current = key;
                setActiveCues(newCues);
            }
        };

        const interval = setInterval(sync, 200);
        if (isReal) {
            video.element.addEventListener('seeked', sync);
        }

        return () => {
            clearInterval(interval);
            if (isReal) {
                video.element.removeEventListener('seeked', sync);
            }
        };
    }, [video, tracks, manualPlaying]);

    return { activeCues, currentTime, isManualMode, manualPlaying, toggleManualPlay, seekManual };
}
