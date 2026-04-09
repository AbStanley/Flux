import { useState, useEffect, useCallback, useRef } from 'react';
import type { DetectedVideo } from '../types/subtitles';
import { findAllVideos, refindVideo } from '../services/VideoDetector';

export function useVideoDetector() {
    const [isPicking, setIsPicking] = useState(false);
    const [scannedVideos, setScannedVideos] = useState<DetectedVideo[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<DetectedVideo | null>(null);
    const selectedElementRef = useRef<HTMLVideoElement | null>(null);

    /** User triggers a scan — enter pick mode */
    const startPicking = useCallback(() => {
        const videos = findAllVideos();
        setScannedVideos(videos);
        setIsPicking(true);

        // Auto-select if exactly one video
        if (videos.length === 1) {
            selectedElementRef.current = videos[0].element;
            setSelectedVideo(videos[0]);
            setIsPicking(false);
        }
    }, []);

    /** User picks a video from the overlay */
    const selectVideo = useCallback((video: DetectedVideo) => {
        selectedElementRef.current = video.element;
        setSelectedVideo(video);
        setIsPicking(false);
        setScannedVideos([]);
    }, []);

    /** Cancel picking */
    const cancelPicking = useCallback(() => {
        setIsPicking(false);
        setScannedVideos([]);
    }, []);

    /** Deselect the video */
    const deselectVideo = useCallback(() => {
        selectedElementRef.current = null;
        setSelectedVideo(null);
    }, []);

    // Keep selected video's rect in sync + re-find if element is removed
    useEffect(() => {
        if (!selectedElementRef.current) return;

        const updateRect = () => {
            const el = selectedElementRef.current;
            if (!el) return;

            // Check if element is still in the DOM
            if (!document.contains(el)) {
                // Try to re-find it (player may have recreated the element)
                const replacement = refindVideo(el);
                if (replacement) {
                    selectedElementRef.current = replacement;
                    const rect = replacement.getBoundingClientRect();
                    setSelectedVideo(prev => prev ? { ...prev, element: replacement, rect } : null);
                } else {
                    // Truly gone — don't deselect immediately, give it a few tries
                    return;
                }
            } else {
                const rect = el.getBoundingClientRect();
                setSelectedVideo(prev => {
                    if (!prev) return null;
                    // Only update if rect actually changed
                    if (prev.rect.left === rect.left && prev.rect.top === rect.top &&
                        prev.rect.width === rect.width && prev.rect.height === rect.height) return prev;
                    return { ...prev, rect };
                });
            }
        };

        // Poll rect + check existence
        const interval = setInterval(updateRect, 500);
        window.addEventListener('scroll', updateRect, true);
        window.addEventListener('resize', updateRect);
        document.addEventListener('fullscreenchange', updateRect);

        const ro = new ResizeObserver(updateRect);
        ro.observe(selectedElementRef.current);

        return () => {
            clearInterval(interval);
            window.removeEventListener('scroll', updateRect, true);
            window.removeEventListener('resize', updateRect);
            document.removeEventListener('fullscreenchange', updateRect);
            ro.disconnect();
        };
    }, [selectedVideo?.element]);  

    return {
        isPicking,
        scannedVideos,
        selectedVideo,
        startPicking,
        selectVideo,
        cancelPicking,
        deselectVideo,
    };
}
