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
                background: active ? (theme?.surfaceActive ?? '#475569') : (theme?.surface ?? '#334155'),
                color: active ? (theme?.text ?? 'white') : (theme?.textSecondary ?? '#94a3b8'),
                border: 'none',
                borderRadius: '6px',
                padding: '6px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '28px',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s',
                ...style
            }}
        >
            {children}
        </button>
    );
}
