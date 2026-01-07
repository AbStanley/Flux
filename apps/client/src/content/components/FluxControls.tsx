import React, { useState } from 'react';
import type { Mode } from '../hooks/useAIHandler';

const LANGUAGES = [
    'English', 'Spanish', 'Russian', 'French', 'German', 'Italian',
    'Portuguese', 'Japanese', 'Chinese',
];

interface FluxControlsProps {
    mode: Mode;
    targetLang: string;
    result: string;
    selection: { text: string };
    onModeChange: (mode: Mode) => void;
    onLangChange: (lang: string) => void;
    onAction: () => void;
}

export const FluxControls: React.FC<FluxControlsProps> = ({
    mode,
    targetLang,
    result,
    selection,
    onModeChange,
    onLangChange,
    onAction
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (result) {
            navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selection) {
            // @ts-ignore
            if (window.chrome?.storage?.local) {
                // @ts-ignore
                window.chrome.storage.local.set({ pendingText: selection.text }, () => {
                    // @ts-ignore
                    if (window.chrome?.runtime) {
                        // @ts-ignore
                        window.chrome.runtime.sendMessage({ type: 'TEXT_SELECTED', text: selection.text });
                        // @ts-ignore
                        window.chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
                    }
                });
            } else {
                // @ts-ignore
                if (window.chrome?.runtime) {
                    window.chrome.runtime.sendMessage({ type: 'TEXT_SELECTED', text: selection.text });
                    window.chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
                }
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ background: '#334155', borderRadius: '6px', padding: '2px', display: 'flex' }}>
                    <button
                        onClick={() => onModeChange('EXPLAIN')}
                        style={{
                            background: mode === 'EXPLAIN' ? '#475569' : 'transparent',
                            color: mode === 'EXPLAIN' ? 'white' : '#94a3b8',
                            border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                        }}
                    >Explain</button>
                    <button
                        onClick={() => onModeChange('TRANSLATE')}
                        style={{
                            background: mode === 'TRANSLATE' ? '#475569' : 'transparent',
                            color: mode === 'TRANSLATE' ? 'white' : '#94a3b8',
                            border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
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
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
                <select
                    value={targetLang}
                    onChange={(e) => onLangChange(e.target.value)}
                    style={{
                        flex: 1,
                        background: '#334155', color: 'white', border: 'none',
                        borderRadius: '6px', padding: '6px 12px', fontSize: '13px', outline: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>

                <button
                    onClick={onAction}
                    style={{
                        background: '#3b82f6', color: 'white', border: 'none',
                        borderRadius: '6px', padding: '6px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: '500'
                    }}
                >
                    Go
                </button>
            </div>
        </div>
    );
};
