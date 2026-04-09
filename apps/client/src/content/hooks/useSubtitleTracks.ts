import { useState, useCallback } from 'react';
import type { SubtitleTrack } from '../types/subtitles';
import { parseSubtitleFile, labelFromFileName } from '../services/SubtitleParser';
import { TRACK_COLORS } from '../constants';

export function useSubtitleTracks() {
    const [tracks, setTracks] = useState<SubtitleTrack[]>([]);

    const nextColor = useCallback((existing: SubtitleTrack[]) => {
        const used = new Set(existing.map(t => t.color));
        return TRACK_COLORS.find(c => !used.has(c)) || TRACK_COLORS[existing.length % TRACK_COLORS.length];
    }, []);

    const addTrackFromFile = useCallback(async (file: File) => {
        const text = await file.text();
        const cues = parseSubtitleFile(text);
        if (cues.length === 0) return;

        setTracks(prev => {
            const track: SubtitleTrack = {
                id: crypto.randomUUID(),
                label: labelFromFileName(file.name),
                cues,
                color: nextColor(prev),
                visible: true,
                offsetMs: 0,
                source: { type: 'file', fileName: file.name },
            };
            return [...prev, track];
        });
    }, [nextColor]);

    const addTrackFromUrl = useCallback(async (url: string) => {
        try {
            // Fetch through background proxy to bypass CORS
            let text: string;
            if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
                const response = await chrome.runtime.sendMessage({
                    type: 'PROXY_REQUEST',
                    url,
                    method: 'GET',
                });
                text = response?.data || response?.text || '';
            } else {
                const res = await fetch(url);
                text = await res.text();
            }

            const cues = parseSubtitleFile(text);
            if (cues.length === 0) return;

            const fileName = url.split('/').pop()?.split('?')[0] || 'remote';
            setTracks(prev => {
                const track: SubtitleTrack = {
                    id: crypto.randomUUID(),
                    label: labelFromFileName(fileName),
                    cues,
                    color: nextColor(prev),
                    visible: true,
                    offsetMs: 0,
                    source: { type: 'url', url },
                };
                return [...prev, track];
            });
        } catch (err) {
            console.error('[Flux Subs] Failed to load subtitle from URL:', err);
        }
    }, [nextColor]);

    const addFiles = useCallback(async (files: File[]) => {
        for (const file of files) {
            const ext = file.name.toLowerCase().split('.').pop();
            if (ext === 'srt' || ext === 'vtt') {
                await addTrackFromFile(file);
            }
        }
    }, [addTrackFromFile]);

    const removeTrack = useCallback((id: string) => {
        setTracks(prev => prev.filter(t => t.id !== id));
    }, []);

    const toggleVisibility = useCallback((id: string) => {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, visible: !t.visible } : t));
    }, []);

    const setOffset = useCallback((id: string, ms: number) => {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, offsetMs: ms } : t));
    }, []);

    const setColor = useCallback((id: string, color: string) => {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, color } : t));
    }, []);

    const setLabel = useCallback((id: string, label: string) => {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, label } : t));
    }, []);

    return {
        tracks,
        addFiles,
        addTrackFromUrl,
        removeTrack,
        toggleVisibility,
        setOffset,
        setColor,
        setLabel,
    };
}
