import { useState } from 'react';
import type { SubtitleTrack, SubtitleCue } from '../../types/subtitles';
import type { FluxTheme } from '../../constants';
import { FileDropZone } from './FileDropZone';

interface Props {
    tracks: SubtitleTrack[];
    currentTime: number;
    videoDuration: number;
    onAddFiles: (files: File[]) => void;
    onAddUrl: (url: string) => void;
    onRemoveTrack: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onSetOffset: (id: string, ms: number) => void;
    onSeek: (time: number) => void;
    onClose: () => void;
    theme: FluxTheme;
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
}

function formatOffset(ms: number): string {
    const sign = ms >= 0 ? '+' : '';
    return `${sign}${(ms / 1000).toFixed(1)}s`;
}

function findNearbyCues(cues: SubtitleCue[], time: number, offsetMs: number): { prev: SubtitleCue | null; current: SubtitleCue | null; next: SubtitleCue | null } {
    const adjusted = time - offsetMs / 1000;
    let currentIdx = -1;
    for (let i = 0; i < cues.length; i++) {
        if (cues[i].start <= adjusted && cues[i].end >= adjusted) { currentIdx = i; break; }
        if (cues[i].start > adjusted) { currentIdx = i; break; }
    }
    if (currentIdx === -1) currentIdx = cues.length - 1;

    const isCurrent = cues[currentIdx] && cues[currentIdx].start <= adjusted && cues[currentIdx].end >= adjusted;
    return {
        prev: currentIdx > 0 ? cues[currentIdx - 1] : null,
        current: isCurrent ? cues[currentIdx] : null,
        next: isCurrent ? (cues[currentIdx + 1] || null) : cues[currentIdx] || null,
    };
}

export function SubtitleControlPanel({
    tracks,
    currentTime,
    videoDuration,
    onAddFiles,
    onAddUrl,
    onRemoveTrack,
    onToggleVisibility,
    onSetOffset,
    onSeek,
    onClose,
    theme,
}: Props) {
    const [expandedTrack, setExpandedTrack] = useState<string | null>(null);
    const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

    return (
        <div style={{
            backgroundColor: theme.bgSolid,
            border: `1px solid ${theme.border}`,
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '500px',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            color: theme.text,
            fontSize: '13px',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Subtitles</span>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: '16px', padding: '2px 6px' }}
                >
                    ✕
                </button>
            </div>

            {/* Timeline bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: theme.textSecondary, fontFamily: 'monospace', minWidth: '40px' }}>
                    {formatTime(currentTime)}
                </span>
                <div
                    onClick={(e) => {
                        if (videoDuration <= 0) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        onSeek(pct * videoDuration);
                    }}
                    style={{
                        flex: 1,
                        height: '6px',
                        backgroundColor: theme.surface,
                        borderRadius: '3px',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        backgroundColor: theme.accent,
                        borderRadius: '3px',
                        transition: 'width 0.2s linear',
                    }} />
                </div>
                <span style={{ fontSize: '11px', color: theme.textSecondary, fontFamily: 'monospace', minWidth: '40px', textAlign: 'right' }}>
                    {formatTime(videoDuration)}
                </span>
            </div>

            {/* Track list */}
            {tracks.map(track => {
                const isExpanded = expandedTrack === track.id;
                const nearby = isExpanded ? findNearbyCues(track.cues, currentTime, track.offsetMs) : null;

                return (
                    <TrackRow
                        key={track.id}
                        track={track}
                        isExpanded={isExpanded}
                        nearby={nearby}
                        onToggleExpand={() => setExpandedTrack(isExpanded ? null : track.id)}
                        onRemove={() => onRemoveTrack(track.id)}
                        onToggleVisibility={() => onToggleVisibility(track.id)}
                        onSetOffset={(ms) => onSetOffset(track.id, ms)}
                        theme={theme}
                    />
                );
            })}

            {/* Add tracks */}
            <FileDropZone onFiles={onAddFiles} onUrl={onAddUrl} theme={theme} compact />
        </div>
    );
}

