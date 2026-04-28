import type { DerivedTokens } from '@/lib/color-derive';
import { hslToHex } from '@/lib/color-utils';

interface ThemePreviewProps {
    tokens: DerivedTokens;
    name: string;
}

/** Converts HSL token string → usable CSS hsl() value */
function hsl(token: string) {
    return `hsl(${token})`;
}

/**
 * A self-contained live preview panel that renders sample UI elements
 * using the derived token set — no class names, just inline styles.
 */
export function ThemeBuilderPreview({ tokens, name }: ThemePreviewProps) {
    const bg   = hsl(tokens.background);
    const fg   = hsl(tokens.foreground);
    const cd   = hsl(tokens.card);
    const cdFg = hsl(tokens['card-foreground']);
    const pr   = hsl(tokens.primary);
    const prFg = hsl(tokens['primary-foreground']);
    const bd   = hsl(tokens.border);
    const mt   = hsl(tokens.muted);
    const mtFg = hsl(tokens['muted-foreground']);
    const ac   = hsl(tokens.accent);
    const acFg = hsl(tokens['accent-foreground']);
    const ds   = hsl(tokens.destructive);
    const dsFg = hsl(tokens['destructive-foreground']);
    const rng  = hsl(tokens.ring);
    const inBg = hsl(tokens['input-background']);

    return (
        <div
            className="rounded-xl overflow-hidden border flex flex-col text-[11px] select-none"
            style={{ background: bg, color: fg, borderColor: bd, minHeight: 260 }}
        >
            {/* Nav bar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: bd, background: cd }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: pr, color: prFg }}>F</div>
                <span className="font-semibold text-[11px]" style={{ color: cdFg }}>Flux</span>
                <div className="ml-auto flex gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: ds }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: pr }} />
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 gap-2 p-2">
                {/* Sidebar */}
                <div className="flex flex-col gap-1 w-16" style={{ flexShrink: 0 }}>
                    <div className="rounded px-1.5 py-1 font-medium" style={{ background: pr, color: prFg }}>Reader</div>
                    <div className="rounded px-1.5 py-1" style={{ background: ac, color: acFg }}>Games</div>
                    <div className="rounded px-1.5 py-1" style={{ color: mtFg }}>Vocab</div>
                    <div className="rounded px-1.5 py-1" style={{ color: mtFg }}>AI Chat</div>
                </div>

                {/* Main card */}
                <div className="flex-1 flex flex-col gap-1.5">
                    <div className="rounded-lg p-2 flex flex-col gap-1.5 border" style={{ background: cd, borderColor: bd }}>
                        <p className="font-semibold" style={{ color: cdFg }}>
                            {name || 'My Theme'}
                        </p>
                        <p className="leading-relaxed" style={{ color: mtFg, fontSize: 10 }}>
                            The quick brown fox jumps over the lazy dog. Reader text will look like this.
                        </p>

                        {/* Input row */}
                        <div
                            className="rounded border px-1.5 py-0.5 outline-none"
                            style={{ background: inBg, borderColor: rng, color: fg, fontSize: 10 }}
                        >
                            Sample input field...
                        </div>

                        {/* Button row */}
                        <div className="flex gap-1 mt-0.5">
                            <div className="rounded px-2 py-0.5 font-medium" style={{ background: pr, color: prFg }}>Save</div>
                            <div className="rounded px-2 py-0.5" style={{ background: mt, color: mtFg }}>Cancel</div>
                            <div className="ml-auto rounded px-2 py-0.5" style={{ background: ds, color: dsFg }}>Delete</div>
                        </div>
                    </div>

                    {/* Muted badge row */}
                    <div className="flex gap-1 flex-wrap">
                        {['English', 'Reading', 'AI'].map(tag => (
                            <div key={tag} className="rounded-full px-1.5 py-0.5" style={{ background: ac, color: acFg, fontSize: 9 }}>
                                {tag}
                            </div>
                        ))}
                        <div className="rounded-full px-1.5 py-0.5" style={{ background: mt, color: mtFg, fontSize: 9 }}>
                            + more
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer swatch row */}
            <div className="flex gap-1 px-2 pb-2">
                {[bg, cd, hsl(tokens.secondary), pr, ac, ds, hslToHex(tokens.border)].map((c, i) => (
                    <div key={i} className="flex-1 h-2 rounded-sm" style={{ background: c, border: `1px solid ${bd}` }} />
                ))}
            </div>
        </div>
    );
}
