import { memo, type MouseEvent as ReactMouseEvent } from 'react';

interface SubtitleTokenProps {
    token: string;
    isHovered: boolean;
    isSentenceMode: boolean;
    onMouseEnter: (e: ReactMouseEvent) => void;
    onMouseLeave: () => void;
    onClick: (e: ReactMouseEvent) => void;
}

export const SubtitleToken = memo(({
    token,
    isHovered,
    isSentenceMode,
    onMouseEnter,
    onMouseLeave,
    onClick
}: SubtitleTokenProps) => {
    const isSpecialToken = token.trim().length > 0;

    const style: React.CSSProperties = {
        cursor: isSpecialToken ? 'pointer' : 'default',
        display: 'inline-block',
        transition: 'all 0.2s ease',
        margin: '0 4px',
        color: (isSentenceMode && isHovered) ? '#60a5fa' : undefined,
        transform: (isSentenceMode && isHovered) ? 'scale(1.05)' : undefined
    };

    const className = `flux-token ${!isSentenceMode && isSpecialToken ? 'hover:scale-110 hover:text-blue-400' : ''}`;

    return (
        <span
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            style={style}
            className={className}
        >
            {token}
        </span>
    );
});
