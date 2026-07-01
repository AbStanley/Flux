import type { CSSProperties, ReactNode } from 'react';
import { Check, Maximize2, Save, X, Volume2 } from 'lucide-react';
import { UI_CONSTANTS, type FluxTheme } from '../constants';

interface FluxCollapsedPopupProps {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    positioning: CSSProperties;
    loading: boolean;
    error: string | null;
    result: string;
    theme: FluxTheme;
    isSaving?: boolean;
    onClose: () => void;
    onExpand: () => void;
    handlePlayAudio: () => void;
    handleInternalSave: () => void;
}

export function FluxCollapsedPopup({
    onMouseEnter,
    onMouseLeave,
    positioning,
    loading,
    error,
    result,
    theme,
    isSaving,
    onClose,
    onExpand,
    handlePlayAudio,
    handleInternalSave,
}: FluxCollapsedPopupProps) {
    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                ...positioning,
                zIndex: UI_CONSTANTS.Z_INDEX,
                fontFamily: 'Inter, system-ui, sans-serif',
            }}
            onMouseDown={e => e.stopPropagation()}
        >
            <div
                style={{
                    backgroundColor: theme.bg,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: theme.text,
                    borderRadius: '12px',
                    boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${theme.border}`,
                    fontSize: '14px',
                    lineHeight: '1.5',
                    width: 'max-content',
                    maxWidth: 'min(480px, 90vw)',
                    border: `1px solid ${theme.border}`,
                    overflow: 'hidden',
                    position: 'relative', // Ensure relative positioning context
                }}
            >
                {loading && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: `linear-gradient(90deg, ${theme.accent} 0%, ${theme.info} 50%, ${theme.accent} 100%)`,
                        backgroundSize: '200% 100%',
                        animation: 'flux-loading-bar 1.5s infinite linear',
                        zIndex: 2,
                    }} />
                )}

                {/* Translation text */}
                <div style={{ padding: '10px 14px', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ 
                            fontSize: '13px', 
                            lineHeight: '1.5', 
                            fontWeight: 500, 
                            color: theme.text,
                            whiteSpace: 'pre-wrap', // Preserve line breaks for multi-line text!
                            flex: 1
                        }}>
                            {error ? (
                                <span style={{ color: theme.error }}>⚠️ {error}</span>
                            ) : loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textSecondary }}>
                                    <div className="animate-spin" style={{
                                        width: '14px',
                                        height: '14px',
                                        border: `2px solid ${theme.accent}`,
                                        borderTopColor: 'transparent',
                                        borderRadius: '50%',
                                        flexShrink: 0
                                    }}></div>
                                    Processing...
                                </span>
                            ) : (
                                result || '—'
                            )}
                        </div>
                        
                        {result && !loading && !error && (
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePlayAudio(); }}
                                onMouseDown={(e) => e.stopPropagation()}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: theme.textSecondary,
                                    padding: '4px',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    flexShrink: 0
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = theme.accent)}
                                onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
                                title="Listen"
                            >
                                <Volume2 size={14} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Action bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    gap: '4px', padding: '6px 10px',
                    borderTop: `1px solid ${theme.borderLight}`,
                    background: `${theme.surface}e6`,
                }}>
                    {(
                        [
                            {
                                title: 'Save to vocabulary',
                                color: isSaving ? theme.success : theme.accent,
                                onClick: () => handleInternalSave(),
                                disabled: loading || isSaving,
                                icon: isSaving ? (
                                    <Check size={12} strokeWidth={3} />
                                ) : (
                                    <Save size={12} strokeWidth={2.5} />
                                )
                            },
                            {
                                title: 'Expand',
                                color: theme.textSecondary,
                                onClick: () => onExpand(),
                                disabled: false,
                                icon: <Maximize2 size={12} strokeWidth={2.5} />
                            },
                            {
                                title: 'Close',
                                color: theme.textSecondary,
                                onClick: () => onClose(),
                                disabled: false,
                                icon: <X size={12} strokeWidth={2.5} />
                            },
                        ] as Array<{ title: string; color: string; onClick: () => void; disabled: boolean; icon: ReactNode }>
                    ).map((btn) => (
                        <button
                            key={btn.title}
                            onClick={(e) => { e.stopPropagation(); btn.onClick(); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            disabled={btn.disabled}
                            title={btn.title}
                            style={{
                                background: theme.borderLight, border: `1px solid ${theme.borderLight}`, color: btn.color,
                                cursor: btn.disabled ? 'not-allowed' : 'pointer',
                                opacity: btn.disabled ? 0.4 : 1,
                                padding: '4px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                width: '24px', height: '24px', borderRadius: '50%',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { if (!btn.disabled) { e.currentTarget.style.backgroundColor = theme.surface; e.currentTarget.style.borderColor = theme.border; } }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = theme.borderLight; e.currentTarget.style.borderColor = theme.borderLight; }}
                        >
                            {btn.icon}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
