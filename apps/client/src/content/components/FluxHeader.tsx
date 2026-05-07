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
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: theme.accent,
                    color: theme.bgSolid,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: '800',
                    boxShadow: isPinned ? `0 0 12px ${theme.accent}66` : 'none',
                    transition: 'all 0.3s ease',
                    flexShrink: 0,
                    userSelect: 'none'
                }}>
                    F
                </div>
                <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: theme.text
                }}>
                    Flux
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Save to Deck Icon */}
                <button
                    onClick={(e) => { e.stopPropagation(); onSave(); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    disabled={!result || loading || isSaving}
                    title="Add to Deck"
                    style={{
                        background: isSaving ? theme.success : theme.borderLight,
                        border: `1px solid ${theme.borderLight}`,
                        color: isSaving ? theme.bgSolid : theme.text,
                        cursor: (!result || loading || isSaving) ? 'not-allowed' : 'pointer',
                        opacity: (!result || loading || isSaving) ? 0.4 : 1,
                        padding: '4px',
                        borderRadius: '50%',
                        width: '26px',
                        height: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { if (!isSaving && result && !loading) { e.currentTarget.style.background = theme.accentGlow; e.currentTarget.style.borderColor = theme.accent; } }}
                    onMouseLeave={(e) => { if (!isSaving) { e.currentTarget.style.background = theme.borderLight; e.currentTarget.style.borderColor = theme.borderLight; } }}
                >
                    {isSaving ? <Check size={13} strokeWidth={3} /> : <Save size={13} strokeWidth={2.5} />}
                </button>

                {/* Collapse Toggle */}
                <button
                    onClick={(e) => { e.stopPropagation(); onCollapseToggle(); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    title={isCollapsed ? "Expand" : "Collapse"}
                    style={{
                        background: isCollapsed ? theme.accentGlow : theme.borderLight,
                        border: `1px solid ${isCollapsed ? theme.accent : theme.borderLight}`,
                        color: theme.text,
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '50%',
                        width: '26px',
                        height: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = theme.surface; e.currentTarget.style.borderColor = theme.border; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isCollapsed ? theme.accentGlow : theme.borderLight; e.currentTarget.style.borderColor = isCollapsed ? theme.accent : theme.borderLight; }}
                >
                    <Minimize2 size={13} strokeWidth={2.5} />
                </button>

                {/* Pin Toggle */}
                <button
                    onClick={(e) => { e.stopPropagation(); onPinToggle(); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        background: isPinned ? theme.accentGlow : theme.borderLight,
                        border: `1px solid ${isPinned ? theme.accent : theme.borderLight}`,
                        color: theme.text,
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '50%',
                        width: '26px',
                        height: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = theme.surface; e.currentTarget.style.borderColor = theme.border; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = isPinned ? theme.accentGlow : theme.borderLight; e.currentTarget.style.borderColor = isPinned ? theme.accent : theme.borderLight; }}
                >
                    <Pin size={13} strokeWidth={2.5} />
                </button>

                {/* Close Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        background: theme.borderLight,
                        border: `1px solid ${theme.borderLight}`,
                        color: theme.text,
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '50%',
                        width: '26px',
                        height: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.6,
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = theme.error; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = theme.error; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = theme.borderLight; e.currentTarget.style.color = theme.text; e.currentTarget.style.borderColor = theme.borderLight; }}
                >
                    <X size={13} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}
