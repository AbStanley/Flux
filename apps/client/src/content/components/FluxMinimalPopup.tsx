import { useRef } from 'react';
import { FluxSelect } from './ui/FluxSelect';
import { FluxIconButton } from './ui/FluxIconButton';
import { LANGUAGES } from '../constants';

interface FluxMinimalPopupProps {
    result: string;
    loading: boolean;
    targetLang: string;
    onLangChange: (lang: string) => void;
    sourceLang: string;
    onSourceLangChange: (lang: string) => void;
    autoSave: boolean;
    onAutoSaveChange: (enabled: boolean) => void;
    isSaved?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export function FluxMinimalPopup({
    result,
    loading,
    targetLang,
    onLangChange,
    sourceLang,
    onSourceLangChange,
    autoSave,
    onAutoSaveChange,
    isSaved,
    onMouseEnter,
    onMouseLeave
}: FluxMinimalPopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);

    return (
        <div
            ref={popupRef}
            className="flux-popup-minimal"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                position: 'absolute',
                bottom: '12px', // Position above the word, growing upwards
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                zIndex: 2147483647,
                minWidth: '240px',
                maxWidth: '320px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                animation: 'flux-fade-in 0.2s ease-out'
            }}
        >
            {/* Translations Result */}
            <div style={{
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '1.4',
                color: '#e2e8f0',
                marginBottom: '4px',
                minHeight: '24px' // Prevent collapse
            }}>
                {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
                        <span className="animate-spin">⟳</span> Translating...
                    </span>
                ) : (
                    result || "No translation found"
                )}
            </div>

            {/* Controls Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FluxSelect
                        value={sourceLang}
                        onChange={onSourceLangChange}
                        options={[{ value: 'auto', label: 'Auto' }, ...LANGUAGES.map(l => ({ value: l, label: l }))]}
                        title="Source Language"
                        style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#cbd5e1',
                            maxWidth: '80px'
                        }}
                    />
                    <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '12px' }}>→</span>
                    <FluxSelect
                        value={targetLang}
                        onChange={onLangChange}
                        options={LANGUAGES}
                        title="Target Language"
                        style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#cbd5e1',
                            maxWidth: '80px'
                        }}
                    />
                </div>

                <FluxIconButton
                    onClick={() => onAutoSaveChange(!autoSave)}
                    title={autoSave ? "Auto-Save On" : "Auto-Save Off"}
                    style={{
                        padding: '4px',
                        borderRadius: '6px',
                        backgroundColor: autoSave ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                        color: autoSave ? '#60a5fa' : '#94a3b8'
                    }}
                >
                    {isSaved ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4ade80' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>Saved</span>
                        </div>
                    ) : autoSave ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                    )}
                </FluxIconButton>
            </div>

            {/* Pointer Arrow */}
            <div style={{
                position: 'absolute',
                bottom: '-6px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '12px',
                height: '12px',
                backgroundColor: '#0f172a',
                borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }} />
        </div>
    );
}
