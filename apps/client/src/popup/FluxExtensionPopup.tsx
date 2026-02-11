import { useState, useEffect } from 'react';

export default function FluxExtensionPopup() {
    const [enabled, setEnabled] = useState(true);

    useEffect(() => {
        // Load initial state
        if (window.chrome?.storage?.local) {
            window.chrome.storage.local.get(['fluxEnabled'], (result) => {
                if (result.fluxEnabled !== undefined) {
                    setEnabled(result.fluxEnabled as boolean);
                }
            });
        }
    }, []);

    const toggleFlux = () => {
        const newState = !enabled;
        setEnabled(newState);
        if (window.chrome?.storage?.local) {
            window.chrome.storage.local.set({ fluxEnabled: newState });
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '20px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            textAlign: 'center'
        }}>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/flux-reader-helper.png" alt="Flux Logo" style={{ width: '40px', height: '40px' }} />
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Flux Reader</h2>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>Enable Flux</span>
                <button
                    onClick={toggleFlux}
                    style={{
                        position: 'relative',
                        width: '44px',
                        height: '24px',
                        borderRadius: '999px',
                        backgroundColor: enabled ? '#3b82f6' : '#cbd5e1',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                >
                    <span style={{
                        position: 'absolute',
                        top: '2px',
                        left: enabled ? '22px' : '2px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        transition: 'left 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }} />
                </button>
            </div>

            <p style={{
                marginTop: '20px',
                fontSize: '0.8rem',
                color: '#64748b'
            }}>
                {enabled ? 'Flux is active on all pages.' : 'Flux is disabled.'}
            </p>
        </div>
    );
}
