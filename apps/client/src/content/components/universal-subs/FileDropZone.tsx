import { useState, useRef, useCallback } from 'react';
import type { FluxTheme } from '../../constants';

interface Props {
    onFiles: (files: File[]) => void;
    onUrl: (url: string) => void;
    theme: FluxTheme;
    compact?: boolean;
}

export function FileDropZone({ onFiles, onUrl, theme, compact }: Props) {
    const [isDragging, setIsDragging] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [showUrl, setShowUrl] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(f =>
            /\.(srt|vtt)$/i.test(f.name)
        );
        if (files.length > 0) onFiles(files);
    }, [onFiles]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) onFiles(files);
        e.target.value = '';
    }, [onFiles]);

    const handleUrlSubmit = () => {
        const url = urlInput.trim();
        if (url) {
            onUrl(url);
            setUrlInput('');
            setShowUrl(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Main actions row */}
            <div style={{ display: 'flex', gap: '6px' }}>
                {/* Upload from disk */}
                <button
                    onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                    style={{
                        flex: 1,
                        padding: compact ? '8px' : '12px',
                        borderRadius: '10px',
                        border: `1px solid ${theme.border}`,
                        backgroundColor: theme.surface,
                        color: theme.text,
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                    }}
                >
                    <span>📁</span> Upload .srt / .vtt
                </button>

                {/* URL toggle */}
                <button
                    onClick={() => setShowUrl(!showUrl)}
                    style={{
                        padding: compact ? '8px 12px' : '12px 16px',
                        borderRadius: '10px',
                        border: `1px solid ${showUrl ? theme.accent : theme.border}`,
                        backgroundColor: showUrl ? theme.accentGlow : theme.surface,
                        color: showUrl ? theme.accent : theme.textSecondary,
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                    }}
                    title="Load from URL"
                >
                    🔗
                </button>
            </div>

            <input
                ref={fileRef}
                type="file"
                accept=".srt,.vtt"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileInput}
            />

            {/* Drop zone — always active */}
            <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={(e) => { e.stopPropagation(); setIsDragging(false); }}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${isDragging ? theme.accent : theme.border}`,
                    borderRadius: '10px',
                    padding: compact ? '10px' : '14px',
                    textAlign: 'center',
                    backgroundColor: isDragging ? theme.accentGlow : 'transparent',
                    transition: 'all 0.2s',
                    color: theme.textSecondary,
                    fontSize: '12px',
                }}
            >
                {isDragging ? (
                    <span style={{ color: theme.accent, fontWeight: 600 }}>Drop files here</span>
                ) : (
                    'or drag & drop subtitle files here'
                )}
            </div>

            {/* URL input — collapsible */}
            {showUrl && (
                <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                        placeholder="https://example.com/subs.srt"
                        autoFocus
                        style={{
                            flex: 1,
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: `1px solid ${theme.border}`,
                            backgroundColor: theme.surface,
                            color: theme.text,
                            fontSize: '12px',
                            outline: 'none',
                        }}
                    />
                    <button
                        onClick={handleUrlSubmit}
                        disabled={!urlInput.trim()}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            backgroundColor: theme.accent,
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: urlInput.trim() ? 'pointer' : 'not-allowed',
                            opacity: urlInput.trim() ? 1 : 0.5,
                        }}
                    >
                        Load
                    </button>
                </div>
            )}
        </div>
    );
}
