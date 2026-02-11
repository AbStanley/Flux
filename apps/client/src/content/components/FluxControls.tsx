import { useState } from 'react';
import type { Mode } from '../hooks/useAIHandler';
import { LANGUAGES } from '../constants';
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
    onAction: () => void;
    autoSave: boolean;
    onAutoSaveChange: (enabled: boolean) => void;
    isSaving?: boolean;
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
    onAction,
    autoSave,
    onAutoSaveChange,
    isSaving = false
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
                <div style={{ background: '#334155', borderRadius: '6px', padding: '2px', display: 'flex' }}>
                    <FluxIconButton
                        onClick={() => onModeChange('EXPLAIN')}
                        active={mode === 'EXPLAIN'}
                        style={{ padding: '4px 8px', fontSize: '0.85em' }}
                    >
                        Explain
                    </FluxIconButton>
                    <FluxIconButton
                        onClick={() => onModeChange('TRANSLATE')}
                        active={mode === 'TRANSLATE'}
                        style={{ padding: '4px 8px', fontSize: '0.85em' }}
                    >
                        Translate
                    </FluxIconButton>
                </div>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <FluxIconButton onClick={handleCopy} title="Copy Result">
                        {copied ? (
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4ade80' }}>✓</span>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        )}
                    </FluxIconButton>

                    <FluxIconButton onClick={handleSave} title="Read in Flux">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    </FluxIconButton>

                    <FluxIconButton
                        onClick={() => onAutoSaveChange(!autoSave)}
                        title={autoSave ? "Auto-Save On" : "Auto-Save Off"}
                        style={{
                            background: isSaving ? '#22c55e' : (autoSave ? 'rgba(59, 130, 246, 0.2)' : 'transparent'),
                            color: isSaving ? 'white' : (autoSave ? '#3b82f6' : '#94a3b8'),
                            border: autoSave ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
                            marginLeft: '4px',
                            boxShadow: autoSave ? '0 0 8px rgba(59, 130, 246, 0.2)' : 'none'
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
                </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <FluxSelect
                    value={sourceLang || 'Auto'}
                    onChange={(val) => onSourceLangChange && onSourceLangChange(val)}
                    options={['Auto', ...LANGUAGES]}
                    title="Source Language"
                    style={{ flex: 1, minWidth: 0, paddingRight: '4px' }}
                />
                <div style={{ color: '#64748b', fontWeight: 'bold', fontSize: '14px' }}>→</div>

                <FluxSelect
                    value={targetLang}
                    onChange={onLangChange}
                    options={LANGUAGES}
                    title="Target Language"
                    style={{ flex: 1, minWidth: 0, paddingRight: '4px' }}
                />

                <FluxButton
                    onClick={onAction}
                    style={{
                        padding: '8px 12px',
                        minWidth: '42px',
                        borderRadius: '10px'
                    }}
                >
                    Go
                </FluxButton>
            </div>
        </div>
    );
}
