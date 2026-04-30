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
        if (!theme) return {};
        switch (variant) {
            case 'primary':
                return {
                    background: theme.accent,
                    color: theme.bgSolid,
                    boxShadow: `0 4px 12px ${theme.accentGlow}`,
                };
            case 'secondary':
                return {
                    background: theme.surface,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                };
            case 'ghost':
                return {
                    background: 'transparent',
                    color: theme.textSecondary,
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
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '11px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: disabled ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                ...getVariantStyles(),
                ...style
            }}
            onMouseEnter={(e) => {
                if (disabled) return;
                e.currentTarget.style.transform = 'translateY(-1px)';
                if (variant === 'primary') e.currentTarget.style.filter = 'brightness(1.1)';
                else e.currentTarget.style.background = theme?.surfaceActive || theme?.surface || '';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.filter = 'none';
                if (variant !== 'primary') {
                    const styles = getVariantStyles();
                    e.currentTarget.style.background = (styles.background as string) || '';
                }
            }}
        >
            {children}
        </button>
    );
}
