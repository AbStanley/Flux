import React from 'react';
import type { Mode } from '../hooks/useAIHandler';
import { FluxHeader } from './FluxHeader';
import { FluxControls } from './FluxControls';
import { FluxContent } from './FluxContent';

interface FluxPopupProps {
    selection: { text: string; x: number; y: number };
    result: string;
    loading: boolean;
    error: string | null;
    mode: Mode;
    targetLang: string;
    onModeChange: (mode: Mode) => void;
    onLangChange: (lang: string) => void;
    onAction: () => void;
    onClose: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

export const FluxPopup: React.FC<FluxPopupProps> = ({
    selection,
    result,
    loading,
    error,
    mode,
    targetLang,
    onModeChange,
    onLangChange,
    onAction,
    onClose,
    onMouseEnter,
    onMouseLeave
}) => {
    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                position: 'absolute',
                left: selection.x,
                top: selection.y,
                zIndex: 2147483647,
                fontFamily: 'Inter, system-ui, sans-serif'
            }}
            onMouseDown={e => e.stopPropagation()}
        >
            {/* Direct Popup View */}
            <div style={{
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                width: '320px',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                fontSize: '14px',
                lineHeight: '1.5',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                <FluxHeader onClose={onClose} />

                <FluxControls
                    mode={mode}
                    targetLang={targetLang}
                    result={result}
                    selection={selection}
                    onModeChange={onModeChange}
                    onLangChange={onLangChange}
                    onAction={onAction}
                />

                <FluxContent
                    loading={loading}
                    error={error}
                    result={result}
                />
            </div>
        </div>
    );
};

