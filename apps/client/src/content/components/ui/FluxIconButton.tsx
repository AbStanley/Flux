import type { MouseEvent, ReactNode } from 'react';
import type { FluxTheme } from '../../constants';

interface FluxIconButtonProps {
    onClick: (e: MouseEvent) => void;
    title?: string;
    children: ReactNode;
    style?: React.CSSProperties;
    active?: boolean;
    disabled?: boolean;
    theme?: FluxTheme;
}

export function FluxIconButton({
    onClick,
    title,
    children,
    style,
    active,
    disabled,
    theme,
}: FluxIconButtonProps) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onClick(e);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            title={title}
            disabled={disabled}
            style={{
                background: active ? (theme?.accent ?? '#3b82f6') : 'transparent',
                color: active ? (theme?.bgSolid ?? 'white') : (theme?.textSecondary ?? '#94a3b8'),
                border: 'none',
                borderRadius: '5px',
                padding: '3px 8px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: '700',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                whiteSpace: 'nowrap',
                ...style
            }}
            onMouseEnter={(e) => {
                if (disabled || active) return;
                e.currentTarget.style.background = theme?.borderLight || 'rgba(0,0,0,0.05)';
                e.currentTarget.style.color = theme?.text || 'black';
            }}
            onMouseLeave={(e) => {
                if (active) return;
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme?.textSecondary || '#94a3b8';
            }}
        >
            {children}
        </button>
    );
}
