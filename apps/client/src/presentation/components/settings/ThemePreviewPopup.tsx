import type { FluxTheme } from '@/content/constants';
import { Volume2, Search, RefreshCcw, Save } from 'lucide-react';

interface Props { theme: FluxTheme; activeToken?: string | null; onHoverToken?: (t: string | null) => void; onClickToken?: (t: string) => void; }

/** Miniature translation popup rendered with inline styles — mirrors the real FluxPopup appearance. */
export function ThemePreviewPopup({ theme: t, activeToken, onHoverToken, onClickToken }: Props) {
    const isToken = (k: string) => activeToken === k;
    const hoverStyle = (k: string) => isToken(k) ? { outline: `2px solid ${t.error}`, outlineOffset: -2, zIndex: 10, cursor: 'pointer' } : { cursor: 'pointer' };
    
    return (
        <div className="space-y-2">
            {/* Reading line with hovered word */}
            <div
                className="rounded-lg px-3 py-2.5 text-[11px] leading-relaxed transition-all"
                style={{ background: t.bgSolid, color: t.text, border: `1px solid ${t.border}`, ...hoverStyle('background') }}
                onMouseEnter={() => onHoverToken?.('background')}
                onMouseLeave={() => onHoverToken?.(null)}
                onClick={(e) => { e.stopPropagation(); onClickToken?.('background'); }}
            >
                <span style={{ color: t.textSecondary }}>The student opened the book and began to read. The word </span>
                <span style={{
                    color: t.accent,
                    background: t.accentGlow,
                    borderRadius: 4,
                    padding: '1px 4px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    ...hoverStyle('primary')
                }}
                onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('primary'); }}
                onMouseLeave={() => onHoverToken?.(null)}
                onClick={(e) => { e.stopPropagation(); onClickToken?.('primary'); }}
                >ephemeral</span>
                <span style={{ color: t.textSecondary }}> caught their attention immediately.</span>
            </div>

            {/* Translation popup */}
            <div
                className="rounded-xl text-[11px] transition-all"
                style={{
                    background: t.bg,
                    border: `1px solid ${t.border}`,
                    backdropFilter: 'blur(12px)',
                    boxShadow: `0 12px 32px rgba(0,0,0,0.35), 0 0 0 1px ${t.border}`,
                    overflow: 'hidden',
                    ...hoverStyle('popover')
                }}
                onMouseEnter={() => onHoverToken?.('popover')}
                onMouseLeave={() => onHoverToken?.(null)}
                onClick={(e) => { e.stopPropagation(); onClickToken?.('popover'); }}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderBottom: `1px solid ${t.borderLight}` }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: t.bg, fontWeight: 700 }}>F</div>
                    <span style={{ flex: 1, fontWeight: 600, color: t.text }}>ephemeral</span>
                    <div style={{ display: 'flex', gap: 4, opacity: 0.8 }}>
                        {[Volume2, Search, RefreshCcw, Save].map((Icon, i) => (
                            <button key={i} style={{ background: t.borderLight, border: `1px solid ${t.borderLight}`, color: t.text, borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <Icon size={12} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Translation result */}
                <div style={{ padding: '10px 12px', color: t.text, fontWeight: 500, lineHeight: 1.5 }}>
                    Lasting for only a short time; transitory.
                    <strong style={{ color: t.accent }}> (adjective)</strong>
                </div>

                {/* Error state */}
                <div style={{ margin: '0 12px 8px', padding: '6px 10px', background: `${t.error}18`, border: `1px solid ${t.error}40`, borderRadius: 8, color: t.error, fontSize: 10, ...hoverStyle('destructive') }}
                    onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('destructive'); }}
                    onMouseLeave={() => onHoverToken?.(null)}
                    onClick={(e) => { e.stopPropagation(); onClickToken?.('destructive'); }}>
                    ⚠ Example error state — connection timeout
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderTop: `1px solid ${t.borderLight}`, background: t.surface, ...hoverStyle('card') }}
                    onMouseEnter={(e) => { e.stopPropagation(); onHoverToken?.('card'); }}
                    onMouseLeave={() => onHoverToken?.(null)}
                    onClick={(e) => { e.stopPropagation(); onClickToken?.('card'); }}>
                    <div style={{ display: 'flex', background: t.bgSolid, borderRadius: 6, padding: 2, gap: 2 }}>
                        {['Translate', 'Explain'].map((m, i) => (
                            <span key={m} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: i === 0 ? t.accent : 'transparent', color: i === 0 ? t.bg : t.textSecondary, cursor: 'pointer' }}>{m}</span>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: t.textSecondary, background: t.bgSolid, borderRadius: 4, padding: '2px 6px' }}>Auto</span>
                        <span style={{ color: t.textDim, fontSize: 10 }}>→</span>
                        <span style={{ fontSize: 10, color: t.textSecondary, background: t.bgSolid, borderRadius: 4, padding: '2px 6px' }}>English</span>
                        <button style={{ background: t.accent, border: 'none', color: t.bg, borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer', boxShadow: `0 0 8px ${t.accentGlow}` }}>Go</button>
                    </div>
                </div>
            </div>

            {/* Hover/save success state */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 10, padding: '4px 2px' }}>
                <span style={{ color: t.success, fontWeight: 600 }}>✓ Saved to vocabulary</span>
                <span style={{ color: t.textDim }}>·</span>
                <span style={{ color: t.info, textDecoration: 'underline', cursor: 'pointer' }}>Open in Flux</span>
            </div>
        </div>
    );
}
