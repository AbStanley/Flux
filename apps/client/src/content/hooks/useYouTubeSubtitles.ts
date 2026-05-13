import { useState, useEffect, useRef, useCallback } from 'react';
import { YouTubeService, type SubtitleCue } from '../services/YouTubeService';

export const useYouTubeSubtitles = (fluxEnabled: boolean = true) => {
    const [allCues, setAllCues] = useState<SubtitleCue[]>([]);
    const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const lastVideoId = useRef<string | null>(null);
    const lastSeekTime = useRef<number>(0);

    // Detect YouTube page and fetch global cues
    useEffect(() => {
        const checkPage = async () => {
            const isWatchPage = YouTubeService.isYouTubeWatchPage();
            setIsActive(isWatchPage);

            if (isWatchPage) {
                const videoId = YouTubeService.getVideoId();
                if (videoId && videoId !== lastVideoId.current) {
                    lastVideoId.current = videoId;
                    setAllCues([]); // Transcript support removed, rely on DOM fallback
                }
                if (fluxEnabled) {
                    YouTubeService.hideNativeSubtitles();
                } else {
                    YouTubeService.showNativeSubtitles();
                }
            } else {
                setCurrentCue(null);
                setAllCues([]);
                lastVideoId.current = null;
                YouTubeService.showNativeSubtitles();
            }
        };

        checkPage();

        const handleNavigateStart = () => {
            setIsActive(false);
            setCurrentCue(null);
            setAllCues([]);
            setHistory([]);
            lastVideoId.current = null;
        };

        window.addEventListener('popstate', checkPage);
        window.addEventListener('yt-navigate-finish', checkPage as EventListener);
        window.addEventListener('yt-navigate-start', handleNavigateStart as EventListener);

        const originalPushState = window.history.pushState;
        window.history.pushState = function (...args) {
            originalPushState.apply(this, args);
            checkPage();
        };

        return () => {
            window.removeEventListener('popstate', checkPage);
            window.removeEventListener('yt-navigate-finish', checkPage as EventListener);
            window.removeEventListener('yt-navigate-start', handleNavigateStart as EventListener);
            window.history.pushState = originalPushState;
            YouTubeService.showNativeSubtitles();
        };
    }, [allCues.length, fluxEnabled]);

    const [history, setHistory] = useState<string[]>([]);
    const lastCapturedText = useRef<string>('');

    // Sync currentCue with video time
    useEffect(() => {
        if (!isActive) return;

        const findVideo = () => {
            const video = YouTubeService.getVideoElement();
            if (video) videoRef.current = video;
        };

        const syncWithTime = () => {
            const video = videoRef.current;
            if (!video) return;

            // Transcript sync mode
            if (allCues.length > 0) {
                if (Date.now() - lastSeekTime.current < 400) {
                    return;
                }

                const time = video.currentTime;

                // If current index is valid and time still matches, keep it
                if (currentIndex >= 0 && currentIndex < allCues.length) {
                    const cue = allCues[currentIndex];
                    if (time >= cue.start && time <= (cue.start + cue.duration)) {
                        return;
                    }
                }

                const newIndex = allCues.findIndex(c => time >= c.start && time <= (c.start + c.duration));
                if (newIndex !== currentIndex) {
                    setCurrentIndex(newIndex);
                    const cue = newIndex >= 0 ? allCues[newIndex] : null;
                    setCurrentCue(cue);
                    
                    // Accumulate to history if not already there
                    if (cue && !history.includes(cue.text)) {
                        setHistory(prev => [...prev, cue.text]);
                    }
                }
            } else {
                // DOM sync mode (fallback)
                const domCue = YouTubeService.getSubtitleFromDom();
                if (domCue && domCue.text !== lastCapturedText.current) {
                    const newText = domCue.text;
                    const oldText = lastCapturedText.current;

                    // Improved stitching: only add if it's truly new or significantly different
                    let textToAdd = '';
                    if (!oldText || !newText.includes(oldText)) {
                        // If it's totally different or doesn't contain the old part, take it all
                        textToAdd = newText;
                    } else if (newText.length > oldText.length) {
                        // If it's an extension, take the new part
                        textToAdd = newText.slice(oldText.length).trim();
                    }

                    if (textToAdd) {
                        setHistory(prev => {
                            if (prev[prev.length - 1] === textToAdd) return prev;
                            const newHistory = [...prev, textToAdd];
                            
                            // Immediately update the UI cue with a smaller window (last 2 segments)
                            const windowSize = 2;
                            const windowText = newHistory.slice(-windowSize).join(' ');
                            setCurrentCue({ ...domCue, text: windowText });
                            
                            return newHistory;
                        });
                    }
                    
                    lastCapturedText.current = newText;
                }
            }
        };

        const vInterval = setInterval(findVideo, 1000);
        const sInterval = setInterval(syncWithTime, 200);

        return () => {
            clearInterval(vInterval);
            clearInterval(sInterval);
        };
    }, [isActive, allCues, currentIndex, history]);

    const seekPrev = useCallback(() => {
        if (allCues.length === 0) {
            // Fallback: no transcript, just rewind 5s
            const video = videoRef.current || YouTubeService.getVideoElement();
            if (video) {
                lastSeekTime.current = Date.now();
                YouTubeService.seekTo(Math.max(0, video.currentTime - 5));
            }
            return;
        }

        let targetIndex: number;
        if (currentIndex > 0) {
            targetIndex = currentIndex - 1;
        } else if (currentIndex === -1) {
            // In a gap — find the last cue that started before now
            const video = videoRef.current;
            const time = video?.currentTime ?? 0;
            targetIndex = -1;
            for (let i = allCues.length - 1; i >= 0; i--) {
                if (allCues[i].start < time) { targetIndex = i; break; }
            }
            if (targetIndex === -1) return; // Already before all cues
        } else {
            return; // Already at index 0
        }

        const cue = allCues[targetIndex];
        lastSeekTime.current = Date.now();
        YouTubeService.seekTo(cue.start);
        setCurrentIndex(targetIndex);
        setCurrentCue(cue);
    }, [currentIndex, allCues]);

    const seekNext = useCallback(() => {
        if (allCues.length === 0) {
            // Fallback: no transcript, just skip 5s
            const video = videoRef.current || YouTubeService.getVideoElement();
            if (video) {
                lastSeekTime.current = Date.now();
                YouTubeService.seekTo(video.currentTime + 5);
            }
            return;
        }

        let targetIndex: number;
        if (currentIndex >= 0 && currentIndex < allCues.length - 1) {
            targetIndex = currentIndex + 1;
        } else if (currentIndex === -1) {
            // In a gap — find the next cue that starts after now
            const video = videoRef.current;
            const time = video?.currentTime ?? 0;
            targetIndex = allCues.findIndex(c => c.start > time);
            if (targetIndex === -1) return; // Already past all cues
        } else {
            return; // Already at last cue
        }

        const cue = allCues[targetIndex];
        lastSeekTime.current = Date.now();
        YouTubeService.seekTo(cue.start);
        setCurrentIndex(targetIndex);
        setCurrentCue(cue);
    }, [currentIndex, allCues]);

    const pauseVideo = useCallback(() => videoRef.current?.pause(), []);
    const playVideo = useCallback(() => videoRef.current?.play(), []);
    const getIsPlaying = useCallback(() => {
        const video = videoRef.current || YouTubeService.getVideoElement();
        return video ? !video.paused : false;
    }, []);

    // If we have full cues, use index. If we are in fallback mode (DOM), always show arrows if active.
    const isFallbackMode = allCues.length === 0 && isActive;

    return {
        currentCue,
        history,
        clearHistory: () => setHistory([]),
        isActive,
        pauseVideo,
        playVideo,
        getIsPlaying,
        seekPrev,
        seekNext,
        hasPrev: (currentIndex > 0) || isFallbackMode,
        hasNext: (currentIndex < allCues.length - 1 && allCues.length > 0) || isFallbackMode
    };
};
