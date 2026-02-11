import type { MouseEvent, ReactNode } from 'react';

interface FluxButtonProps {
    onClick: (e: MouseEvent) => void;
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    style?: React.CSSProperties;
    disabled?: boolean;
}

export function FluxButton({
    onClick,
    children,
    variant = 'primary',
    style,
    disabled
}: FluxButtonProps) {
    const getVariantStyles = (): React.CSSProperties => {
        switch (variant) {
            case 'primary':
                return {
                    background: '#3b82f6',
                    color: 'white',
                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
                };
            case 'secondary':
                return {
                    background: '#334155',
                    color: '#94a3b8',
                };
            case 'ghost':
                return {
                    background: 'transparent',
                    color: '#94a3b8',
                };
            default:
                return {};
        }
    };

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled) onClick(e);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            disabled={disabled}
            style={{
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.9em',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                opacity: disabled ? 0.5 : 1,
                ...getVariantStyles(),
                ...style
            }}
        >
            {children}
        </button>
    );
}
