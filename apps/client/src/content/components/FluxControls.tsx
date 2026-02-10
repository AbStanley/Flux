import { useState, type MouseEvent } from 'react';
import type { Mode } from '../hooks/useAIHandler';
import { useReaderStore } from '@/presentation/features/reader/store/useReaderStore';
import { SelectionMode } from '@/core/types';

const LANGUAGES = [
    'English', 'Spanish', 'Russian', 'French', 'German', 'Italian',
    'Portuguese', 'Japanese', 'Chinese',
];

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
    const { selectionMode, setSelectionMode } = useReaderStore();

    const handleCopy = (e: MouseEvent) => {
        e.stopPropagation();
        if (result) {
            navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSave = (e: MouseEvent) => {
        e.stopPropagation();
        if (selection) {
            if (window.chrome?.storage?.local) {
                window.chrome.storage.local.set({ pendingText: selection.text }, () => {
                    if (window.chrome?.runtime) {
                        window.chrome.runtime.sendMessage({ type: 'TEXT_SELECTED', text: selection.text });
                        window.chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
                    }
                });
            } else if (window.chrome?.runtime) {
                window.chrome.runtime.sendMessage({ type: 'TEXT_SELECTED', text: selection.text });
                window.chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ background: '#334155', borderRadius: '6px', padding: '2px', display: 'flex' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onModeChange('EXPLAIN'); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        style={{
                            background: mode === 'EXPLAIN' ? '#475569' : 'transparent',
                            color: mode === 'EXPLAIN' ? 'white' : '#94a3b8',
                            border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em'
                        }}
                    >Explain</button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onModeChange('TRANSLATE'); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        style={{
                            background: mode === 'TRANSLATE' ? '#475569' : 'transparent',
                            color: mode === 'TRANSLATE' ? 'white' : '#94a3b8',
                            border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em'
                        }}
                    >Translate</button>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={handleCopy}
                        title="Copy Result"
                        style={{
                            background: '#334155', color: copied ? '#4ade80' : '#94a3b8', border: 'none',
                            borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', minWidth: '28px', justifyContent: 'center'
                        }}
                    >
                        {copied ? (
                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        )}
                    </button>

                    <button
                        onClick={handleSave}
                        title="Read in Flux"
                        style={{
                            background: '#334155', color: '#94a3b8', border: 'none',
                            borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    </button>

                    <div style={{ background: '#334155', borderRadius: '6px', padding: '2px', display: 'flex', marginLeft: '4px' }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectionMode(SelectionMode.Word); }}
                            title="Word Mode"
                            style={{
                                background: selectionMode === SelectionMode.Word ? '#475569' : 'transparent',
                                color: selectionMode === SelectionMode.Word ? 'white' : '#94a3b8',
                                border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold'
                            }}
                        >W</button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectionMode(SelectionMode.Sentence); }}
                            title="Sentence Mode"
                            style={{
                                background: selectionMode === SelectionMode.Sentence ? '#475569' : 'transparent',
                                color: selectionMode === SelectionMode.Sentence ? 'white' : '#94a3b8',
                                border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold'
                            }}
                        >S</button>
                    </div>

                    {/* Auto-Save Toggle */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onAutoSaveChange(!autoSave); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onMouseUp={(e) => e.stopPropagation()}
                        title={autoSave ? "Auto-Save On" : "Auto-Save Off"}
                        style={{
                            background: isSaving ? '#22c55e' : (autoSave ? 'rgba(59, 130, 246, 0.2)' : 'transparent'),
                            color: isSaving ? 'white' : (autoSave ? '#3b82f6' : '#94a3b8'),
                            border: autoSave ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
                            borderRadius: '6px',
                            padding: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '4px',
                            transition: 'all 0.2s',
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
                        {/* {autoSave && <span style={{ fontSize: '10px', fontWeight: 'bold', marginLeft: '2px' }}>ON</span>} */}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
                <select
                    value={sourceLang || 'Auto'}
                    onChange={(e) => onSourceLangChange && onSourceLangChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    title="Source Language"
                    style={{
                        width: '85px',
                        background: 'rgba(51, 65, 85, 0.5)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '8px 8px',
                        fontSize: '0.9em',
                        outline: 'none',
                        cursor: 'pointer',
                        textAlign: 'center'
                    }}
                >
                    <option value="Auto">Auto</option>
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>→</div>

                <select
                    value={targetLang}
                    onChange={(e) => onLangChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    style={{
                        flex: 1,
                        background: 'rgba(51, 65, 85, 0.5)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontSize: '0.9em',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                    title="Target Language"
                >
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>

                <button
                    onClick={onAction}
                    style={{
                        background: '#3b82f6', color: 'white', border: 'none',
                        borderRadius: '10px', padding: '8px 16px', fontSize: '0.9em', cursor: 'pointer', fontWeight: 'bold',
                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                    }}
                >
                    Go
                </button>
            </div>


        </div>
    );
}
