interface FluxHeaderProps {
    onClose: () => void;
    onPinToggle: () => void;
    onSave: () => void;
    isPinned: boolean;
    isCollapsed: boolean;
    onCollapseToggle: () => void;
}

export function FluxHeader({
    onClose,
    onPinToggle,
    onSave,
    isPinned,
    isCollapsed,
    onCollapseToggle,

}: FluxHeaderProps) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'grab',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                marginBottom: '4px',
                userSelect: 'none'
            }}
            onMouseDown={() => {
                // Dragging is handled by the parent FluxPopup on the container div
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isPinned ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)',
                    boxShadow: isPinned ? '0 0 10px #3b82f6' : 'none',
                    transition: 'all 0.3s ease'
                }} />
                <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'rgba(255, 255, 255, 0.5)'
                }}>
                    Flux
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {/* Save to Deck Icon */}
                <button
                    onClick={(e) => { e.stopPropagation(); onSave(); }}
                    title="Add to Deck"
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(59, 130, 246, 0.8)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                </button>

                {/* Collapse Toggle */}
                <button
                    onClick={(e) => { e.stopPropagation(); onCollapseToggle(); }}
                    title={isCollapsed ? "Expand" : "Collapse"}
                    style={{
                        background: isCollapsed ? 'rgba(59, 130, 246, 0.2)' : 'none',
                        border: 'none',
                        color: 'white',
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

                {/* Pin Toggle */}
                <button
                    onClick={(e) => { e.stopPropagation(); onPinToggle(); }}
                    style={{
                        background: isPinned ? 'rgba(59, 130, 246, 0.2)' : 'none',
                        border: 'none',
                        color: isPinned ? '#3b82f6' : 'white',
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

                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
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
