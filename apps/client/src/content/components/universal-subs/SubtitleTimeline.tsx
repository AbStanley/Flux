import { useState, useRef, useCallback } from 'react';
import type { SubtitleTrack, SubtitleCue } from '../../types/subtitles';
import type { FluxTheme } from '../../constants';

interface Props {
    tracks: SubtitleTrack[];
    currentTime: number;
    duration: number;
    onSeek: (time: number) => void;
    theme: FluxTheme;
}

function formatTime(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0
        ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
        : `${m}:${sec.toString().padStart(2, '0')}`;
}

export function SubtitleTimeline({ tracks, currentTime, duration, onSeek, theme }: Props) {
    const barRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverX, setHoverX] = useState(0);
    const [barWidth, setBarWidth] = useState(300);

    // Effective duration: use last cue end if no video duration
    let effectiveDuration = duration;
    if (effectiveDuration <= 0) {
        let maxEnd = 0;
        tracks.forEach(t => {
            const last = t.cues[t.cues.length - 1];
            if (last && last.end > maxEnd) maxEnd = last.end;
        });
        effectiveDuration = maxEnd || 3600;
    }

    const pct = (effectiveDuration > 0 ? currentTime / effectiveDuration : 0) * 100;

    const timeFromEvent = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!barRef.current) return 0;
        const rect = barRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        return (x / rect.width) * effectiveDuration;
    }, [effectiveDuration]);

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        const t = timeFromEvent(e);
        onSeek(t);

        const onMove = (ev: MouseEvent) => {
            const time = timeFromEvent(ev);
            onSeek(time);
        };
        const onUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [timeFromEvent, onSeek]);

    const onHover = useCallback((e: React.MouseEvent) => {
        if (!barRef.current) return;
        const rect = barRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        setHoverX(x);
        setBarWidth(rect.width);
        setHoverTime(timeFromEvent(e));
    }, [timeFromEvent]);

    // Find cue at hover time for preview
    let hoverCue: { text: string; color: string } | null = null;
    if (hoverTime !== null) {
        for (const track of tracks) {
            if (!track.visible) continue;
            const adjusted = hoverTime - track.offsetMs / 1000;
            const cue = track.cues.find(c => c.start <= adjusted && c.end >= adjusted);
            if (cue) { hoverCue = { text: cue.text, color: track.color }; break; }
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Time labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'monospace', color: theme.textSecondary }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(effectiveDuration)}</span>
            </div>

            {/* Timeline bar */}
            <div
                ref={barRef}
                onMouseDown={onMouseDown}
                onMouseMove={onHover}
                onMouseLeave={() => setHoverTime(null)}
                style={{
                    position: 'relative',
                    height: '24px',
                    backgroundColor: theme.surface,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    userSelect: 'none',
                }}
            >
                {/* Cue markers for each track */}
                {tracks.filter(t => t.visible).map((track, ti) => (
                    <CueMarkers
                        key={track.id}
                        cues={track.cues}
                        color={track.color}
                        offsetMs={track.offsetMs}
                        duration={effectiveDuration}
                        row={ti}
                        totalRows={tracks.filter(t => t.visible).length}
                    />
                ))}

                {/* Progress bar */}
                <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct}%`,
                    backgroundColor: `${theme.accent}30`,
                    pointerEvents: 'none',
                    transition: isDragging ? 'none' : 'width 0.2s linear',
                }} />

                {/* Playhead */}
                <div style={{
                    position: 'absolute',
                    left: `${pct}%`,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    backgroundColor: theme.accent,
                    pointerEvents: 'none',
                    transition: isDragging ? 'none' : 'left 0.2s linear',
                    boxShadow: `0 0 4px ${theme.accent}`,
                }} />

                {/* Hover indicator */}
                {hoverTime !== null && (
                    <div style={{
                        position: 'absolute',
                        left: hoverX,
                        top: 0,
                        bottom: 0,
                        width: '1px',
                        backgroundColor: theme.text,
                        opacity: 0.3,
                        pointerEvents: 'none',
                    }} />
                )}
            </div>

            {/* Hover tooltip */}
            {hoverTime !== null && (
                <div style={{
                    position: 'relative',
                    height: 0,
                }}>
                    <div style={{
                        position: 'absolute',
                        left: Math.max(0, Math.min(hoverX - 60, barWidth - 120)),
                        bottom: '2px',
                        backgroundColor: theme.bgSolid,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}>
                        <span style={{ fontFamily: 'monospace', color: theme.accent }}>{formatTime(hoverTime)}</span>
                        {hoverCue && (
                            <span style={{ color: hoverCue.color, marginLeft: '6px' }}>{hoverCue.text.slice(0, 40)}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/** Render cue markers as colored bars on the timeline */
function CueMarkers({ cues, color, offsetMs, duration, row, totalRows }: {
    cues: SubtitleCue[];
    color: string;
    offsetMs: number;
    duration: number;
    row: number;
    totalRows: number;
}) {
    const rowHeight = 24 / Math.max(totalRows, 1);
    const top = row * rowHeight;

    return (
        <>
            {cues.map((cue, i) => {
                const start = ((cue.start + offsetMs / 1000) / duration) * 100;
                const width = ((cue.end - cue.start) / duration) * 100;
                if (start > 100 || start + width < 0) return null;
                return (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            left: `${Math.max(0, start)}%`,
                            width: `${Math.max(0.2, Math.min(width, 100 - start))}%`,
                            top: `${top}px`,
                            height: `${rowHeight}px`,
                            backgroundColor: color,
                            opacity: 0.4,
                            pointerEvents: 'none',
                            borderRadius: '1px',
                        }}
                    />
                );
            })}
        </>
    );
}
