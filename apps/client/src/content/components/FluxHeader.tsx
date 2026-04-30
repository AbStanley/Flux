import type { FluxTheme } from '../constants';
import { Save } from 'lucide-react';

interface FluxHeaderProps {
    onClose: () => void;
    onPinToggle: () => void;
    onSave: () => void;
    isPinned: boolean;
    isCollapsed: boolean;
    onCollapseToggle: () => void;
    theme: FluxTheme;
}

export function FluxHeader({
    onClose,
    onPinToggle,
    onSave,
    isPinned,
    isCollapsed,
    onCollapseToggle,
    theme,
}: FluxHeaderProps) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'grab',
                paddingBottom: '8px',
                borderBottom: `1px solid ${theme.borderLight}`,
                marginBottom: '4px',
                userSelect: 'none'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isPinned ? theme.accent : theme.border,
                    boxShadow: isPinned ? `0 0 10px ${theme.accent}` : 'none',
                    transition: 'all 0.3s ease'
                }} />
                <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: theme.textSecondary
                }}>
                    Flux
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* Save to Deck Icon - Using requested Lucide version */}
                <button
                    onClick={(e) => { e.stopPropagation(); onSave(); }}
                    title="Add to Deck"
                    style={{
                        background: 'none',
                        border: 'none',
                        color: theme.accent,
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = theme.accentGlow}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                    <Save size={14} strokeWidth={2.5} />
                </button>

                {/* Collapse Toggle - Reverted to original SVG */}
                <button
                    onClick={(e) => { e.stopPropagation(); onCollapseToggle(); }}
                    title={isCollapsed ? "Expand" : "Collapse"}
                    style={{
                        background: isCollapsed ? theme.accentGlow : 'none',
                        border: 'none',
                        color: theme.text,
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        {isCollapsed ? (
                            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        ) : (
                            <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" />
                        )}
                    </svg>
                </button>

                {/* Pin Toggle - Reverted to original SVG */}
                <button
                    onClick={(e) => { e.stopPropagation(); onPinToggle(); }}
                    style={{
                        background: isPinned ? theme.accentGlow : 'none',
                        border: 'none',
                        color: isPinned ? theme.accent : theme.text,
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                </button>

                {/* Close Button - Reverted to original ✕ */}
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: theme.text,
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.6,
                        transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
