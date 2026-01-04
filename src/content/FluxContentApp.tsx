// In-Page UI Component
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { OllamaService } from '../infrastructure/ai/OllamaService';

// Simple types for internal state
type ViewState = 'HIDDEN' | 'FAB' | 'POPUP';
type Mode = 'EXPLAIN' | 'TRANSLATE';

// Initialize Service (Proxies to background if extension)
const aiService = new OllamaService(import.meta.env.VITE_OLLAMA_URL || 'http://127.0.0.1:11434');

const LANGUAGES = [
    'English', 'Spanish', 'Russian', 'French', 'German', 'Italian',
    'Portuguese', 'Japanese', 'Chinese',
];

/**
 * FluxContentApp: The In-Page Extension UI
 * 
 * This is the entry point for the "Content Script" portion of the extension.
 * It is injected into every webpage via Shadow DOM (`src/content/index.tsx`).
 * 
 * Role:
 * - Monitors text selection on the host page.
 * - Displays the "Quick Actions" popup (Translate/Explain).
 * - Communicates with the Background Script (`src/background/index.ts`) for AI processing.
 * - Syncs data to the Side Panel (Main App) via Chrome Storage.
 */
export const FluxContentApp: React.FC = () => {
    const [view, setView] = useState<ViewState>('HIDDEN');
    const [selection, setSelection] = useState<{ text: string, x: number, y: number } | null>(null);
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // New State for Controls - Default to TRANSLATE
    const [mode, setMode] = useState<Mode>('TRANSLATE');
    const [targetLang, setTargetLang] = useState<string>('English');

    const isHoveringRef = useRef(false);
    const viewRef = useRef<ViewState>('HIDDEN');
    const selectionRef = useRef<{ text: string, x: number, y: number } | null>(null);
    const stateRef = useRef({ mode, targetLang, loading });

    // Sync refs
    useEffect(() => { viewRef.current = view; }, [view]);
    useEffect(() => { selectionRef.current = selection; }, [selection]);
    useEffect(() => { stateRef.current = { mode, targetLang, loading }; }, [mode, targetLang, loading]);

    // Define handleAction outside useEffect so it can be called
    const handleAction = async (currentSelection: { text: string }, currentMode: Mode, currentLang: string) => {
        setLoading(true);
        setError(null);
        setResult('');

        try {
            let response = '';
            if (currentMode === 'EXPLAIN') {
                response = await aiService.explainText(currentSelection.text, currentLang);
            } else {
                response = await aiService.translateText(currentSelection.text, currentLang);
            }
            setResult(response);
        } catch (err: any) {
            console.error('AI Error:', err);
            setError(`Error: ${err.message || 'Failed to connect'} `);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('[Flux] Component Mounted');

        const initModel = async () => {
            try {
                const models = await aiService.getAvailableModels();
                if (models.length > 0) {
                    const preferred = models.find(m => m.includes('llama3') || m.includes('mistral') || m.includes('qwen')) || models[1];
                    aiService.setModel(preferred);
                }
            } catch (e) { console.warn('[Flux] Failed to fetch models', e); }
        };
        initModel();

        const handleMouseUp = (e: MouseEvent) => {
            setTimeout(() => {
                // Safeguard: Do not trigger if selection is inside our Shadow Host
                // The event target from document perspective will be the Host element itself
                const host = document.getElementById('flux-reader-host');
                if (host && (e.target === host || e.composedPath().includes(host))) {
                    console.log('[Flux] Selection ignored (inside extension UI)');
                    return;
                }

                const winSelection = window.getSelection();
                const text = winSelection?.toString().trim();

                if (text && text.length > 0) {
                    const range = winSelection?.getRangeAt(0);
                    const rect = range?.getBoundingClientRect();

                    // Check if new selection
                    if (rect && text !== selectionRef.current?.text) {
                        const newSelection = {
                            text,
                            x: rect.left + window.scrollX,
                            y: rect.bottom + window.scrollY + 10
                        };

                        setSelection(newSelection);
                        setView('POPUP');

                        // AUTO-TRIGGER
                        // Use persisted options from ref to avoid stale closures and hardcoded defaults
                        const currentMode = stateRef.current.mode;
                        const currentLang = stateRef.current.targetLang;

                        // If the user hasn't interacted yet, these will be default state (TRANSLATE, English)
                        // This fixes the issue of options resetting on new selection
                        handleAction(newSelection, currentMode, currentLang);

                        // Do NOT reset mode/lang here. Let them persist.
                    }
                } else if (!isHoveringRef.current) {
                    setView('HIDDEN');
                    setSelection(null);
                }
            }, 0);
        };

        const handleMouseDown = () => {
            if (!isHoveringRef.current) {
                setView('HIDDEN');
            }
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);
        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    // Wrapper for manual trigger
    const onManualAction = () => {
        if (selection) {
            handleAction(selection, mode, targetLang);
        }
    };

    if (view === 'HIDDEN' || !selection) return null;

    return (
        <div
            onMouseEnter={() => isHoveringRef.current = true}
            onMouseLeave={() => isHoveringRef.current = false}
            style={{
                position: 'absolute',
                left: selection.x,
                top: selection.y,
                zIndex: 2147483647,
                fontFamily: 'Inter, system-ui, sans-serif'
            }}
            onMouseDown={e => e.stopPropagation()}
        >
            {/* Direct Popup View */}
            <div style={{
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                width: '320px',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                fontSize: '14px',
                lineHeight: '1.5',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: '#94a3b8' }}>Flux Analysis</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); setView('HIDDEN'); }}
                        style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                    >✕</button>
                </div>

                {/* Controls */}
                {/* Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                    {/* Row 1: Toggles & Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Mode Toggle */}
                        <div style={{ background: '#334155', borderRadius: '6px', padding: '2px', display: 'flex' }}>
                            <button
                                onClick={() => setMode('EXPLAIN')}
                                style={{
                                    background: mode === 'EXPLAIN' ? '#475569' : 'transparent',
                                    color: mode === 'EXPLAIN' ? 'white' : '#94a3b8',
                                    border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                                }}
                            >Explain</button>
                            <button
                                onClick={() => setMode('TRANSLATE')}
                                style={{
                                    background: mode === 'TRANSLATE' ? '#475569' : 'transparent',
                                    color: mode === 'TRANSLATE' ? 'white' : '#94a3b8',
                                    border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                                }}
                            >Translate</button>
                        </div>

                        {/* Actions (Copy/Read) */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (result) {
                                        navigator.clipboard.writeText(result);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }
                                }}
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (selection) {
                                        // Save & Open Panel Logic
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
                                }}
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

                    {/* Row 2: Language & Go (Full Width) */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
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
                            onClick={onManualAction}
                            style={{
                                background: '#3b82f6', color: 'white', border: 'none',
                                borderRadius: '6px', padding: '6px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: '500'
                            }}
                        >
                            Go
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div>
                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', padding: '20px 0' }}>
                            <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                            Processing...
                        </div>
                    )}

                    {error && (
                        <div style={{ color: '#f87171', padding: '8px 0' }}>{error}</div>
                    )}

                    {!loading && !error && result && (
                        <div style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            background: '#0f172a',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            fontSize: '14px',
                            lineHeight: '1.6'
                        }}>
                            <ReactMarkdown
                                components={{
                                    // Override basic elements to ensure they look good with inline styles/Tailwind classes
                                    p: ({ node, ...props }) => <p style={{ marginBottom: '8px' }} {...props} />,
                                    ul: ({ node, ...props }) => <ul style={{ marginLeft: '16px', listStyleType: 'disc', marginBottom: '8px' }} {...props} />,
                                    ol: ({ node, ...props }) => <ol style={{ marginLeft: '16px', listStyleType: 'decimal', marginBottom: '8px' }} {...props} />,
                                    li: ({ node, ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
                                    strong: ({ node, ...props }) => <strong style={{ color: '#bae6fd', fontWeight: '600' }} {...props} />
                                }}
                            >
                                {result}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
