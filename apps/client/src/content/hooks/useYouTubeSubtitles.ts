import { useState, useEffect, useRef, useCallback } from 'react';
import { YouTubeService, type SubtitleCue } from '../services/YouTubeService';
import {
    pauseViaPlayer, playViaPlayer,
    isPlaying as checkIsPlaying, getCurrentTime,
} from '../services/YouTubePlayerAPI';
import { useYouTubeCCState } from './useYouTubeCCState';
import { useYouTubeNavigation } from './useYouTubeNavigation';
import {
    isTextRedundant,
    findDisplayFromHistory, getDomSubtitle,
} from './useYouTubeSubtitleHelpers';
import { useYouTubeHistory } from './useYouTubeHistory';

export const useYouTubeSubtitles = (fluxEnabled: boolean = true) => {
    const [allCues, setAllCues] = useState<SubtitleCue[]>([]);
    const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null);
    const [prevCue, setPrevCue] = useState<SubtitleCue | null>(null);
    const [isWatchPage, setIsWatchPage] = useState(false);

    const lastVideoId = useRef<string | null>(null);
    const lastVideoTime = useRef(0);
    const lastSeekTime = useRef(0);

    const ccEnabled = useYouTubeCCState(isWatchPage);
    const isActive = isWatchPage && fluxEnabled && ccEnabled;
    
    const { history, clearHistory, addToHistory, updateHistoryFromDom } = useYouTubeHistory();
    const nav = useYouTubeNavigation(allCues, history);

    // Page detection + transcript fetch
    useEffect(() => {
        const checkPage = async () => {
            const onWatch = YouTubeService.isYouTubeWatchPage();
            setIsWatchPage(onWatch);

            if (!onWatch) {
                setAllCues([]);
                clearHistory();
                lastVideoId.current = null;
                return;
            }

            const videoId = YouTubeService.getVideoId();
            if (videoId && videoId !== lastVideoId.current) {
                lastVideoId.current = videoId;
                setAllCues([]);
                clearHistory();
                const cues = await YouTubeService.fetchTranscript(videoId);
                if (cues.length > 0) setAllCues(cues);
            }
        };

        checkPage();

        const onNavStart = () => {
            setIsWatchPage(false);
            setAllCues([]);
            clearHistory();
            lastVideoId.current = null;
        };

        window.addEventListener('popstate', checkPage);
        window.addEventListener('yt-navigate-finish', checkPage as EventListener);
        window.addEventListener('yt-navigate-start', onNavStart as EventListener);
        const interval = setInterval(checkPage, 2000);
        const origPush = window.history.pushState;
        window.history.pushState = function (...args) {
            origPush.apply(this, args);
            checkPage();
        };

        return () => {
            window.removeEventListener('popstate', checkPage);
            window.removeEventListener('yt-navigate-finish', checkPage as EventListener);
            window.removeEventListener('yt-navigate-start', onNavStart as EventListener);
            clearInterval(interval);
            window.history.pushState = origPush;
        };
    }, [clearHistory]);

    // Manage native subtitle visibility
    useEffect(() => {
        if (isActive) {
            YouTubeService.hideNativeSubtitles();
        } else {
            YouTubeService.showNativeSubtitles();
        }
    }, [isActive]);

    // Time sync loop
    useEffect(() => {
        if (!isActive) {
            setCurrentCue(null);
            setPrevCue(null);
            return;
        }

        const sync = () => {
            const time = getCurrentTime();
            const video = YouTubeService.getVideoElement();
            const isPlaying = video ? !video.paused : false;

            if (video) {
                const ct = video.currentTime;
                const jumped = Math.abs(ct - (lastVideoTime.current || ct)) > 1.5;
                lastVideoTime.current = ct;

                if (jumped) {
                    lastSeekTime.current = Date.now();
                }
            }

            const isJustSeeked = Date.now() - lastSeekTime.current < 1000;
            const shouldUpdate = isPlaying || isJustSeeked;

            if (allCues.length > 0) {
                syncTranscript(time, shouldUpdate);
            } else if (video) {
                syncDom(video, time, shouldUpdate);
            }
        };

        const interval = setInterval(sync, 250);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, allCues]);

    const syncTranscript = (time: number, shouldUpdateHistory: boolean) => {
        const activeCues = allCues.filter(
            c => time >= c.start && time <= c.start + c.duration + 0.5
        );

        if (activeCues.length > 0) {
            const combinedText = activeCues.map(c => c.text).join('\n');
            const mergedCue: SubtitleCue = {
                start: activeCues[0].start,
                duration: Math.max(...activeCues.map(c => c.start + c.duration)) - activeCues[0].start,
                text: combinedText
            };

            const firstIdx = allCues.indexOf(activeCues[0]);
            const pc = firstIdx > 0 ? allCues[firstIdx - 1] : null;
            const showPrev = pc && !isTextRedundant(pc.text, mergedCue.text) && (mergedCue.start - pc.start) < 10;
            
            setPrevCue(showPrev && pc ? pc : null);
            setCurrentCue(mergedCue);
            
            if (shouldUpdateHistory) {
                addToHistory(mergedCue.text, mergedCue.start);
            }
            return;
        }

        // Keep closest past cue visible if gap is small
        for (let i = allCues.length - 1; i >= 0; i--) {
            if (allCues[i].start <= time && time - (allCues[i].start + allCues[i].duration) < 5.0) {
                setCurrentCue(allCues[i]);
                return;
            }
        }
        setCurrentCue(null);
        setPrevCue(null);
    };

    const syncDom = (video: HTMLVideoElement, time: number, shouldUpdateHistory: boolean) => {
        const domCue = getDomSubtitle();
        const ct = video.currentTime;

        if (shouldUpdateHistory && domCue && domCue.text.trim()) {
            updateHistoryFromDom(domCue.text.trim(), ct);
        }

        const display = findDisplayFromHistory(history, time, domCue, ct);
        setCurrentCue(p => p?.text === display.current?.text ? p : display.current);
        setPrevCue(display.prev);
    };

    const pauseVideo = useCallback(() => pauseViaPlayer(), []);
    const playVideo = useCallback(() => playViaPlayer(), []);
    const getIsPlaying = useCallback(() => checkIsPlaying(), []);

    const isFallback = allCues.length === 0 && isActive;

    return {
        currentCue, prevCue,
        history: history.map(h => h.text),
        clearHistory,
        isActive,
        pauseVideo, playVideo, getIsPlaying,
        seekPrev: nav.seekPrev,
        seekNext: nav.seekNext,
        hasPrev: isFallback || allCues.length > 0,
        hasNext: isFallback || allCues.length > 0,
    };
};
