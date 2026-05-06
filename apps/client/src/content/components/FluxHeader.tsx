import type { FluxTheme } from '../constants';
import { Check, Save, Pin, Minimize2, X } from 'lucide-react';

interface FluxHeaderProps {
    onClose: () => void;
    onPinToggle: () => void;
    onSave: () => void;
    isPinned: boolean;
    isCollapsed: boolean;
    onCollapseToggle: () => void;
    isSaving?: boolean;
    result?: string;
    loading?: boolean;
    theme: FluxTheme;
}

export function FluxHeader({
    onClose,
    onPinToggle,
    onSave,
    isPinned,
    isCollapsed,
    onCollapseToggle,
    isSaving,
    result,
    loading,
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
                    onMouseDown={(e) => e.stopPropagation()}
                    disabled={!result || loading || isSaving}
                    title="Add to Deck"
                    style={{
                        background: isSaving ? theme.success : 'none',
                        border: 'none',
                        color: isSaving ? theme.bgSolid : theme.accent,
                        cursor: (!result || loading || isSaving) ? 'not-allowed' : 'pointer',
                        opacity: (!result || loading || isSaving) ? 0.4 : 1,
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { if (!isSaving && result && !loading) e.currentTarget.style.background = theme.accentGlow; }}
                    onMouseLeave={(e) => { if (!isSaving) e.currentTarget.style.background = 'none'; }}
                >
                    {isSaving ? <Check size={14} strokeWidth={3} /> : <Save size={14} strokeWidth={2.5} />}
                </button>

                {/* Collapse Toggle - Reverted to original SVG */}
                <button
                    onClick={(e) => { e.stopPropagation(); onCollapseToggle(); }}
                    onMouseDown={(e) => e.stopPropagation()}
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
                    <Minimize2 size={14} strokeWidth={2.5} />
                </button>

                {/* Pin Toggle - Reverted to original SVG */}
                <button
                    onClick={(e) => { e.stopPropagation(); onPinToggle(); }}
                    onMouseDown={(e) => e.stopPropagation()}
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
                    <Pin size={14} strokeWidth={2.5} />
                </button>

                {/* Close Button - Reverted to original ✕ */}
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    onMouseDown={(e) => e.stopPropagation()}
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
                    <X size={14} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}
