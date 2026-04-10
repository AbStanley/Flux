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

/** Seek a video element by querying the DOM (avoids mutating the prop directly). */
function seekVideo(el: HTMLElement, time: number) {
    if (el.tagName === 'VIDEO') {
        (el as HTMLVideoElement).currentTime = time;
    }
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
    const [fluxFs, setFluxFs] = useState(false);
    const [nativeFs, setNativeFs] = useState(false);

    // Portal targets stored as state so they're readable during render
    const [fluxFsEl, setFluxFsEl] = useState<HTMLDivElement | null>(null);
    const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);

    // Internal refs for cleanup (only accessed in effects/callbacks, never during render)
    const fluxFsRef = useRef<HTMLDivElement | null>(null);
    const portalDivRef = useRef<HTMLDivElement | null>(null);
    const videoElRef = useRef(video.element);
    const placeholderRef = useRef<Comment | null>(null);
    const origStyleRef = useRef('');

    // Keep video ref in sync via effect
    useEffect(() => { videoElRef.current = video.element; }, [video.element]);

    const isFullscreen = fluxFs || nativeFs;

    // ── Custom fullscreen ──
    // Move the actual video element into our container (not clone — cloning
    // fails for MSE/blob sources). A placeholder comment keeps the original
    // DOM position so we can restore it on exit.
    const enterFluxFs = useCallback(() => {
        if (fluxFsRef.current) return;

        const el = videoElRef.current;

        // Save original position with a placeholder
        const placeholder = document.createComment('flux-fs-placeholder');
        el.parentNode?.insertBefore(placeholder, el);
        placeholderRef.current = placeholder;

        // Save original inline style so we can restore it
        origStyleRef.current = el.getAttribute('style') || '';

        // Create fullscreen wrapper
        const container = document.createElement('div');
        container.id = 'flux-fs-container';
        container.style.cssText = [
            'position:fixed', 'inset:0', 'z-index:2147483647',
            'background:#000', 'display:flex', 'align-items:center',
            'justify-content:center',
        ].join(';');
        document.documentElement.appendChild(container);
        fluxFsRef.current = container;

        // Move the video into our container
        container.appendChild(el);
        el.style.cssText = 'width:100%;height:100%;object-fit:contain;';

        setFluxFsEl(container);
        setFluxFs(true);

        // Try real fullscreen as enhancement (may fail in extensions)
        container.requestFullscreen?.().catch(() => {});
    }, []);

    const exitFluxFs = useCallback(() => {
        const container = fluxFsRef.current;
        if (!container) return;

        const el = videoElRef.current;
        const placeholder = placeholderRef.current;

        // Move video back to its original position
        if (placeholder?.parentNode) {
            placeholder.parentNode.insertBefore(el, placeholder);
            placeholder.remove();
        }
        placeholderRef.current = null;

        // Restore original style
        if (origStyleRef.current) {
            el.setAttribute('style', origStyleRef.current);
        } else {
            el.removeAttribute('style');
        }
        origStyleRef.current = '';

        if (document.fullscreenElement === container) {
            document.exitFullscreen().catch(() => {});
        }

        container.remove();
        fluxFsRef.current = null;
        setFluxFsEl(null);
        setFluxFs(false);
    }, []);

    // ── Native fullscreen detection ──
    useEffect(() => {
        const getFullscreenEl = (): Element | null =>
            document.fullscreenElement
            ?? (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
            ?? null;

        const onFsChange = () => {
            const fsEl = getFullscreenEl();

            if (fsEl === fluxFsRef.current) return;

            if (!fsEl && fluxFsRef.current) {
                exitFluxFs();
                return;
            }

            if (!fsEl) {
                if (portalDivRef.current) { portalDivRef.current.remove(); portalDivRef.current = null; }
                setPortalEl(null);
                setNativeFs(false);
                return;
            }

            const isVideoFs = fsEl === video.element || fsEl.contains(video.element);
            if (isVideoFs) {
                if (!portalDivRef.current || !fsEl.contains(portalDivRef.current)) {
                    const div = document.createElement('div');
                    div.id = 'flux-subtitle-fs-portal';
                    div.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
                    fsEl.appendChild(div);
                    portalDivRef.current = div;
                    setPortalEl(div);
                }
                setNativeFs(true);
            }
        };

        document.addEventListener('fullscreenchange', onFsChange);
        document.addEventListener('webkitfullscreenchange', onFsChange);

        return () => {
            document.removeEventListener('fullscreenchange', onFsChange);
            document.removeEventListener('webkitfullscreenchange', onFsChange);
            if (portalDivRef.current) { portalDivRef.current.remove(); portalDivRef.current = null; }
            setPortalEl(null);
        };
    }, [video.element, exitFluxFs]);

    // Clean up on unmount
    useEffect(() => () => {
        if (fluxFsRef.current) { fluxFsRef.current.remove(); fluxFsRef.current = null; }
    }, []);

    // ESC exits custom fullscreen
    useEffect(() => {
        if (!fluxFs) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') exitFluxFs(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [fluxFs, exitFluxFs]);

    const toggleFullscreen = useCallback(() => {
        if (fluxFs) exitFluxFs();
        else enterFluxFs();
    }, [fluxFs, enterFluxFs, exitFluxFs]);

    // ── Layout ──
    const rect = isFullscreen
        ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight, right: window.innerWidth }
        : video.rect;

    const visibleCueCount = activeCues.filter(c => c.cue !== null).length;
    const hasAnyCue = visibleCueCount > 0;
    const videoDuration = video.element.duration || 0;
    const subFontSize = visibleCueCount <= 2 ? 22 : visibleCueCount === 3 ? 18 : 15;

    const handleSeek = useCallback((time: number) => {
        if (isManualMode && onManualSeek) {
            onManualSeek(time);
        } else {
            seekVideo(videoElRef.current, time);
        }
    }, [isManualMode, onManualSeek]);

    const hasTracks = tracks.length > 0;
    const togglePanel = useCallback(() => setShowPanel(p => !p), []);

    const pos: 'fixed' | 'absolute' = fluxFs ? 'absolute' : 'fixed';
    const rightOffset = isFullscreen ? 12 : window.innerWidth - (rect as DOMRect).right + 12;

    const overlayContent = (
        <>
            {/* Subtitle lines — bottom of video */}
            <div style={{
                position: pos,
                left: fluxFs ? 0 : rect.left,
                top: fluxFs ? 0 : rect.top,
                width: fluxFs ? '100%' : rect.width,
                height: fluxFs ? '100%' : rect.height,
                pointerEvents: 'none',
                zIndex: 2147483645,
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center',
                padding: '0 20px 24px', boxSizing: 'border-box',
            }}>
                {!hasTracks && (
                    <div onWheel={stopScroll} style={{ pointerEvents: 'auto', width: '320px', marginBottom: '20px' }}>
                        <div style={{
                            backgroundColor: theme.bgSolid, borderRadius: '16px', padding: '16px',
                            border: `1px solid ${theme.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
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
                        display: 'flex', flexDirection: 'column', gap: '4px', pointerEvents: 'auto',
                        padding: '8px 16px', borderRadius: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)',
                        maxWidth: '90%', flexShrink: 0,
                    }}>
                        {activeCues.filter(c => c.cue).map(({ track, cue }) => (
                            <SubtitleTrackLine
                                key={track.id} cue={cue!} color={track.color} label={track.label}
                                targetLang={targetLang} sourceLang={sourceLang}
                                onTargetLangChange={onTargetLangChange} onSourceLangChange={onSourceLangChange}
                                theme={theme} fontSize={subFontSize}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Manual mode controls */}
            {isManualMode && hasTracks && (
                <div style={{
                    position: pos, top: fluxFs ? 12 : rect.top + 12, left: fluxFs ? 12 : rect.left + 12,
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

            {/* Top-right buttons */}
            {hasTracks && (
                <div style={{
                    position: pos, top: fluxFs ? 12 : rect.top + 12, right: rightOffset,
                    zIndex: 2147483646, display: 'flex', gap: '6px', pointerEvents: 'auto',
                }}>
                    <button onClick={toggleFullscreen} style={{
                        width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                        backgroundColor: isFullscreen ? theme.accent : 'rgba(0,0,0,0.5)',
                        color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', transition: 'all 0.2s', backdropFilter: 'blur(8px)',
                    }} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen with subtitles'}>
                        {isFullscreen ? '✕' : '⛶'}
                    </button>
                    <button onClick={togglePanel} style={{
                        width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                        backgroundColor: showPanel ? theme.accent : 'rgba(0,0,0,0.5)',
                        color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', transition: 'all 0.2s', backdropFilter: 'blur(8px)',
                    }} title="Subtitle settings">⚙</button>
                </div>
            )}

            {/* Control panel */}
            {showPanel && (
                <div onWheel={stopScroll} style={{
                    position: pos, top: fluxFs ? 50 : rect.top + 50, right: rightOffset,
                    zIndex: 2147483647, width: '340px', pointerEvents: 'auto',
                }}>
                    <SubtitleControlPanel
                        tracks={tracks} currentTime={currentTime} videoDuration={videoDuration}
                        onAddFiles={onAddFiles} onAddUrl={onAddUrl}
                        onRemoveTrack={onRemoveTrack} onToggleVisibility={onToggleVisibility}
                        onSetOffset={onSetOffset} onSeek={handleSeek}
                        onClose={() => setShowPanel(false)} theme={theme}
                        isManualMode={isManualMode} manualPlaying={manualPlaying}
                        onToggleManualPlay={onToggleManualPlay}
                    />
                </div>
            )}
        </>
    );

    // Custom fullscreen: portal into our container (state-based, safe to read during render)
    if (fluxFs && fluxFsEl) {
        return createPortal(overlayContent, fluxFsEl);
    }

    // Native fullscreen: portal into injected div
    if (nativeFs && portalEl) {
        return createPortal(overlayContent, portalEl);
    }

    return overlayContent;
}

function stopScroll(e: React.WheelEvent) {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
}
