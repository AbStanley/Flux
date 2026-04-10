import { useState, useRef, useCallback } from 'react';
import type { SubtitleCue } from '../../types/subtitles';
import type { FluxTheme } from '../../constants';
import { FluxMinimalPopup } from '../FluxMinimalPopup';
import { useAIHandler } from '../../hooks/useAIHandler';

interface Props {
    cue: SubtitleCue;
    color: string;
    label: string;
    targetLang: string;
    sourceLang: string;
    onTargetLangChange: (lang: string) => void;
    onSourceLangChange: (lang: string) => void;
    theme: FluxTheme;
    fontSize?: number;
}

export function SubtitleTrackLine({
    cue,
    color,
    label,
    targetLang,
    sourceLang,
    onTargetLangChange,
    onSourceLangChange,
    theme,
    fontSize = 22,
}: Props) {
    const [hoveredWord, setHoveredWord] = useState<{ text: string; x: number; y: number } | null>(null);
    const [isPopupHovered, setIsPopupHovered] = useState(false);
    const { result, loading, error, handleAction } = useAIHandler();
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const lastWord = useRef('');
    const leaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const onWordHover = useCallback((e: React.MouseEvent) => {
        const el = (e.target as HTMLElement).closest('[data-word]') as HTMLElement | null;
        const word = el?.dataset.word;
        if (!word || word === lastWord.current) return;
        lastWord.current = word;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (leaveTimer.current) clearTimeout(leaveTimer.current);

        const rect = el!.getBoundingClientRect();
        setHoveredWord({ text: word, x: rect.left + rect.width / 2, y: rect.top });

        debounceRef.current = setTimeout(() => {
            handleAction(word, 'TRANSLATE', targetLang, sourceLang, cue.text);
        }, 350);
    }, [targetLang, sourceLang, cue.text, handleAction]);

    const onLeave = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        leaveTimer.current = setTimeout(() => {
            if (!isPopupHovered) {
                setHoveredWord(null);
                lastWord.current = '';
            }
        }, 150);
    }, [isPopupHovered]);

    const tokens = cue.text.split(/(\s+)/);

    return (
        <div style={{ position: 'relative', textAlign: 'center' }}>
            {/* Track label */}
            <span style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: color,
                opacity: 0.7,
                marginRight: '8px',
            }}>
                {label}
            </span>

            {/* Cue text */}
            <span
                onMouseOver={onWordHover}
                onMouseLeave={onLeave}
                style={{
                    color,
                    fontSize: `${fontSize}px`,
                    fontWeight: 600,
                    textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9)',
                    lineHeight: 1.4,
                }}
            >
                {tokens.map((token, i) => {
                    const clean = token.trim().replace(/[.,!?;:"""'']/g, '');
                    return clean ? (
                        <span
                            key={i}
                            data-word={clean}
                            style={{
                                cursor: 'pointer',
                                transition: 'color 0.15s',
                                borderRadius: '2px',
                            }}
                            onMouseEnter={(e) => {
                                (e.target as HTMLElement).style.color = theme.accent;
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLElement).style.color = color;
                            }}
                        >
                            {token}
                        </span>
                    ) : (
                        <span key={i}>{token}</span>
                    );
                })}
            </span>

            {/* Translation popup */}
            {hoveredWord && (
                <div style={{
                    position: 'fixed',
                    top: hoveredWord.y,
                    left: hoveredWord.x,
                    zIndex: 2147483647,
                }}>
                    <FluxMinimalPopup
                        result={result}
                        loading={loading}
                        error={error}
                        targetLang={targetLang}
                        onLangChange={onTargetLangChange}
                        sourceLang={sourceLang}
                        onSourceLangChange={onSourceLangChange}
                        autoSave={false}
                        onAutoSaveChange={() => {}}
                        theme={theme}
                        onMouseEnter={() => { setIsPopupHovered(true); if (leaveTimer.current) clearTimeout(leaveTimer.current); }}
                        onMouseLeave={() => { setIsPopupHovered(false); onLeave(); }}
                    />
                </div>
            )}
        </div>
    );
}