function TrackRow({ track, isExpanded, nearby, onToggleExpand, onRemove, onToggleVisibility, onSetOffset, theme }: {
    track: SubtitleTrack;
    isExpanded: boolean;
    nearby: { prev: SubtitleCue | null; current: SubtitleCue | null; next: SubtitleCue | null } | null;
    onToggleExpand: () => void;
    onRemove: () => void;
    onToggleVisibility: () => void;
    onSetOffset: (ms: number) => void;
    theme: FluxTheme;
}) {
    return (
        <div style={{
            backgroundColor: theme.surface,
            borderRadius: '10px',
            overflow: 'hidden',
            border: isExpanded ? `1px solid ${theme.accent}30` : `1px solid transparent`,
            transition: 'border 0.2s',
        }}>
            {/* Main row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                }}
                onClick={onToggleExpand}
            >
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: track.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: 600, opacity: track.visible ? 1 : 0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.label}
                </span>
                <span style={{ fontSize: '10px', color: theme.textSecondary }}>{track.cues.length} cues</span>
                <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: track.visible ? theme.text : theme.textSecondary, opacity: track.visible ? 1 : 0.4, padding: '2px' }}
                    title={track.visible ? 'Hide' : 'Show'}
                >
                    {track.visible ? '👁' : '👁‍🗨'}
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    style={{ background: 'none', border: 'none', color: theme.error, cursor: 'pointer', fontSize: '11px', padding: '2px', opacity: 0.5 }}
                >
                    ✕
                </button>
            </div>

            {/* Expanded controls */}
            {isExpanded && (
                <div style={{ padding: '8px 10px', borderTop: `1px solid ${theme.borderLight}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Offset slider */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: theme.textSecondary }}>Offset</span>
                            <span style={{
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                color: track.offsetMs === 0 ? theme.textSecondary : theme.accent,
                                cursor: 'pointer',
                            }}
                                onClick={() => onSetOffset(0)}
                                title="Reset to 0"
                            >
                                {formatOffset(track.offsetMs)}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button onClick={() => onSetOffset(track.offsetMs - 500)} style={stepBtn(theme)} title="-0.5s">⏪</button>
                            <button onClick={() => onSetOffset(track.offsetMs - 100)} style={stepBtn(theme)} title="-0.1s">◀</button>
                            <input
                                type="range"
                                min={-10000}
                                max={10000}
                                step={100}
                                value={track.offsetMs}
                                onChange={(e) => onSetOffset(parseInt(e.target.value))}
                                style={{ flex: 1, accentColor: theme.accent, cursor: 'pointer' }}
                            />
                            <button onClick={() => onSetOffset(track.offsetMs + 100)} style={stepBtn(theme)} title="+0.1s">▶</button>
                            <button onClick={() => onSetOffset(track.offsetMs + 500)} style={stepBtn(theme)} title="+0.5s">⏩</button>
                        </div>
                    </div>

                    {/* Nearby cues preview */}
                    {nearby && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px' }}>
                            {nearby.prev && (
                                <CuePreview cue={nearby.prev} label="prev" color={theme.textSecondary} dim theme={theme} />
                            )}
                            {nearby.current && (
                                <CuePreview cue={nearby.current} label="now" color={track.color} theme={theme} />
                            )}
                            {nearby.next && (
                                <CuePreview cue={nearby.next} label="next" color={theme.textSecondary} dim theme={theme} />
                            )}
                            {!nearby.prev && !nearby.current && !nearby.next && (
                                <span style={{ color: theme.textSecondary, fontStyle: 'italic' }}>No cues near current time</span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function CuePreview({ cue, label, color, dim, theme }: { cue: SubtitleCue; label: string; color: string; dim?: boolean; theme: FluxTheme }) {
    return (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline', opacity: dim ? 0.5 : 1 }}>
            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: theme.textDim, minWidth: '28px' }}>{label}</span>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textSecondary, minWidth: '36px' }}>
                {formatTime(cue.start)}
            </span>
            <span style={{ color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {cue.text}
            </span>
        </div>
    );
}

function stepBtn(theme: FluxTheme): React.CSSProperties {
    return {
        background: theme.surfaceActive,
        border: 'none',
        color: theme.text,
        cursor: 'pointer',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '11px',
        lineHeight: 1,
    };
}
