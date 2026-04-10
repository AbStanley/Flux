import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    const portalRef = useRef<HTMLDivElement | null>(null);

    // Fullscreen: create a portal container inside the fullscreen element
    useEffect(() => {
        const onFsChange = () => {
            const fsEl = document.fullscreenElement;
            const isVideoFs = !!fsEl && (fsEl === video.element || fsEl.contains(video.element));

            if (isVideoFs && fsEl) {
                // Create portal container inside fullscreen element
                if (!portalRef.current || !fsEl.contains(portalRef.current)) {
                    const div = document.createElement('div');
                    div.id = 'flux-subtitle-fs-portal';
                    div.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
                    fsEl.appendChild(div);
                    portalRef.current = div;
                }
                setIsFullscreen(true);
            } else {
                // Clean up portal
                if (portalRef.current) {
                    portalRef.current.remove();
                    portalRef.current = null;
                }
                setIsFullscreen(false);
            }
        };

        document.addEventListener('fullscreenchange', onFsChange);
        onFsChange();

        return () => {
            document.removeEventListener('fullscreenchange', onFsChange);
            if (portalRef.current) {
                portalRef.current.remove();
                portalRef.current = null;
            }
        };
    }, [video.element]);

    const rect = isFullscreen
        ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, right: window.innerWidth }
        : video.rect;

    const hasAnyCue = activeCues.some(c => c.cue !== null);
    const videoDuration = video.element.duration || 0;

    const handleSeek = useCallback((time: number) => {
        if (isManualMode && onManualSeek) {
            onManualSeek(time);
        } else if (video.element.tagName === 'VIDEO') {
            (video.element as HTMLVideoElement).currentTime = time; // eslint-disable-line react-hooks/immutability
        }
    }, [video.element, isManualMode, onManualSeek]);

    const hasTracks = tracks.length > 0;
    const togglePanel = useCallback(() => setShowPanel(p => !p), []);

    const overlayContent = (
        <>
            {/* Subtitle lines — positioned at bottom of video */}
            <div style={{
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
            }}>
                {!hasTracks && (
                    <div
                        onWheel={stopScroll}
                        style={{ pointerEvents: 'auto', width: '320px', marginBottom: '20px' }}
                    >
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

            {/* Manual mode controls */}
            {isManualMode && hasTracks && (
                <div style={{
                    position: 'fixed', top: rect.top + 12, left: rect.left + 12,
                    zIndex: 2147483646, display: 'flex', alignItems: 'center', gap: '6px', pointerEvents: 'auto',
                }}>
                    <button onClick={onToggleManualPlay} style={{
                        width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                        backgroundColor: manualPlaying ? theme.accent : 'rgba(0,0,0,0.5)',
                        color: 'white', cursor: 'pointer', fontSize: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)',
                    }} title={manualPlaying ? 'Pause subtitles' : 'Play subtitles'}>
                        {manualPlaying ? '⏸' : '▶'}
                    </button>
                    <div style={{
                        backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '8px',
                        padding: '4px 10px', color: 'white', fontSize: '12px', fontFamily: 'monospace',
                    }}>{formatManualTime(currentTime)}</div>
                </div>
            )}

            {/* Gear button */}
            {hasTracks && (
                <button onClick={togglePanel} style={{
                    position: 'fixed', top: rect.top + 12,
                    right: (isFullscreen ? 12 : window.innerWidth - (rect as DOMRect).right + 12),
                    zIndex: 2147483646, width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                    backgroundColor: showPanel ? theme.accent : 'rgba(0,0,0,0.5)',
                    color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', transition: 'all 0.2s', backdropFilter: 'blur(8px)', pointerEvents: 'auto',
                }} title="Subtitle settings">⚙</button>
            )}

            {/* Control panel */}
            {showPanel && (
                <div
                    onWheel={stopScroll}
                    style={{
                        position: 'fixed', top: rect.top + 50,
                        right: (isFullscreen ? 12 : window.innerWidth - (rect as DOMRect).right + 12),
                        zIndex: 2147483647, width: '340px', pointerEvents: 'auto',
                    }}
                >
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

    // In fullscreen, render via portal into the fullscreen element
    if (isFullscreen && portalRef.current) {
        return createPortal(overlayContent, portalRef.current);
    }

    return overlayContent;
}

function stopScroll(e: React.WheelEvent) {
    e.stopPropagation();
    // Also prevent the event from reaching the page
    e.nativeEvent.stopImmediatePropagation();
}
