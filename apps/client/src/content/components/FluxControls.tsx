import { useState } from 'react';
import type { Mode } from '../hooks/useAIHandler';
import { LANGUAGES, type FluxTheme } from '../constants';
import { useFluxMessaging } from '../hooks/useFluxMessaging';
import { FluxIconButton } from './ui/FluxIconButton';
import { FluxSelect } from './ui/FluxSelect';
import { FluxButton } from './ui/FluxButton';
import { Copy, BookOpen, Zap, Check } from 'lucide-react';

interface FluxControlsProps {
    mode: Mode;
    targetLang: string;
    sourceLang?: string;
    result: string;
    selection: { text: string };
    onModeChange: (mode: Mode) => void;
    onLangChange: (lang: string) => void;
    onSourceLangChange?: (lang: string) => void;
    onSwapLanguages?: () => void;
    onAction: () => void;
    autoSave: boolean;
    onAutoSaveChange: (enabled: boolean) => void;
    isSaving?: boolean;
    theme: FluxTheme;
    themeId?: string;
    onThemeChange?: (id: string) => void;
    model: string;
    availableModels: string[];
    onModelChange: (model: string) => void;
}

export function FluxControls({
    mode,
    targetLang,
    sourceLang,
    result,
    selection,
    onModeChange,
    onLangChange,
    onSourceLangChange,
    onSwapLanguages,
    onAction,
    autoSave,
    onAutoSaveChange,
    isSaving = false,
    theme,
    model,
    availableModels,
    onModelChange,
}: FluxControlsProps) {
    const [copied, setCopied] = useState(false);
    const { selectAndOpen } = useFluxMessaging();

    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSave = () => {
        if (selection) {
            selectAndOpen(selection.text);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ background: theme.bgSolid, borderRadius: '7px', padding: '2px', display: 'flex', gap: '2px' }}>
                    <FluxIconButton
                        onClick={() => onModeChange('EXPLAIN')}
                        active={mode === 'EXPLAIN'}
                        theme={theme}
                    >
                        Explain
                    </FluxIconButton>
                    <FluxIconButton
                        onClick={() => onModeChange('TRANSLATE')}
                        active={mode === 'TRANSLATE'}
                        theme={theme}
                    >
                        Translate
                    </FluxIconButton>
                </div>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button 
                        onClick={handleCopy} 
                        style={{ 
                            background: 'transparent', border: 'none', color: copied ? theme.success : theme.textSecondary,
                            padding: '6px', cursor: 'pointer', transition: 'all 0.2s', borderRadius: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = theme.borderLight}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        title="Copy Result"
                    >
                        {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={2.5} />}
                    </button>

                    <button 
                        onClick={handleSave}
                        style={{ 
                            background: 'transparent', border: 'none', color: theme.textSecondary,
                            padding: '6px', cursor: 'pointer', transition: 'all 0.2s', borderRadius: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = theme.borderLight}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        title="Read in Flux"
                    >
                        <BookOpen size={14} strokeWidth={2.5} />
                    </button>

                    <button
                        onClick={() => onAutoSaveChange(!autoSave)}
                        title={autoSave ? "Auto-Save On" : "Auto-Save Off"}
                        style={{
                            background: isSaving ? theme.success : (autoSave ? theme.accentGlow : 'transparent'),
                            color: isSaving ? theme.bgSolid : (autoSave ? theme.accent : theme.textSecondary),
                            border: 'none',
                            padding: '6px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (!autoSave && !isSaving) e.currentTarget.style.background = theme.borderLight;
                        }}
                        onMouseLeave={(e) => {
                            if (!autoSave && !isSaving) e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        {isSaving ? <Check size={14} strokeWidth={3} /> : <Zap size={14} strokeWidth={2.5} fill={autoSave ? "currentColor" : "none"} />}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0, background: theme.bgSolid, borderRadius: '8px', padding: '1px 8px', border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FluxSelect
                            value={sourceLang || 'Auto'}
                            onChange={(val) => onSourceLangChange && onSourceLangChange(val)}
                            options={['Auto', ...LANGUAGES]}
                            theme={theme}
                            style={{ background: 'transparent', border: 'none', padding: '4px 0', fontSize: '11px', flex: 1 }}
                        />
                        <button 
                            onClick={() => onSwapLanguages?.()}
                            title="Swap Languages"
                            style={{ 
                                background: 'transparent', border: 'none', color: theme.textDim, fontSize: '12px', 
                                padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center' 
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = theme.accent}
                            onMouseLeave={(e) => e.currentTarget.style.color = theme.textDim}
                        >
                            →
                        </button>
                        <FluxSelect
                            value={targetLang}
                            onChange={onLangChange}
                            options={LANGUAGES}
                            theme={theme}
                            style={{ background: 'transparent', border: 'none', padding: '4px 0', fontSize: '11px', flex: 1 }}
                        />
                    </div>
                </div>

                <FluxButton
                    onClick={onAction}
                    theme={theme}
                    style={{
                        padding: '6px 14px',
                        borderRadius: '8px'
                    }}
                >
                    Go
                </FluxButton>
            </div>

            {/* Model selector - very subtle */}
            {availableModels.length > 0 && (
                <div style={{ borderTop: `1px solid ${theme.borderLight}`, paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '9px', color: theme.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Model</span>
                    <FluxSelect
                        value={model || availableModels[0]}
                        onChange={onModelChange}
                        options={availableModels}
                        theme={theme}
                        style={{ fontSize: '10px', background: 'transparent', border: 'none', padding: '2px 0', textAlign: 'right' }}
                    />
                </div>
            )}
        </div>
    );
}
