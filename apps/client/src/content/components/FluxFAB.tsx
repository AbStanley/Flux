import { UI_CONSTANTS } from '../constants';
import type { FluxTheme } from '../constants';
import { Languages } from 'lucide-react';

interface FluxFABProps {
    x: number;
    y: number;
    theme: FluxTheme;
    onClick: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export function FluxFAB({ x, y, theme, onClick, onMouseEnter, onMouseLeave }: FluxFABProps) {
    // Position the FAB centered and directly on top of the selection x/y
    const leftPos = x + window.scrollX - 14; // Center the 28px button
    const topPos = y + window.scrollY - 32; // 32px above the selection top

    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                position: 'absolute',
                left: leftPos,
                top: topPos,
                zIndex: UI_CONSTANTS.Z_INDEX,
                fontFamily: 'Inter, system-ui, sans-serif',
                animation: 'flux-fab-pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
            onMouseDown={(e) => {
                // Prevent mouse down from clearing the text selection
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                title="Translate with Flux"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: theme.accent,
                    color: theme.accentForeground,
                    border: `1px solid ${theme.border}`,
                    boxShadow: `0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px ${theme.borderLight}`,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s, background-color 0.2s',
                    padding: 0,
                    outline: 'none',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1) translateY(-1px)';
                    e.currentTarget.style.boxShadow = `0 6px 16px rgba(0,0,0,0.4), 0 0 8px ${theme.accent}80`;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px ${theme.borderLight}`;
                }}
            >
                <Languages size={15} strokeWidth={2.5} />
            </button>
            <style>{`
                @keyframes flux-fab-pop {
                    from { opacity: 0; transform: scale(0.5); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
