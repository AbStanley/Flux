import { useMemo } from 'react';
import type { DerivedTokens } from '@/lib/color-derive';
import { customThemeToFluxTheme } from '@/lib/color-derive';
import { hslToHex } from '@/lib/color-utils';
import { ThemePreviewPopup } from './ThemePreviewPopup';
import { Volume2, Search, RefreshCcw, Save, Youtube } from 'lucide-react';

interface Props { tokens: DerivedTokens; name: string; activeToken?: string | null; onHoverToken?: (t: string | null) => void; onClickToken?: (t: string) => void; }

export function ThemeBuilderPreview({ tokens, name, activeToken, onHoverToken, onClickToken }: Props) {
    // Derive the FluxTheme used by the extension popup / overlays
    const fluxTheme = useMemo(() => customThemeToFluxTheme({
        id: 'preview', name, colors: tokens,
    }), [tokens, name]);

    const hsl = (h: string) => `hsl(${h})`;
    const bg = hsl(tokens.background);
    const fg = hsl(tokens.foreground);
    const pr = hsl(tokens.primary);
    const prFg = hsl(tokens['primary-foreground']);
    const cd = hsl(tokens.card);
    const cdFg = hsl(tokens['card-foreground']);
    const bd = hsl(tokens.border);
    const mt = hsl(tokens.muted);
    const mtFg = hsl(tokens['muted-foreground']);
    const ac = hsl(tokens.accent);
    const acFg = hsl(tokens['accent-foreground']);
    const ds = hsl(tokens.destructive);
    const dsFg = hsl(tokens['destructive-foreground']);
    const sc = hsl(tokens.success ?? '142 60% 40%');
    const pk = hsl(tokens.popover);
    const pkFg = hsl(tokens['popover-foreground']);
    const inBg = hsl(tokens['input-background']);
    const link = hsl(tokens['link-color']);

    const isToken = (k: string) => activeToken === k;
    const hoverStyle = (k: string) => isToken(k) ? { outline: `2px solid ${pr}`, outlineOffset: -1, zIndex: 10, cursor: 'pointer' } : { cursor: 'pointer' };

    return (
        <div className="rounded-xl overflow-hidden border text-[10px] select-none transition-all" style={{ borderColor: bd, ...hoverStyle('background') }}
            onMouseEnter={() => onHoverToken?.('background')} onMouseLeave={() => onHoverToken?.(null)} onClick={(e) => { e.stopPropagation(); onClickToken?.('background'); }}>

            {/* ── 1. App UI ── */}
            <div style={{ background: bg, color: fg }}>
                {/* Nav */}
                <div style={{ background: cd, borderBottom: `1px solid ${bd}`, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', ...hoverStyle('card') }}
                    onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('card'); }} onMouseLeave={() => onHoverToken?.(null)} onClick={(e) => { e.stopPropagation(); onClickToken?.('card'); }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: pr, color: prFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, ...hoverStyle('primary') }}
                        onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('primary'); }} onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('card'); }} onClick={(e) => { e.stopPropagation(); onClickToken?.('primary'); }}>F</div>
                    <span style={{ fontWeight: 600, color: cdFg }}>Flux Reader — {name || 'My Theme'}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 10, background: pr, color: prFg }}>Reader</span>
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 10, background: ac, color: acFg }}>Vocab</span>
                        <span style={{ fontSize: 9, color: mtFg }}>AI Chat</span>
                    </div>
                </div>

                {/* Body */}
                <div style={{ display: 'flex', gap: 8, padding: 8 }}>
                    {/* Card */}
                    <div style={{ flex: 1, background: cd, border: `1px solid ${bd}`, borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 6, ...hoverStyle('card') }}
                        onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('card'); }} onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('background'); }} onClick={(e) => { e.stopPropagation(); onClickToken?.('card'); }}>
                        <p style={{ fontWeight: 700, color: cdFg }}>Word Manager</p>

                        {/* Vocab row with language tag + Due chip */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: `1px solid ${bd}` }}>
                            <span style={{ fontWeight: 600, color: cdFg, ...hoverStyle('link-color'), paddingBottom: 1, borderBottom: `2px solid ${link}` }}
                                onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('link-color'); }} onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('card'); }} onClick={(e) => { e.stopPropagation(); onClickToken?.('link-color'); }}>ephemeral</span>
                            <span style={{ fontSize: 9, color: mtFg, padding: '1px 5px', background: mt, borderRadius: 10, ...hoverStyle('muted') }}
                                onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('muted'); }} onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('card'); }} onClick={(e) => { e.stopPropagation(); onClickToken?.('muted'); }}>EN → ES</span>
                            <span style={{ fontSize: 9, color: dsFg, padding: '1px 5px', background: ds, borderRadius: 10, marginLeft: 'auto', ...hoverStyle('destructive') }}
                                onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('destructive'); }} onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('card'); }} onClick={(e) => { e.stopPropagation(); onClickToken?.('destructive'); }}>Due</span>
                        </div>

                        {/* Input */}
                        <div style={{ background: inBg, border: `1px solid ${bd}`, borderRadius: 5, padding: '3px 7px', color: mtFg, ...hoverStyle('input-background') }}
                            onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('input-background'); }} onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('card'); }} onClick={(e) => { e.stopPropagation(); onClickToken?.('input-background'); }}>
                            Search vocabulary...
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: 5 }}>
                            <span style={{ background: pr, color: prFg, borderRadius: 5, padding: '3px 8px', fontWeight: 600, ...hoverStyle('primary') }}
                                onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('primary'); }} onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('card'); }} onClick={(e) => { e.stopPropagation(); onClickToken?.('primary'); }}>Save</span>
                            <span style={{ background: mt, color: mtFg, borderRadius: 5, padding: '3px 8px', ...hoverStyle('muted') }}
                                onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('muted'); }} onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('card'); }} onClick={(e) => { e.stopPropagation(); onClickToken?.('muted'); }}>Cancel</span>
                            <span style={{ background: ds, color: dsFg, borderRadius: 5, padding: '3px 8px', marginLeft: 'auto', ...hoverStyle('destructive') }}
                                onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('destructive'); }} onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('card'); }} onClick={(e) => { e.stopPropagation(); onClickToken?.('destructive'); }}>Delete</span>
                        </div>

                        {/* Chat chips row */}
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <div style={{ padding: '2px 6px', borderRadius: 4, background: `${hslToHex(tokens.destructive)}22`, color: ds, border: `1px solid ${ds}44`, display: 'flex', gap: 4, alignItems: 'center', ...hoverStyle('destructive') }}
                                onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('destructive'); }} onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('card'); }} onClick={(e) => { e.stopPropagation(); onClickToken?.('destructive'); }}>
                                <span style={{ textDecoration: 'line-through', opacity: 0.8 }}>gramm<span style={{ background: `${hslToHex(tokens.destructive)}44`, padding: '0 1px', borderRadius: 2 }}>e</span>r</span>
                                <span style={{ opacity: 0.4 }}>→</span>
                                <span style={{ fontWeight: 700 }}>
                                    gramm<span style={{ background: `${hslToHex(tokens.destructive)}33`, padding: '0 1px', borderRadius: 2 }}>a</span>r
                                </span>
                            </div>
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: `${hslToHex(tokens.success ?? '142 60% 40%')}22`, color: sc, border: `1px solid ${sc}44`, ...hoverStyle('success') }}
                                onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('success'); }} onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('card'); }} onClick={(e) => { e.stopPropagation(); onClickToken?.('success'); }}>
                                ✓ Looks good
                            </span>
                        </div>
                    </div>

                    {/* Sidebar popover example */}
                    <div style={{ width: 110, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {/* Mini Activity Heatmap */}
                        <div style={{ background: pk, border: `1px solid ${bd}`, borderRadius: 6, padding: '8px 6px', color: pkFg, ...hoverStyle('popover') }}
                            onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('popover'); }}
                            onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('background'); }}
                            onClick={(e) => { e.stopPropagation(); onClickToken?.('popover'); }}>
                            
                            <p style={{ fontWeight: 800, fontSize: 7, marginBottom: 4, textTransform: 'uppercase', opacity: 0.6 }}>Activity</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2, marginBottom: 4 }}>
                                {[0.3, 0.6, 0.1, 0.9, 0.4, 0.2, 0.7, 0.0, 0.5, 0.8].map((v, i) => (
                                    <div key={i}
                                        style={{
                                            aspectRatio: '1/1',
                                            background: v === 0 ? 'transparent' : hsl(tokens['chart-trend']),
                                            opacity: v || 0.1,
                                            borderRadius: 2,
                                            border: `1px solid ${bd}`,
                                            ...hoverStyle('chart-trend')
                                        }}
                                        onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('chart-trend'); }}
                                        onMouseLeave={() => onHoverToken?.('popover')}
                                        onClick={(e) => { e.stopPropagation(); onClickToken?.('chart-trend'); }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Mini SRS Rating Buttons */}
                        <div style={{ display: 'flex', gap: 2 }}>
                            {[
                                { key: 'chart-alert', label: 'Again' },
                                { key: 'chart-growth', label: 'Hard' },
                                { key: 'chart-success', label: 'Good' },
                                { key: 'chart-trend', label: 'Easy' }
                            ].map(item => (
                                <div key={item.key}
                                    style={{
                                        flex: 1,
                                        height: 18,
                                        background: `${hslToHex(tokens[item.key as keyof DerivedTokens])}15`,
                                        border: `1px solid ${hslToHex(tokens[item.key as keyof DerivedTokens])}33`,
                                        borderRadius: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 6,
                                        fontWeight: 700,
                                        color: hsl(tokens[item.key as keyof DerivedTokens]),
                                        ...hoverStyle(item.key)
                                    }}
                                    onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.(item.key); }}
                                    onMouseLeave={() => onHoverToken?.('background')}
                                    onClick={(e) => { e.stopPropagation(); onClickToken?.(item.key); }}
                                >
                                    {item.label}
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {[bg, cd, pr, ac, ds, sc].map((c, i) => (
                                <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c, border: `1px solid ${bd}` }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 2. Reading Page Hover & Inline Popup ── */}
            <div style={{ background: mt, borderTop: `1px solid ${bd}`, padding: 8 }}>
                <p style={{ color: mtFg, fontSize: 9, marginBottom: 5, fontWeight: 600 }}>READING PAGE: INLINE POPUP</p>
                <div style={{ background: bg, padding: '20px 12px 12px', borderRadius: 8, border: `1px solid ${bd}`, position: 'relative', ...hoverStyle('background') }}
                    onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('background'); }} onMouseLeave={() => onHoverToken?.(null)} onClick={(e) => { e.stopPropagation(); onClickToken?.('background'); }}>

                    {/* Inline Selection Popup (ReaderPopup style) */}
                    <div style={{
                        position: 'absolute', top: -4, left: 12,
                        background: link, color: prFg, padding: '4px 8px', borderRadius: 6,
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        ...hoverStyle('link-color')
                    }}
                        onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('link-color'); }} onMouseLeave={() => onHoverToken?.(null)} onClick={(e) => { e.stopPropagation(); onClickToken?.('link-color'); }}>
                        <span>was</span>
                        <div style={{ display: 'flex', gap: 2, opacity: 0.9 }}>
                            <Volume2 size={12} /> <Search size={12} /> <RefreshCcw size={12} /> <Save size={12} />
                        </div>
                    </div>

                    <span style={{ color: mtFg, ...hoverStyle('muted-foreground') }}
                        onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('muted-foreground'); }}
                        onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('background'); }}
                        onClick={(e) => { e.stopPropagation(); onClickToken?.('muted-foreground'); }}>The student opened the book and began to read. The word </span>
                    <span style={{ color: link, borderBottom: `2px solid ${link}`, paddingBottom: 1, fontWeight: 600, ...hoverStyle('link-color') }}
                        onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('link-color'); }} onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('background'); }} onClick={(e) => { e.stopPropagation(); onClickToken?.('link-color'); }}>
                        ephemeral
                    </span>
                    <span style={{ color: mtFg }}> caught their attention.</span>
                </div>
            </div>

            {/* ── 3. Rich Details & Markdown ── */}
            <div style={{ background: mt, borderTop: `1px solid ${bd}`, padding: 8 }}>
                <p style={{ color: mtFg, fontSize: 9, marginBottom: 5, fontWeight: 600 }}>RICH DETAILS & MARKDOWN</p>
                <div style={{ background: bg, padding: '12px', borderRadius: 8, border: `1px solid ${bd}`, ...hoverStyle('background') }}
                    onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('background'); }} onMouseLeave={() => onHoverToken?.(null)} onClick={(e) => { e.stopPropagation(); onClickToken?.('background'); }}>

                    <p style={{ fontWeight: 700, color: pr, marginBottom: 6, ...hoverStyle('primary') }}
                        onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('primary'); }} onMouseLeave={() => onHoverToken?.(null)} onClick={(e) => { e.stopPropagation(); onClickToken?.('primary'); }}>Structure Analysis</p>

                    <div style={{ paddingLeft: 8, borderLeft: `2px solid ${pr}`, display: 'flex', flexDirection: 'column', gap: 4, ...hoverStyle('primary') }}
                        onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('primary'); }} onMouseLeave={() => onHoverToken?.(null)} onClick={(e) => { e.stopPropagation(); onClickToken?.('primary'); }}>
                        <div style={{ fontStyle: 'italic', color: fg, fontSize: 11, ...hoverStyle('foreground') }}
                            onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('foreground'); }} onMouseLeave={() => onHoverToken?.(null)} onClick={(e) => { e.stopPropagation(); onClickToken?.('foreground'); }}>
                            Ich habe das Buch gelesen.
                        </div>
                        <div style={{ color: mtFg, fontSize: 11, ...hoverStyle('muted-foreground') }}
                            onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('muted-foreground'); }} onMouseLeave={() => onHoverToken?.(null)} onClick={(e) => { e.stopPropagation(); onClickToken?.('muted-foreground'); }}>
                            I have read that book.
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 4. EXTENSION SPECIFIC PREVIEWS (GROUPED AT BOTTOM) ── */}
            <div style={{ background: mt, borderTop: `1px solid ${bd}`, padding: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: ac }} />
                    <span style={{ fontSize: 9, fontWeight: 800, color: mtFg, letterSpacing: '0.05em' }}>BROWSER EXTENSION EXPERIENCE</span>
                </div>

                {/* A. YouTube Subtitles Preview */}
                <div style={{
                    background: '#000', padding: 12, position: 'relative', minHeight: 90,
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center',
                    borderRadius: 8, border: `1px solid ${bd}`, overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: 6, left: 8, display: 'flex', alignItems: 'center', gap: 4, color: 'white', opacity: 0.6 }}>
                        <Youtube size={12} fill="red" stroke="none" />
                        <span style={{ fontSize: 8 }}>YouTube Player</span>
                    </div>

                    {/* Subtitle Overlay Mockup - Map to POPOVER */}
                    <div style={{
                        background: fluxTheme.bgSolid, color: fluxTheme.text, padding: '8px 16px', borderRadius: 16,
                        border: `1px solid ${fluxTheme.border}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px ${fluxTheme.borderLight}`,
                        maxWidth: '85%', textAlign: 'center',
                        animation: 'pulse 2s infinite ease-in-out',
                        ...hoverStyle('popover')
                    }}
                        onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('popover'); }}
                        onMouseLeave={() => onHoverToken?.(null)}
                        onClick={(e) => { e.stopPropagation(); onClickToken?.('popover'); }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
                            <span style={{
                                color: fluxTheme.accent,
                                background: fluxTheme.accentGlow,
                                padding: '1px 4px',
                                borderRadius: 4,
                                fontWeight: 700,
                                ...hoverStyle('primary')
                            }}
                                onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('primary'); }}
                                onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('popover'); }}
                                onClick={(e) => { e.stopPropagation(); onClickToken?.('primary'); }}>Ich</span>
                            <span>habe</span>
                            <span style={{ borderBottom: `2px solid ${fluxTheme.accent}`, ...hoverStyle('primary') }}
                                onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('primary'); }}
                                onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('popover'); }}
                                onClick={(e) => { e.stopPropagation(); onClickToken?.('primary'); }}>gelesen</span>
                        </div>
                        <div style={{ fontSize: 9, color: fluxTheme.textSecondary, opacity: 0.8, ...hoverStyle('muted-foreground') }}
                            onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('muted-foreground'); }}
                            onMouseLeave={(e) => { e.stopPropagation(); onHoverToken?.('popover'); }}
                            onClick={(e) => { e.stopPropagation(); onClickToken?.('muted-foreground'); }}>
                            I have read
                        </div>
                    </div>
                </div>

                {/* B. Extension Translation Popover */}
                <div style={{ background: cd, padding: '12px 10px', borderRadius: 8, border: `1px solid ${bd}`, ...hoverStyle('card') }}
                    onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('card'); }}
                    onMouseLeave={() => onHoverToken?.(null)}
                    onClick={(e) => { e.stopPropagation(); onClickToken?.('card'); }}>
                    <ThemePreviewPopup theme={fluxTheme} activeToken={activeToken} onHoverToken={onHoverToken} onClickToken={onClickToken} />
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.01); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
