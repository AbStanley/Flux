import { useRef } from 'react';
import { FluxSelect } from './ui/FluxSelect';
import { FluxIconButton } from './ui/FluxIconButton';
import { LANGUAGES, type FluxTheme } from '../constants';

interface FluxMinimalPopupProps {
    result: string;
    loading: boolean;
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
    theme?: FluxTheme;
}

export function FluxMinimalPopup({
    result,
    loading,
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
}: FluxMinimalPopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);

    const bg = theme?.bgSolid ?? '#0f172a';
    const text = theme?.text ?? '#f8fafc';
    const textSec = theme?.textSecondary ?? '#cbd5e1';
    const accent = theme?.accent ?? '#3b82f6';
    const border = theme?.border ?? 'rgba(255, 255, 255, 0.1)';
    const errColor = theme?.error ?? '#ef4444';
    const successColor = theme?.success ?? '#4ade80';

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
                minHeight: '24px'
            }}>
                {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
                        <span className="animate-spin">⟳</span> Translating...
                    </span>
                ) : error ? (
                    <span style={{ color: errColor }}>⚠️ {error}</span>
                ) : (
                    result || "No translation found"
                )}
            </div>

            {/* Controls Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', borderTop: `1px solid ${border}`, paddingTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FluxSelect
                        value={sourceLang}
                        onChange={onSourceLangChange}
                        options={[{ value: 'auto', label: 'Auto' }, ...LANGUAGES.map(l => ({ value: l, label: l }))]}
                        title="Source Language"
                        theme={theme}
                        style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: 'none',
                            borderRadius: '6px',
                            maxWidth: '80px'
                        }}
                    />
                    <FluxIconButton
                        onClick={() => onSwapLanguages?.()}
                        title="Swap Languages"
                        theme={theme}
                        style={{
                            padding: '4px',
                            color: textSec,
                            fontSize: '12px',
                            minWidth: '20px'
                        }}
                    >
                        ⇄
                    </FluxIconButton>
                    <FluxSelect
                        value={targetLang}
                        onChange={onLangChange}
                        options={LANGUAGES}
                        title="Target Language"
                        theme={theme}
                        style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: 'none',
                            borderRadius: '6px',
                            maxWidth: '80px'
                        }}
                    />
                </div>

                <FluxIconButton
                    onClick={() => onSave?.()}
                    title="Save to vocabulary"
                    theme={theme}
                    style={{
                        padding: '4px',
                        borderRadius: '6px',
                        backgroundColor: isSaved ? 'transparent' : 'transparent',
                        color: isSaved ? successColor : accent,
                    }}
                >
                    {isSaved ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: successColor }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>Saved</span>
                        </div>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                            <line x1="12" y1="7" x2="12" y2="13" />
                            <line x1="9" y1="10" x2="15" y2="10" />
                        </svg>
                    )}
                </FluxIconButton>
            </div>

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
