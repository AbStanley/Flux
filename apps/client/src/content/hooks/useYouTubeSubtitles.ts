import { useState, useEffect, useRef, useCallback } from 'react';
import { YouTubeService, type SubtitleCue } from '../services/YouTubeService';

export const useYouTubeSubtitles = () => {
    const [allCues, setAllCues] = useState<SubtitleCue[]>([]);
    const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const lastVideoId = useRef<string | null>(null);

    // Detect YouTube page and fetch global cues
    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 3;

        const checkPage = async () => {
            const isWatchPage = YouTubeService.isYouTubeWatchPage();
            setIsActive(isWatchPage);

            if (isWatchPage) {
                const videoId = YouTubeService.getVideoId();
                if (videoId && (videoId !== lastVideoId.current || allCues.length === 0)) {
                    lastVideoId.current = videoId;
                    console.log(`[Flux] Fetching subtitles for video: ${videoId}`);
                    const fetchedCues = await YouTubeService.getSubtitles();

                    if (fetchedCues.length > 0) {
                        setAllCues(fetchedCues);
                        retryCount = 0;
                    } else if (retryCount < maxRetries) {
                        retryCount++;
                        console.log(`[Flux] No subtitles found, retrying... (${retryCount}/${maxRetries})`);
                        setTimeout(checkPage, 2000);
                    }
                }
                YouTubeService.hideNativeSubtitles();
            } else {
                setCurrentCue(null);
                setAllCues([]);
                lastVideoId.current = null;
                YouTubeService.showNativeSubtitles();
            }
        };

        checkPage();

        window.addEventListener('popstate', checkPage);
        const originalPushState = window.history.pushState;
        window.history.pushState = function (...args) {
            originalPushState.apply(this, args);
            checkPage();
        };

        return () => {
            window.removeEventListener('popstate', checkPage);
            window.history.pushState = originalPushState;
            YouTubeService.showNativeSubtitles();
        };
    }, [allCues.length]);

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

            // If we have full transcript cues, sync by time
            if (allCues.length > 0) {
                const time = video.currentTime;

                // Check current index
                if (currentIndex >= 0 && currentIndex < allCues.length) {
                    const cue = allCues[currentIndex];
                    if (time >= cue.start && time <= (cue.start + cue.duration)) {
                        return;
                    }
                }

                const newIndex = allCues.findIndex(c => time >= c.start && time <= (c.start + c.duration));
                if (newIndex !== currentIndex) {
                    setCurrentIndex(newIndex);
                    setCurrentCue(newIndex >= 0 ? allCues[newIndex] : null);
                }
            } else {
                // Fallback: use DOM if transcript fetch failed or still loading
                const domCue = YouTubeService.getSubtitleFromDom();
                if (domCue && domCue.text !== currentCue?.text) {
                    console.log('[Flux] Using DOM subtitle fallback');
                    setCurrentCue(domCue);
                }
            }
        };

        const videoInterval = setInterval(findVideo, 1000);
        const syncInterval = setInterval(syncWithTime, 200);

        return () => {
            clearInterval(videoInterval);
            clearInterval(syncInterval);
        };
    }, [isActive, allCues, currentIndex, currentCue?.text]);

    const seekPrev = useCallback(() => {
        if (currentIndex > 0) {
            const prevCue = allCues[currentIndex - 1];
            YouTubeService.seekTo(prevCue.start);
        } else if (allCues.length === 0) {
            const video = videoRef.current || YouTubeService.getVideoElement();
            if (video) YouTubeService.seekTo(Math.max(0, video.currentTime - 5));
        }
    }, [currentIndex, allCues]);

    const seekNext = useCallback(() => {
        if (currentIndex >= 0 && currentIndex < allCues.length - 1) {
            const nextCue = allCues[currentIndex + 1];
            YouTubeService.seekTo(nextCue.start);
        } else if (allCues.length === 0) {
            const video = videoRef.current || YouTubeService.getVideoElement();
            if (video) YouTubeService.seekTo(video.currentTime + 5);
        } else if (currentIndex === -1 && allCues.length > 0) {
            // If no cue active, find the next one based on current time
            const video = videoRef.current;
            if (video) {
                const next = allCues.find(c => c.start > video.currentTime);
                if (next) YouTubeService.seekTo(next.start);
            }
        }
    }, [currentIndex, allCues]);

    const pauseVideo = useCallback(() => videoRef.current?.pause(), []);
    const playVideo = useCallback(() => videoRef.current?.play(), []);

    // If we have full cues, use index. If we are in fallback mode (DOM), always show arrows if active.
    const isFallbackMode = allCues.length === 0 && isActive;

    return {
        currentCue,
        isActive,
        pauseVideo,
        playVideo,
        seekPrev,
        seekNext,
        hasPrev: (currentIndex > 0) || isFallbackMode,
        hasNext: (currentIndex < allCues.length - 1 && allCues.length > 0) || isFallbackMode
    };
};
