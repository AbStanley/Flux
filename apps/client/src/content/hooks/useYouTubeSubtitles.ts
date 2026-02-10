import { useState, useEffect, useRef } from 'react';
import { YouTubeService, type SubtitleCue } from '../services/YouTubeService';

export const useYouTubeSubtitles = () => {
    const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null);
    const [isActive, setIsActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Detect YouTube page
    useEffect(() => {
        const checkPage = () => {
            const isWatchPage = YouTubeService.isYouTubeWatchPage();
            setIsActive(isWatchPage);
            if (!isWatchPage) {
                setCurrentCue(null);
            }
        };

        checkPage();

        // Listen for navigation (YouTube uses SPA navigation)
        window.addEventListener('popstate', checkPage);
        const originalPushState = window.history.pushState;
        window.history.pushState = function (...args) {
            originalPushState.apply(this, args);
            checkPage();
        };

        return () => {
            window.removeEventListener('popstate', checkPage);
            window.history.pushState = originalPushState;
        };
    }, []);

    // Sync with video and DOM subtitles
    useEffect(() => {
        if (!isActive) return;

        const findVideo = () => {
            const video = YouTubeService.getVideoElement();
            if (video) videoRef.current = video;
        };

        const pollSubtitles = () => {
            const domCue = YouTubeService.getSubtitleFromDom();
            setCurrentCue(prev => {
                if (prev?.text === domCue?.text) return prev;
                return domCue;
            });
        };

        const videoInterval = setInterval(findVideo, 1000);
        const subtitleInterval = setInterval(pollSubtitles, 200); // Poll frequently for responsiveness

        findVideo();
        pollSubtitles();

        return () => {
            clearInterval(videoInterval);
            clearInterval(subtitleInterval);
        };
    }, [isActive]);

    const pauseVideo = () => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
    };

    const playVideo = () => {
        if (videoRef.current) {
            videoRef.current.play();
        }
    };

    return {
        currentCue,
        isActive,
        pauseVideo,
        playVideo
    };
};
