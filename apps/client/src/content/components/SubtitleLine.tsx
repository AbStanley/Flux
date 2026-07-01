import type { FluxTheme } from '../constants';

interface SubtitleLineProps {
    tokens: string[];
    isActive: boolean;
    isSentenceMode: boolean;
    hoveredWord: { text: string } | null;
    theme: FluxTheme;
    onWordHover?: (e: React.MouseEvent, token: string) => void;
    onWordLeave?: () => void;
    lineIdx: number;
    isLast?: boolean;
}

/**
 * Isolated subtitle line renderer.
 * Splitting concerns: Manages token highlighting, interactive cursor styles,
 * and mouse enter/leave triggers for both active and historic subtitle tracks.
 */
export function SubtitleLine({
    tokens,
    isActive,
    isSentenceMode,
    hoveredWord,
    theme,
    onWordHover,
    onWordLeave,
    lineIdx,
    isLast,
}: SubtitleLineProps) {
    if (!isActive) {
        return (
            <div
                style={{ 
                    display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', width: '100%',
                    opacity: 0.4,
                    marginBottom: '12px',
                    transition: 'opacity 0.3s ease',
                    fontSize: '24px',
                    lineHeight: 1.4,
                    whiteSpace: 'normal',
                    overflow: 'visible',
                    textOverflow: 'clip'
                }}
            >
                {tokens.map((token, i) => (
                    <span key={`p-t-${lineIdx}-${i}`} style={{
                        display: 'inline-block', margin: '0 1px', padding: '1px 3px', color: theme.textDim, fontWeight: 600,
                    }}>
                        {token}
                    </span>
                ))}
            </div>
        );
    }

    return (
        <div
            style={{ 
                display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', width: '100%',
                opacity: 1,
                marginBottom: isLast ? '0' : '12px',
                transition: 'opacity 0.3s ease',
                fontSize: '28px',
                lineHeight: 1.4,
                whiteSpace: 'normal',
                overflow: 'visible',
                textOverflow: 'clip'
            }}
            onMouseOver={(e) => {
                const el = (e.target as HTMLElement).closest('[data-flux-token]') as HTMLElement | null;
                if (el?.dataset.fluxToken && onWordHover) {
                    onWordHover(e as unknown as React.MouseEvent, el.dataset.fluxToken);
                }
            }}
            onMouseLeave={onWordLeave}
        >
            {tokens.map((token, i) => {
                const clean = token.trim().replace(/[.,!?;:]/g, '');
                const isHov = !isSentenceMode && hoveredWord?.text === clean;
                const highlight = (isSentenceMode && hoveredWord) || isHov;
                return (
                    <span key={`a-t-${lineIdx}-${i}`} data-flux-token={clean || undefined} onClick={(e) => e.stopPropagation()}
                        style={{
                            cursor: clean ? 'pointer' : 'default', display: 'inline-block', transition: 'all 0.2s ease', margin: '0 1px', padding: '1px 3px', borderRadius: '6px',
                            color: highlight ? theme.accent : theme.textSecondary, 
                            backgroundColor: isHov ? theme.accentGlow : 'transparent',
                            transform: highlight ? 'scale(1.05)' : 'scale(1)', fontWeight: highlight ? 700 : 600,
                        }}>
                        {token}
                    </span>
                );
            })}
        </div>
    );
}
