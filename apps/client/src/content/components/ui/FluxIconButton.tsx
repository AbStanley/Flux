import type { MouseEvent, ReactNode } from 'react';

interface FluxIconButtonProps {
    onClick: (e: MouseEvent) => void;
    title?: string;
    children: ReactNode;
    style?: React.CSSProperties;
    active?: boolean;
    disabled?: boolean;
}

export function FluxIconButton({
    onClick,
    title,
    children,
    style,
    active,
    disabled
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
                background: active ? '#475569' : '#334155',
                color: active ? 'white' : '#94a3b8',
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
