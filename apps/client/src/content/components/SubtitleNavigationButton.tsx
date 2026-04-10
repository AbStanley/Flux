import type { FluxTheme } from '../constants';

interface Props {
    direction: 'prev' | 'next';
    onClick?: () => void;
    theme: FluxTheme;
}

export function SubtitleNavigationButton({ direction, onClick, theme }: Props) {
    const isPrev = direction === 'prev';
    const points = isPrev ? '15 18 9 12 15 6' : '9 18 15 12 9 6';

    return (
        <div
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            style={{
                position: 'absolute',
                [isPrev ? 'left' : 'right']: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                padding: '12px',
                borderRadius: '50%',
                backgroundColor: theme.border,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.surface)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.border)}
        >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points={points} />
            </svg>
        </div>
    );
}
