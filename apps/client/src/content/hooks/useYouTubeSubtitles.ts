import { useState, useEffect, useRef, useCallback } from 'react';
import { YouTubeService, type SubtitleCue } from '../services/YouTubeService';

interface HistoryItem {
    text: string;
    time: number;
}

export const useYouTubeSubtitles = (fluxEnabled: boolean = true) => {
    const [allCues, setAllCues] = useState<SubtitleCue[]>([]);
    const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [currentHistoryIdx, setCurrentHistoryIdx] = useState(-1);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const lastVideoId = useRef<string | null>(null);
    const lastSeekTime = useRef<number>(0);
    const targetSeekTime = useRef<number | null>(null);
    const lastCapturedText = useRef<string>('');
    const lastHistoryText = useRef<string>('');
    const lastVideoTime = useRef<number>(0);
    const wasSeek = useRef<boolean>(false);
    const CAPTURE_OFFSET = 1.3; // Offset to account for YouTube DOM rendering lag

    // Detect YouTube page and fetch global cues
    useEffect(() => {
        const checkPage = async () => {
            const isWatchPage = YouTubeService.isYouTubeWatchPage();
            setIsActive(isWatchPage);

            if (isWatchPage) {
                const videoId = YouTubeService.getVideoId();
                if (videoId && videoId !== lastVideoId.current) {
                    lastVideoId.current = videoId;
                    setAllCues([]); 
                    setHistory([]);
                    lastCapturedText.current = '';
                    lastHistoryText.current = '';
                }
                if (fluxEnabled) {
                    YouTubeService.hideNativeSubtitles();
                } else {
                    YouTubeService.showNativeSubtitles();
                }
            } else {
                setIsActive(false);
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
    }, [fluxEnabled]);

    // Sync currentCue with video time
    useEffect(() => {
        if (!isActive) return;

        const syncWithTime = () => {
            const video = videoRef.current || YouTubeService.getVideoElement();
            if (video) videoRef.current = video;
            if (!video) return;

            const time = video.currentTime;

            // 1. Transcript sync mode (Pre-defined cues)
            if (allCues.length > 0) {
                if (Date.now() - lastSeekTime.current < 500) return;

                setCurrentIndex(prevIdx => {
                    if (prevIdx >= 0 && prevIdx < allCues.length) {
                        const cue = allCues[prevIdx];
                        if (time >= cue.start && time <= (cue.start + cue.duration)) return prevIdx;
                    }

                    const newIdx = allCues.findIndex(c => time >= c.start && time <= (c.start + c.duration));
                    if (newIdx !== prevIdx) {
                        if (newIdx >= 0) {
                            const cue = allCues[newIdx];
                            // For transcript mode, we can show context from previous cues
                            const prevCue = newIdx > 0 ? allCues[newIdx - 1] : null;
                            const textLines = [cue.text];
                            if (prevCue) {
                                const normPrev = prevCue.text.replace(/[.,!?¿¡\n]/g, '').toLowerCase().trim();
                                const normCurr = cue.text.replace(/[.,!?¿¡\n]/g, '').toLowerCase().trim();
                                const isRedundant = normCurr.includes(normPrev) || normPrev.includes(normCurr);
                                if (!isRedundant) {
                                    textLines.unshift(prevCue.text);
                                }
                            }
                            const text = textLines.join('\n');
                            setCurrentCue({ ...cue, text });
                            
                            if (lastHistoryText.current !== cue.text) {
                                setHistory(h => [...h, { text: cue.text, time: cue.start }]);
                                lastHistoryText.current = cue.text;
                            }
                        } else {
                            setCurrentCue(null);
                        }
                        return newIdx;
                    }
                    return prevIdx;
                });
            } else {
                // 2. DOM sync mode (Fallback / Autogenerated)
                const domCue = YouTubeService.getSubtitleFromDom();
                
                const currentTime = video.currentTime;
                const isSeek = Math.abs(currentTime - (lastVideoTime.current || currentTime)) > 1.5;
                lastVideoTime.current = currentTime;

                if (isSeek) {
                    wasSeek.current = true;
                    if (domCue) {
                        lastCapturedText.current = domCue.text;
                    }
                }

                if (domCue && domCue.text !== lastCapturedText.current) {
                    const newText = domCue.text;
                    const oldText = lastCapturedText.current;

                    let textToAdd = '';
                    let isExtension = false;

                    if (wasSeek.current) {
                        textToAdd = newText;
                        isExtension = false;
                        wasSeek.current = false;
                    } else if (oldText && newText.startsWith(oldText)) {
                        textToAdd = newText.slice(oldText.length).trim();
                        isExtension = true;
                    } else if (oldText && oldText.includes(newText)) {
                        isExtension = true;
                        textToAdd = '';
                    } else if (oldText) {
                        const wordsOld = oldText.split(/\s+/);
                        const wordsNew = newText.split(/\s+/);
                        let overlapWords = 0;
                        for (let n = Math.min(wordsOld.length, wordsNew.length); n > 0; n--) {
                            if (wordsOld.slice(-n).join(' ') === wordsNew.slice(0, n).join(' ')) {
                                overlapWords = n;
                                break;
                            }
                        }
                        if (overlapWords > 0) {
                            textToAdd = wordsNew.slice(overlapWords).join(' ').trim();
                            isExtension = true;
                        } else {
                            textToAdd = newText;
                            isExtension = false;
                        }
                    } else {
                        textToAdd = newText;
                        isExtension = false;
                    }

                    if (textToAdd || (isExtension && !textToAdd)) {
                        setHistory(prev => {
                            let newHistory = [...prev];
                            
                            const latestRecordedTime = newHistory.length > 0 ? newHistory[newHistory.length - 1].time + CAPTURE_OFFSET : 0;
                            if (newHistory.length > 0 && currentTime < latestRecordedTime - 1.5) {
                                return newHistory; // User requested to ONLY build history at the frontier.
                            }
                            
                            let activeIdx = -1;
                            for (let i = newHistory.length - 1; i >= 0; i--) {
                                if (newHistory[i].time <= currentTime + 1.0) {
                                    activeIdx = i;
                                    break;
                                }
                            }

                            if (isExtension && activeIdx >= 0) {
                                const activeEntry = newHistory[activeIdx];
                                const isClosed = /[.!?]$/.test(activeEntry.text.trim()) || activeEntry.text.length > 75;
                                if (!isClosed) {
                                    if (textToAdd && !activeEntry.text.includes(textToAdd)) {
                                        newHistory[activeIdx] = { ...activeEntry, text: (activeEntry.text + ' ' + textToAdd).trim() };
                                    }
                                } else if (textToAdd && !activeEntry.text.includes(textToAdd)) {
                                    newHistory.push({ text: textToAdd, time: currentTime - CAPTURE_OFFSET });
                                }
                            } else if (textToAdd) {
                                const duplicateIdx = newHistory.findIndex(h => {
                                    if (Math.abs(h.time - currentTime) >= 5.0) return false;
                                    const normH = h.text.replace(/[.,!?¿¡]/g, '').toLowerCase().trim();
                                    const normT = textToAdd.replace(/[.,!?¿¡]/g, '').toLowerCase().trim();
                                    return normH === normT || (normH.length > 10 && normH.includes(normT)) || (normT.length > 10 && normT.includes(normH));
                                });
                                if (duplicateIdx !== -1) {
                                    if (textToAdd.length > newHistory[duplicateIdx].text.length) {
                                        newHistory[duplicateIdx] = { ...newHistory[duplicateIdx], text: textToAdd };
                                    }
                                } else {
                                    if (activeIdx >= 0) {
                                        const activeEntry = newHistory[activeIdx];
                                        const isClosed = /[.!?]$/.test(activeEntry.text.trim()) || activeEntry.text.length > 75;
                                        if (!isClosed && Math.abs(currentTime - activeEntry.time) < 10.0) {
                                            if (!activeEntry.text.includes(textToAdd)) {
                                                newHistory[activeIdx] = { ...activeEntry, text: (activeEntry.text + ' ' + textToAdd).trim() };
                                            }
                                        } else {
                                            newHistory.push({ text: textToAdd, time: currentTime - CAPTURE_OFFSET });
                                        }
                                    } else {
                                        newHistory.push({ text: textToAdd, time: currentTime - CAPTURE_OFFSET });
                                    }
                                }
                            }
                            
                            newHistory.sort((a, b) => a.time - b.time);
                            if (newHistory.length > 1000) newHistory = newHistory.slice(-1000);
                            return newHistory;
                        });
                    }
                    lastCapturedText.current = newText;
                }

                // Update Display based on current time (Sync with History)
                setHistory(currentHistory => {
                    if (currentHistory.length === 0) return currentHistory;

                    let bestIdx = -1;
                    for (let i = currentHistory.length - 1; i >= 0; i--) {
                        if (currentHistory[i].time <= time + 0.2) {
                            bestIdx = i;
                            break;
                        }
                    }

                    if (bestIdx !== -1) {
                        const item = currentHistory[bestIdx];
                        const prevItem = bestIdx > 0 ? currentHistory[bestIdx - 1] : null;
                        
                        const textLines = [item.text];
                        if (prevItem && (item.time - prevItem.time < 30)) {
                            const normPrev = prevItem.text.replace(/[.,!?¿¡\n]/g, '').toLowerCase().trim();
                            const normCurr = item.text.replace(/[.,!?¿¡\n]/g, '').toLowerCase().trim();
                            const isRedundant = normCurr.includes(normPrev) || normPrev.includes(normCurr);
                            if (!isRedundant) {
                                textLines.unshift(prevItem.text);
                            }
                        }
                        const text = textLines.join('\n');
                        
                        setCurrentCue(prev => {
                            if (prev?.text === text) return prev;
                            return { start: item.time, duration: 0, text };
                        });
                        setCurrentHistoryIdx(prev => prev !== bestIdx ? bestIdx : prev);
                    } else {
                        setCurrentCue(null);
                        setCurrentHistoryIdx(prev => prev !== -1 ? -1 : prev);
                    }
                    return currentHistory;
                });
            }
        };

        const sInterval = setInterval(syncWithTime, 200);
        return () => clearInterval(sInterval);
    }, [isActive, allCues]);

    const seekPrev = useCallback(() => {
        const video = videoRef.current || YouTubeService.getVideoElement();
        if (!video) return;
        
        // Prevent getting stuck if video is paused or buffering
        const isFastClick = Date.now() - lastSeekTime.current < 800;
        const time = (targetSeekTime.current !== null && (isFastClick || Math.abs(video.currentTime - targetSeekTime.current) < 0.5)) 
            ? targetSeekTime.current 
            : video.currentTime;

        if (allCues.length === 0) {
            if (history.length === 0) return;
            let currentIdx = -1;
            for (let i = history.length - 1; i >= 0; i--) {
                if (history[i].time <= time + 0.1) {
                    currentIdx = i;
                    break;
                }
            }
            
            let targetTime = 0;
            if (currentIdx >= 0 && (time - history[currentIdx].time) > 1.5) {
                targetTime = history[currentIdx].time;
            } else {
                const targetIdx = (currentIdx <= 0) ? 0 : currentIdx - 1;
                targetTime = history[targetIdx].time;
            }
            
            lastSeekTime.current = Date.now();
            targetSeekTime.current = targetTime;
            lastVideoTime.current = targetTime;
            YouTubeService.seekTo(targetTime);
            video.pause();
            return;
        }

        const currentCue = currentIndex >= 0 ? allCues[currentIndex] : null;
        let targetIndex: number;
        if (currentCue && (time - currentCue.start) > 1.0) {
            targetIndex = currentIndex;
        } else if (currentIndex > 0) {
            targetIndex = currentIndex - 1;
        } else {
            return;
        }
        lastSeekTime.current = Date.now();
        targetSeekTime.current = allCues[targetIndex].start;
        YouTubeService.seekTo(allCues[targetIndex].start);
        video.pause();
    }, [currentIndex, allCues, history]);

    const seekNext = useCallback(() => {
        const video = videoRef.current || YouTubeService.getVideoElement();
        if (!video) return;
        
        const isFastClick = Date.now() - lastSeekTime.current < 800;
        const time = (targetSeekTime.current !== null && (isFastClick || Math.abs(video.currentTime - targetSeekTime.current) < 0.5)) 
            ? targetSeekTime.current 
            : video.currentTime;

        if (allCues.length === 0) {
            if (history.length === 0) return;
            let currentIdx = -1;
            for (let i = history.length - 1; i >= 0; i--) {
                if (history[i].time <= time + 0.1) {
                    currentIdx = i;
                    break;
                }
            }
            const targetIdx = currentIdx + 1;
            if (targetIdx < history.length) {
                const targetTime = history[targetIdx].time;
                lastSeekTime.current = Date.now();
                targetSeekTime.current = targetTime;
                lastVideoTime.current = targetTime;
                YouTubeService.seekTo(targetTime);
                video.pause();
            }
            return;
        }

        if (currentIndex >= 0 && currentIndex < allCues.length - 1) {
            const cue = allCues[currentIndex + 1];
            lastSeekTime.current = Date.now();
            targetSeekTime.current = cue.start;
            YouTubeService.seekTo(cue.start);
            video.pause();
        }
    }, [currentIndex, allCues, history]);

    const pauseVideo = useCallback(() => videoRef.current?.pause(), []);
    const playVideo = useCallback(() => videoRef.current?.play(), []);
    const getIsPlaying = useCallback(() => {
        const video = videoRef.current || YouTubeService.getVideoElement();
        return video ? !video.paused : false;
    }, []);

    const isFallbackMode = allCues.length === 0 && isActive;

    return {
        currentCue,
        history: history.map(h => h.text),
        clearHistory: () => { setHistory([]); lastHistoryText.current = ''; },
        isActive,
        pauseVideo,
        playVideo,
        getIsPlaying,
        seekPrev,
        seekNext,
        hasPrev: (currentIndex > 0) || (isFallbackMode && currentHistoryIdx > 0),
        hasNext: (currentIndex < allCues.length - 1 && allCues.length > 0) || (isFallbackMode && currentHistoryIdx >= 0 && currentHistoryIdx < history.length - 1)
    };
};
