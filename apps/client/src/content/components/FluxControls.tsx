import { useState } from 'react';
import type { Mode } from '../hooks/useAIHandler';
import { LANGUAGES, THEMES, type FluxTheme } from '../constants';
import { useFluxMessaging } from '../hooks/useFluxMessaging';
import { FluxIconButton } from './ui/FluxIconButton';
import { FluxSelect } from './ui/FluxSelect';
import { FluxButton } from './ui/FluxButton';

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
    themeId: string;
    onThemeChange: (id: string) => void;
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
    themeId,
    onThemeChange,
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ background: theme.surface, borderRadius: '6px', padding: '2px', display: 'flex' }}>
                    <FluxIconButton
                        onClick={() => onModeChange('EXPLAIN')}
                        active={mode === 'EXPLAIN'}
                        theme={theme}
                        style={{ padding: '4px 8px', fontSize: '0.85em' }}
                    >
                        Explain
                    </FluxIconButton>
                    <FluxIconButton
                        onClick={() => onModeChange('TRANSLATE')}
                        active={mode === 'TRANSLATE'}
                        theme={theme}
                        style={{ padding: '4px 8px', fontSize: '0.85em' }}
                    >
                        Translate
                    </FluxIconButton>
                </div>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <FluxIconButton onClick={handleCopy} title="Copy Result" theme={theme}>
                        {copied ? (
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: theme.success }}>✓</span>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        )}
                    </FluxIconButton>

                    <FluxIconButton onClick={handleSave} title="Read in Flux" theme={theme}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    </FluxIconButton>

                    <FluxIconButton
                        onClick={() => onAutoSaveChange(!autoSave)}
                        title={autoSave ? "Auto-Save On" : "Auto-Save Off"}
                        theme={theme}
                        style={{
                            background: isSaving ? theme.success : (autoSave ? theme.accentGlow : 'transparent'),
                            color: isSaving ? 'white' : (autoSave ? theme.accent : theme.textSecondary),
                            border: autoSave ? `1px solid ${theme.accent}` : '1px solid transparent',
                            marginLeft: '4px',
                            boxShadow: autoSave ? `0 0 8px ${theme.accentGlow}` : 'none'
                        }}
                    >
                        {isSaving ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                            </svg>
                        )}
                    </FluxIconButton>

                    {/* Theme picker */}
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginLeft: '6px' }}>
                        {Object.values(THEMES).map(t => (
                            <button
                                key={t.id}
                                onClick={() => onThemeChange(t.id)}
                                title={t.name}
                                style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    background: t.dot,
                                    border: themeId === t.id ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                                    cursor: 'pointer',
                                    padding: 0,
                                    boxShadow: themeId === t.id ? `0 0 6px ${theme.accent}` : 'none',
                                    transition: 'all 0.2s',
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <FluxSelect
                    value={sourceLang || 'Auto'}
                    onChange={(val) => onSourceLangChange && onSourceLangChange(val)}
                    options={['Auto', ...LANGUAGES]}
                    title="Source Language"
                    theme={theme}
                    style={{ flex: 1, minWidth: 0, paddingRight: '4px' }}
                />

                <FluxIconButton
                    onClick={() => onSwapLanguages?.()}
                    title="Swap Languages"
                    theme={theme}
                    style={{
                        padding: '4px',
                        color: theme.textSecondary,
                        fontSize: '14px',
                        minWidth: '24px'
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
                    style={{ flex: 1, minWidth: 0, paddingRight: '4px' }}
                />

                <FluxButton
                    onClick={onAction}
                    theme={theme}
                    style={{
                        padding: '8px 12px',
                        minWidth: '42px',
                        borderRadius: '10px'
                    }}
                >
                    Go
                </FluxButton>
            </div>

            {/* Model selector */}
            {availableModels.length > 0 && (
                <FluxSelect
                    value={model || availableModels[0]}
                    onChange={onModelChange}
                    options={availableModels}
                    title="AI Model"
                    theme={theme}
                    style={{ fontSize: '11px' }}
                />
            )}
        </div>
    );
}
