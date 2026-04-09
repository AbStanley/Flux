import { useState, useCallback, useEffect } from 'react';
import type { DetectedVideo, ActiveTrackCue, SubtitleTrack } from '../../types/subtitles';
import type { FluxTheme } from '../../constants';
import { SubtitleTrackLine } from './SubtitleTrackLine';
import { SubtitleControlPanel } from './SubtitleControlPanel';
import { FileDropZone } from './FileDropZone';

interface Props {
    video: DetectedVideo;
    activeCues: ActiveTrackCue[];
    tracks: SubtitleTrack[];
    currentTime: number;
    targetLang: string;
    sourceLang: string;
    onTargetLangChange: (lang: string) => void;
    onSourceLangChange: (lang: string) => void;
    onAddFiles: (files: File[]) => void;
    onAddUrl: (url: string) => void;
    onRemoveTrack: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onSetOffset: (id: string, ms: number) => void;
    theme: FluxTheme;
    isManualMode?: boolean;
    manualPlaying?: boolean;
    onToggleManualPlay?: () => void;
    onManualSeek?: (time: number) => void;
}

function formatManualTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function UniversalSubtitleOverlay({
    video,
    activeCues,
    tracks,
    currentTime,
    targetLang,
    sourceLang,
    onTargetLangChange,
    onSourceLangChange,
    onAddFiles,
    onAddUrl,
    onRemoveTrack,
    onToggleVisibility,
    onSetOffset,
    theme,
    isManualMode,
    manualPlaying,
    onToggleManualPlay,
    onManualSeek,
}: Props) {
    const [showPanel, setShowPanel] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Detect fullscreen + move shadow host into fullscreen element
    useEffect(() => {
        const host = document.getElementById('flux-reader-host');
        if (!host) return;

        const onFsChange = () => {
            const fsEl = document.fullscreenElement;
            if (fsEl && (fsEl === video.element || fsEl.contains(video.element))) {
                // Move our shadow host inside the fullscreen element so it renders above
                fsEl.appendChild(host);
                setIsFullscreen(true);
            } else {
                // Move back to body
                if (host.parentElement !== document.body) {
                    document.body.appendChild(host);
                }
                setIsFullscreen(false);
            }
        };
        document.addEventListener('fullscreenchange', onFsChange);
        // Also check on mount
        onFsChange();
        return () => {
            document.removeEventListener('fullscreenchange', onFsChange);
            // Ensure host is back on body when component unmounts
            if (host.parentElement !== document.body) {
                document.body.appendChild(host);
            }
        };
    }, [video.element]);

    // In fullscreen, the video fills the screen
    const rect = isFullscreen
        ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, right: window.innerWidth, bottom: window.innerHeight }
        : video.rect;
    const hasAnyCue = activeCues.some(c => c.cue !== null);
    const videoDuration = video.element.duration || 0;

    const handleSeek = useCallback((time: number) => {
        if (isManualMode && onManualSeek) {
            onManualSeek(time);
        } else if (video.element.tagName === 'VIDEO') {
            // eslint-disable-next-line react-hooks/immutability
            (video.element as HTMLVideoElement).currentTime = time;
        }
    }, [video.element, isManualMode, onManualSeek]);
    const hasTracks = tracks.length > 0;

    const togglePanel = useCallback(() => setShowPanel(p => !p), []);

    return (
        <>
            {/* Subtitle lines — positioned at bottom of video */}
            <div
                style={{
                    position: 'fixed',
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                    pointerEvents: 'none',
                    zIndex: 2147483645,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    padding: '0 20px 24px',
                    boxSizing: 'border-box',
                }}
            >
                {/* No tracks yet — show drop zone inline */}
                {!hasTracks && (
                    <div style={{ pointerEvents: 'auto', width: '320px', marginBottom: '20px' }}>
                        <div style={{
                            backgroundColor: theme.bgSolid,
                            borderRadius: '16px',
                            padding: '16px',
                            border: `1px solid ${theme.border}`,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        }}>
                            <div style={{ color: theme.text, fontSize: '13px', fontWeight: 600, marginBottom: '8px', textAlign: 'center' }}>
                                Add Subtitles
                            </div>
                            <FileDropZone onFiles={onAddFiles} onUrl={onAddUrl} theme={theme} />
                        </div>
                    </div>
                )}

                {/* Active cue lines */}
                {hasAnyCue && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        pointerEvents: 'auto',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(8px)',
                        maxWidth: '90%',
                    }}>
                        {activeCues.filter(c => c.cue).map(({ track, cue }) => (
                            <SubtitleTrackLine
                                key={track.id}
                                cue={cue!}
                                color={track.color}
                                label={track.label}
                                targetLang={targetLang}
                                sourceLang={sourceLang}
                                onTargetLangChange={onTargetLangChange}
                                onSourceLangChange={onSourceLangChange}
                                theme={theme}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Manual mode play/seek controls — when video is in an iframe */}
            {isManualMode && hasTracks && (
                <div style={{
                    position: 'fixed',
                    top: rect.top + 12,
                    left: rect.left + 12,
                    zIndex: 2147483646,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    pointerEvents: 'auto',
                }}>
                    <button
                        onClick={onToggleManualPlay}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: manualPlaying ? theme.accent : 'rgba(0,0,0,0.5)',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(8px)',
                        }}
                        title={manualPlaying ? 'Pause subtitles' : 'Play subtitles'}
                    >
                        {manualPlaying ? '⏸' : '▶'}
                    </button>
                    <div style={{
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        color: 'white',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                    }}>
                        {formatManualTime(currentTime)}
                    </div>
                </div>
            )}

            {/* Gear button — fixed at top-right of video */}
            {hasTracks && (
                <button
                    onClick={togglePanel}
                    style={{
                        position: 'fixed',
                        top: rect.top + 12,
                        right: window.innerWidth - rect.right + 12,
                        zIndex: 2147483646,
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: showPanel ? theme.accent : 'rgba(0,0,0,0.5)',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        transition: 'all 0.2s',
                        backdropFilter: 'blur(8px)',
                    }}
                    title="Subtitle settings"
                >
                    ⚙
                </button>
            )}

            {/* Control panel */}
            {showPanel && (
                <div style={{
                    position: 'fixed',
                    top: rect.top + 50,
                    right: window.innerWidth - rect.right + 12,
                    zIndex: 2147483647,
                    width: '340px',
                }}>
                    <SubtitleControlPanel
                        tracks={tracks}
                        currentTime={currentTime}
                        videoDuration={videoDuration}
                        onAddFiles={onAddFiles}
                        onAddUrl={onAddUrl}
                        onRemoveTrack={onRemoveTrack}
                        onToggleVisibility={onToggleVisibility}
                        onSetOffset={onSetOffset}
                        onSeek={handleSeek}
                        onClose={() => setShowPanel(false)}
                        theme={theme}
                        isManualMode={isManualMode}
                        manualPlaying={manualPlaying}
                        onToggleManualPlay={onToggleManualPlay}
                    />
                </div>
            )}
        </>
    );
}
