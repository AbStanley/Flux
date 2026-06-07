import { useRef } from 'react';
import type { FluxTheme } from '../constants';
import { Volume2 } from 'lucide-react';
import { useFluxAudio } from '../hooks/useFluxAudio';
import { FluxMinimalPopupControls } from './FluxMinimalPopupControls';

interface FluxMinimalPopupProps {
    result: string;
    loading: boolean;
    isDebouncing?: boolean;
    error?: string | null;
    targetLang: string;
    onLangChange: (lang: string) => void;
    sourceLang: string;
    onSourceLangChange: (lang: string) => void;
    onSwapLanguages?: () => void;
    onSave?: () => void;
    isSaved?: boolean;
    saveError?: string | null;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    theme: FluxTheme;
    textToPlay?: string;
}

export function FluxMinimalPopup({
    result,
    loading,
    isDebouncing,
    error,
    targetLang,
    onLangChange,
    sourceLang,
    onSourceLangChange,
    onSwapLanguages,
    onSave,
    isSaved,
    saveError,
    onMouseEnter,
    onMouseLeave,
    theme,
    textToPlay,
}: FluxMinimalPopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);

    const bg = theme.bgSolid;
    const text = theme.text;
    const textSec = theme.textSecondary;
    const accent = theme.accent;
    const border = theme.border;
    const errColor = theme.error;

    const { playAudio } = useFluxAudio();

    const handlePlayAudio = () => {
        const text = result || textToPlay;
        const langToUse = result ? targetLang : (sourceLang === 'auto' ? 'English' : (sourceLang || 'English'));
        playAudio(text || '', langToUse);
    };

    return (
        <div
            ref={popupRef}
            className="flux-popup-minimal"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                position: 'absolute',
                bottom: '0px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: bg,
                color: text,
                padding: '12px 16px',
                borderRadius: '12px',
                boxShadow: `0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 0 0 1px ${border}`,
                zIndex: 2147483647,
                width: 'max-content',
                minWidth: '200px',
                maxWidth: 'min(600px, 90vw)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${border}`,
                animation: 'flux-fade-in 0.2s ease-out'
            }}
        >
            {/* Translation Result */}
            <div style={{
                fontSize: '16px',
                fontWeight: 500,
                lineHeight: '1.4',
                color: text,
                marginBottom: '4px',
                minHeight: '24px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px'
            }}>
                <div style={{ flex: 1 }}>
                    {(loading || isDebouncing) ? (
                        <span style={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}>
                            <style>{`
                                @keyframes flux-spin {
                                    from { transform: rotate(0deg); }
                                    to { transform: rotate(360deg); }
                                }
                            `}</style>
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg" 
                                style={{ 
                                    color: accent, 
                                    animation: 'flux-spin 1s linear infinite',
                                    flexShrink: 0
                                }}
                            >
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.2 }} />
                                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                            </svg>
                        </span>
                    ) : error ? (
                        <span style={{ color: errColor }}>⚠️ {error}</span>
                    ) : (
                        result || "No translation found"
                    )}
                </div>

                {result && !loading && !isDebouncing && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handlePlayAudio(); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: textSec,
                            padding: '4px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            flexShrink: 0,
                            marginTop: '2px'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = accent)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = textSec)}
                        title="Listen"
                    >
                        <Volume2 size={16} strokeWidth={2.5} />
                    </button>
                )}
            </div>

            {/* Controls Row */}
            <FluxMinimalPopupControls
                theme={theme}
                sourceLang={sourceLang}
                onSourceLangChange={onSourceLangChange}
                targetLang={targetLang}
                onLangChange={onLangChange}
                onSwapLanguages={onSwapLanguages}
                result={result}
                loading={loading}
                isDebouncing={isDebouncing}
                onSave={onSave}
                isSaved={isSaved}
            />

            {saveError && (
                <div style={{ fontSize: '11px', color: errColor, textAlign: 'center', padding: '0 4px 4px' }}>
                    {saveError}
                </div>
            )}

            {/* Pointer Arrow */}
            <div style={{
                position: 'absolute',
                bottom: '-6px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '12px',
                height: '12px',
                backgroundColor: bg,
                borderRight: `1px solid ${border}`,
                borderBottom: `1px solid ${border}`
            }} />
        </div>
    );
}
