import type { FluxTheme } from '../constants';

export const getOverlayStyles = (
    pos: { x: number, y: number }, 
    size: { width: number, height: number }, 
    isDragging: boolean, 
    isResizing: boolean,
    theme: FluxTheme
): React.CSSProperties => ({
    position: 'fixed',
    top: pos.y, left: pos.x,
    minWidth: size.width,
    width: size.width,
    maxWidth: '90vw',
    minHeight: size.height,
    height: 'auto',
    maxHeight: '60vh',
    transform: (isDragging || isResizing) ? 'translate(-50%, -50%) scale(1.02)' : 'translate(-50%, -50%) scale(1)',
    backgroundColor: theme.bgSolid,
    backdropFilter: 'blur(24px)', color: theme.text,
    padding: '16px 48px', borderRadius: '24px',
    fontSize: '24px', fontWeight: 600, zIndex: 2147483646,
    textAlign: 'center', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '4px',
    cursor: isDragging ? 'grabbing' : 'grab',
    boxShadow: (isDragging || isResizing)
        ? `0 40px 80px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px ${theme.border}`
        : `0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px ${theme.border}`,
    border: `1px solid ${theme.border}`,
    transition: (isDragging || isResizing) ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), top 0.1s ease-out, left 0.1s ease-out',
    userSelect: 'none', overflow: 'hidden',
});

export const getActionAreaStyles = (fullError: string | null, theme: FluxTheme, isVisible: boolean): React.CSSProperties => ({
    fontSize: '18px', color: fullError ? theme.error : theme.textSecondary,
    fontWeight: 500, padding: '12px 24px', textAlign: 'center',
    width: '100%', maxWidth: '85%', borderTop: `1px solid ${theme.border}`,
    minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.2s ease',
});
