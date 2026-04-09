import type { MouseEvent, ReactNode } from 'react';
import type { FluxTheme } from '../../constants';

interface FluxButtonProps {
    onClick: (e: MouseEvent) => void;
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    style?: React.CSSProperties;
    disabled?: boolean;
    theme?: FluxTheme;
}

export function FluxButton({
    onClick,
    children,
    variant = 'primary',
    style,
    disabled,
    theme,
}: FluxButtonProps) {
    const getVariantStyles = (): React.CSSProperties => {
        switch (variant) {
            case 'primary':
                return {
                    background: theme?.accent ?? '#3b82f6',
                    color: 'white',
                    boxShadow: `0 4px 6px -1px ${theme?.accentGlow ?? 'rgba(59, 130, 246, 0.3)'}`,
                };
            case 'secondary':
                return {
                    background: theme?.surface ?? '#334155',
                    color: theme?.textSecondary ?? '#94a3b8',
                };
            case 'ghost':
                return {
                    background: 'transparent',
                    color: theme?.textSecondary ?? '#94a3b8',
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
