import { FluxSelect } from './ui/FluxSelect';
import { FluxIconButton } from './ui/FluxIconButton';
import { LANGUAGES, type FluxTheme } from '../constants';
import { ArrowLeftRight, Save, Check } from 'lucide-react';

interface FluxMinimalPopupControlsProps {
    theme: FluxTheme;
    sourceLang: string;
    onSourceLangChange: (lang: string) => void;
    targetLang: string;
    onLangChange: (lang: string) => void;
    onSwapLanguages?: () => void;
    result: string;
    loading: boolean;
    isDebouncing?: boolean;
    onSave?: () => void;
    isSaved?: boolean;
}

export function FluxMinimalPopupControls({
    theme,
    sourceLang,
    onSourceLangChange,
    targetLang,
    onLangChange,
    onSwapLanguages,
    result,
    loading,
    isDebouncing,
    onSave,
    isSaved,
}: FluxMinimalPopupControlsProps) {
    const textSec = theme.textSecondary;
    const accent = theme.accent;
    const border = theme.border;
    const successColor = theme.success;

    return (
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
                        backgroundColor: 'transparent',
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
    );
}
