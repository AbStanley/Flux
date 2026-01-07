import React from 'react';

interface FluxHeaderProps {
    onClose: () => void;
}

export const FluxHeader: React.FC<FluxHeaderProps> = ({ onClose }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#94a3b8' }}>Flux Analysis</span>
            <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >✕</button>
        </div>
    );
};
