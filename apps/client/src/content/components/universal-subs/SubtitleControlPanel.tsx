import { useState, useRef, useEffect } from 'react';
import type { SubtitleTrack, SubtitleCue } from '../../types/subtitles';
import type { FluxTheme } from '../../constants';
import { FileDropZone } from './FileDropZone';
import { SubtitleTimeline } from './SubtitleTimeline';

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
    isManualMode?: boolean;
    manualPlaying?: boolean;
    onToggleManualPlay?: () => void;
}

function formatTime(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}` : `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatOffset(ms: number): string {
    const sign = ms >= 0 ? '+' : '';
    return `${sign}${(ms / 1000).toFixed(1)}s`;
}

/** Find prev/next cue boundaries for jumping */
function findPrevNextCue(cues: SubtitleCue[], time: number, offsetMs: number): { prev: number | null; next: number | null } {
    const adjusted = time - offsetMs / 1000;
    let prev: number | null = null;
    let next: number | null = null;
    for (let i = 0; i < cues.length; i++) {
        if (cues[i].end < adjusted) prev = cues[i].start + offsetMs / 1000;
        if (cues[i].start > adjusted && next === null) { next = cues[i].start + offsetMs / 1000; break; }
    }
    return { prev, next };
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
    isManualMode,
    manualPlaying,
    onToggleManualPlay,
}: Props) {
    const [expandedTrack, setExpandedTrack] = useState<string | null>(null);

    // Jump to prev/next cue (uses first visible track)
    const visibleTrack = tracks.find(t => t.visible);
    const jumpTargets = visibleTrack ? findPrevNextCue(visibleTrack.cues, currentTime, visibleTrack.offsetMs) : { prev: null, next: null };

    return (
        <div
            onWheel={(e) => e.stopPropagation()}
            onScroll={(e) => e.stopPropagation()}
            style={{
                backgroundColor: theme.bgSolid,
                border: `1px solid ${theme.border}`,
                borderRadius: '16px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxHeight: '500px',
                overflowY: 'auto',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                color: theme.text,
                fontSize: '13px',
            }}
        >
            {/* Header with transport controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>Subtitles</span>
                    {isManualMode && (
                        <span style={{ fontSize: '10px', color: theme.accent, backgroundColor: theme.accentGlow, padding: '1px 6px', borderRadius: '4px' }}>
                            Manual
                        </span>
                    )}
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: '16px', padding: '2px 6px' }}>✕</button>
            </div>

            {/* Transport bar — jump prev, play/pause (manual), jump next */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                <button
                    onClick={() => jumpTargets.prev !== null && onSeek(jumpTargets.prev)}
                    disabled={jumpTargets.prev === null}
                    style={transportBtn(theme, jumpTargets.prev === null)}
                    title="Previous cue"
                >⏮</button>

                {isManualMode && (
                    <button
                        onClick={onToggleManualPlay}
                        style={{
                            ...transportBtn(theme, false),
                            width: '36px',
                            height: '36px',
                            fontSize: '16px',
                            backgroundColor: manualPlaying ? theme.accent : theme.surfaceActive,
                            color: manualPlaying ? 'white' : theme.text,
                        }}
                        title={manualPlaying ? 'Pause' : 'Play'}
                    >{manualPlaying ? '⏸' : '▶'}</button>
                )}

                <button
                    onClick={() => jumpTargets.next !== null && onSeek(jumpTargets.next)}
                    disabled={jumpTargets.next === null}
                    style={transportBtn(theme, jumpTargets.next === null)}
                    title="Next cue"
                >⏭</button>
            </div>

            {/* Timeline with cue markers */}
            <SubtitleTimeline
                tracks={tracks}
                currentTime={currentTime}
                duration={videoDuration}
                onSeek={onSeek}
                theme={theme}
            />

            {/* Track list */}
            {tracks.map(track => {
                const isExpanded = expandedTrack === track.id;
                return (
                    <TrackRow
                        key={track.id}
                        track={track}
                        isExpanded={isExpanded}
                        currentTime={currentTime}
                        onToggleExpand={() => setExpandedTrack(isExpanded ? null : track.id)}
                        onRemove={() => onRemoveTrack(track.id)}
                        onToggleVisibility={() => onToggleVisibility(track.id)}
                        onSetOffset={(ms) => onSetOffset(track.id, ms)}
                        onSeek={onSeek}
                        theme={theme}
                    />
                );
            })}

            {/* Add tracks */}
            <FileDropZone onFiles={onAddFiles} onUrl={onAddUrl} theme={theme} compact />
        </div>
    );
}

function TrackRow({ track, isExpanded, currentTime, onToggleExpand, onRemove, onToggleVisibility, onSetOffset, onSeek, theme }: {
    track: SubtitleTrack;
    isExpanded: boolean;
    currentTime: number;
    onToggleExpand: () => void;
    onRemove: () => void;
    onToggleVisibility: () => void;
    onSetOffset: (ms: number) => void;
    onSeek: (time: number) => void;
    theme: FluxTheme;
}) {
    const [offsetInput, setOffsetInput] = useState(String(track.offsetMs / 1000));
    const [isEditingOffset, setIsEditingOffset] = useState(false);
    const cueListRef = useRef<HTMLDivElement>(null);

    // Sync input display when offset changes externally (slider, buttons)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { if (!isEditingOffset) setOffsetInput((track.offsetMs / 1000).toFixed(1)); }, [track.offsetMs, isEditingOffset]);

    // Auto-scroll cue list to current cue
    const adjusted = currentTime - track.offsetMs / 1000;
    const currentCueIdx = track.cues.findIndex(c => c.start <= adjusted && c.end >= adjusted);

    useEffect(() => {
        if (!isExpanded || !cueListRef.current || currentCueIdx < 0) return;
        const el = cueListRef.current.children[currentCueIdx] as HTMLElement | undefined;
        if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, [currentCueIdx, isExpanded]);

    const commitOffset = () => {
        const val = parseFloat(offsetInput);
        if (!isNaN(val)) onSetOffset(Math.round(val * 1000));
        setIsEditingOffset(false);
    };

    return (
        <div
            onWheel={(e) => e.stopPropagation()}
            style={{
            backgroundColor: theme.surface,
            borderRadius: '10px',
            overflow: 'hidden',
            border: isExpanded ? `1px solid ${track.color}40` : '1px solid transparent',
            transition: 'border 0.2s',
        }}>
            {/* Header */}
            <div onClick={onToggleExpand} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', cursor: 'pointer' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: track.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: 600, opacity: track.visible ? 1 : 0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.label}
                </span>
                <span style={{ fontSize: '10px', color: theme.textSecondary }}>{track.cues.length}</span>
                <span style={{ fontSize: '12px', cursor: 'pointer', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: theme.textSecondary }}>▾</span>
                <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: track.visible ? theme.text : theme.textSecondary, opacity: track.visible ? 1 : 0.4, padding: '2px' }}>
                    {track.visible ? '👁' : '👁‍🗨'}
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    style={{ background: 'none', border: 'none', color: theme.error, cursor: 'pointer', fontSize: '11px', padding: '2px', opacity: 0.5 }}>✕</button>
            </div>

            {isExpanded && (
                <div style={{ padding: '8px 10px', borderTop: `1px solid ${theme.borderLight}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Offset control — typeable + slider + buttons */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: theme.textSecondary }}>Offset</span>
                            <div style={{ flex: 1 }} />
                            <button onClick={() => onSetOffset(track.offsetMs - 1000)} style={stepBtn(theme)}>−1s</button>
                            <button onClick={() => onSetOffset(track.offsetMs - 100)} style={stepBtn(theme)}>−.1</button>
                            <input
                                type="text"
                                value={isEditingOffset ? offsetInput : formatOffset(track.offsetMs)}
                                onChange={(e) => { setOffsetInput(e.target.value); setIsEditingOffset(true); }}
                                onFocus={() => { setIsEditingOffset(true); setOffsetInput((track.offsetMs / 1000).toFixed(1)); }}
                                onBlur={commitOffset}
                                onKeyDown={(e) => { if (e.key === 'Enter') commitOffset(); }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: '52px',
                                    textAlign: 'center',
                                    padding: '2px 4px',
                                    borderRadius: '4px',
                                    border: `1px solid ${isEditingOffset ? theme.accent : theme.border}`,
                                    backgroundColor: theme.surfaceActive,
                                    color: track.offsetMs === 0 ? theme.textSecondary : theme.accent,
                                    fontSize: '11px',
                                    fontFamily: 'monospace',
                                    outline: 'none',
                                }}
                            />
                            <button onClick={() => onSetOffset(track.offsetMs + 100)} style={stepBtn(theme)}>+.1</button>
                            <button onClick={() => onSetOffset(track.offsetMs + 1000)} style={stepBtn(theme)}>+1s</button>
                        </div>
                        <input
                            type="range"
                            min={-30000}
                            max={30000}
                            step={100}
                            value={track.offsetMs}
                            onChange={(e) => onSetOffset(parseInt(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '100%', accentColor: track.color, cursor: 'pointer', height: '4px' }}
                        />
                    </div>

                    {/* Scrollable full cue list */}
                    <div
                        ref={cueListRef}
                        onWheel={(e) => e.stopPropagation()}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1px',
                            fontSize: '11px',
                            borderTop: `1px solid ${theme.borderLight}`,
                            paddingTop: '6px',
                            maxHeight: '180px',
                            overflowY: 'auto',
                            scrollBehavior: 'smooth',
                        }}
                    >
                        {track.cues.map((cue, i) => {
                            const isActive = i === currentCueIdx;
                            return (
                                <CueLine
                                    key={i}
                                    cue={cue}
                                    offsetMs={track.offsetMs}
                                    color={isActive ? track.color : theme.textSecondary}
                                    active={isActive}
                                    dim={!isActive}
                                    onSeek={onSeek}
                                    theme={theme}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function CueLine({ cue, offsetMs, color, dim, active, onSeek, theme }: {
    cue: SubtitleCue; offsetMs: number; color: string; dim?: boolean; active?: boolean;
    onSeek: (time: number) => void; theme: FluxTheme;
}) {
    const jumpTime = cue.start + offsetMs / 1000;
    return (
        <div
            onClick={() => onSeek(jumpTime)}
            style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'baseline',
                opacity: dim ? 0.45 : 1,
                cursor: 'pointer',
                padding: '3px 4px',
                borderRadius: '4px',
                backgroundColor: active ? `${color}15` : 'transparent',
                borderLeft: active ? `2px solid ${color}` : '2px solid transparent',
                transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.surfaceActive; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = active ? `${color}15` : 'transparent'; }}
        >
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: theme.textDim, minWidth: '34px', flexShrink: 0 }}>
                {formatTime(cue.start)}
            </span>
            <span style={{ color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {cue.text}
            </span>
        </div>
    );
}

function transportBtn(theme: FluxTheme, disabled: boolean): React.CSSProperties {
    return {
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: theme.surfaceActive,
        color: disabled ? theme.textDim : theme.text,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
    };
}

function stepBtn(theme: FluxTheme): React.CSSProperties {
    return {
        background: theme.surfaceActive,
        border: 'none',
        color: theme.text,
        cursor: 'pointer',
        padding: '3px 6px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: 'nowrap',
    };
}
