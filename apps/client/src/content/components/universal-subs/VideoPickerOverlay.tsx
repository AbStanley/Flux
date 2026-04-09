import type { DetectedVideo } from '../../types/subtitles';
import type { FluxTheme } from '../../constants';

interface Props {
    videos: DetectedVideo[];
    onSelect: (video: DetectedVideo) => void;
    onCancel: () => void;
    theme: FluxTheme;
}

export function VideoPickerOverlay({ videos, onSelect, onCancel, theme }: Props) {
    if (videos.length === 0) {
        return (
            <div style={{
                position: 'fixed',
                bottom: '24px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2147483647,
                backgroundColor: theme.bgSolid,
                color: theme.text,
                padding: '16px 24px',
                borderRadius: '12px',
                border: `1px solid ${theme.border}`,
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
            }}>
                <span style={{ color: theme.error }}>No videos found on this page.</span>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: theme.surface,
                        color: theme.text,
                        cursor: 'pointer',
                        fontSize: '13px',
                    }}
                >
                    Close
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Semi-transparent backdrop */}
            <div
                onClick={onCancel}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    zIndex: 2147483644,
                    cursor: 'pointer',
                }}
            />

            {/* Instruction banner */}
            <div style={{
                position: 'fixed',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2147483647,
                backgroundColor: theme.bgSolid,
                color: theme.text,
                padding: '12px 24px',
                borderRadius: '12px',
                border: `1px solid ${theme.accent}`,
                boxShadow: `0 0 20px ${theme.accentGlow}, 0 10px 30px rgba(0,0,0,0.4)`,
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
            }}>
                <span>🎯 Click on the video you want to add subtitles to</span>
                <span style={{ color: theme.textSecondary, fontSize: '12px' }}>
                    ({videos.length} found)
                </span>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: theme.surface,
                        color: theme.textSecondary,
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginLeft: '8px',
                    }}
                >
                    Cancel
                </button>
            </div>

            {/* Highlight each video */}
            {videos.map((v) => {
                const r = v.element.getBoundingClientRect();
                const isSmall = r.width < 100 || r.height < 100;

                return (
                    <div
                        key={v.id}
                        onClick={(e) => { e.stopPropagation(); onSelect(v); }}
                        style={{
                            position: 'fixed',
                            left: r.left - 3,
                            top: r.top - 3,
                            width: r.width + 6,
                            height: r.height + 6,
                            border: `3px solid ${theme.accent}`,
                            borderRadius: '8px',
                            backgroundColor: `${theme.accent}15`,
                            zIndex: 2147483646,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${theme.accent}30`;
                            e.currentTarget.style.borderColor = theme.text;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = `${theme.accent}15`;
                            e.currentTarget.style.borderColor = theme.accent;
                        }}
                    >
                        {/* Label badge */}
                        <div style={{
                            position: 'absolute',
                            top: isSmall ? -28 : 8,
                            left: isSmall ? '50%' : 8,
                            transform: isSmall ? 'translateX(-50%)' : 'none',
                            backgroundColor: theme.accent,
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        }}>
                            {v.label}
                        </div>
                    </div>
                );
            })}
        </>
    );
}
