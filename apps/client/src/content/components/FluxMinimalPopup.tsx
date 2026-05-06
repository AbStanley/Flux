import { useRef } from 'react';
import { FluxSelect } from './ui/FluxSelect';
import { FluxIconButton } from './ui/FluxIconButton';
import { LANGUAGES, type FluxTheme } from '../constants';
import { ArrowLeftRight, Save, Check } from 'lucide-react';


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
    theme?: FluxTheme;
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
                {(loading || isDebouncing) ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.8 }}>
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: accent }}>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.2 }} />
                            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                        </svg>
                        <span>Translating...</span>
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
                            minWidth: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ArrowLeftRight size={14} strokeWidth={2.5} />
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

                {result && !loading && !isDebouncing && (
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
                                <Check size={16} strokeWidth={3} />
                                <span style={{ fontSize: '12px', fontWeight: 600 }}>Saved</span>
                            </div>
                        ) : (
                            <Save size={16} strokeWidth={2.5} />
                        )}
                    </FluxIconButton>
                )}
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
