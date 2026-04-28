import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { hslToHex } from '@/lib/color-utils';
import { hexToHsl } from '@/lib/color-utils';
import type { DerivedTokens } from '@/lib/color-derive';
import { TOKEN_GROUPS } from '@/lib/theme-presets';
import type { TokenGroup } from '@/lib/theme-presets';

interface Props {
    tokens: DerivedTokens;
    onChange: (key: keyof DerivedTokens, hsl: string) => void;
    activeToken?: string | null;
    clickedToken?: string | null;
    onHoverToken?: (t: string | null) => void;
}

function TokenRow({ tokenKey, label, hint, hsl, onChange, isActive, isClicked, onHover }: {
    tokenKey: keyof DerivedTokens;
    label: string;
    hint: string;
    hsl: string;
    onChange: (key: keyof DerivedTokens, hsl: string) => void;
    isActive: boolean;
    isClicked: boolean;
    onHover: () => void;
}) {
    const hex = hslToHex(hsl);
    const rowRef = useRef<HTMLLabelElement>(null);

    useEffect(() => {
        if (isClicked && rowRef.current) {
            rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isClicked]);

    const activeStyles = 'bg-primary/10 border-primary/30 ring-1 ring-primary/30 shadow-sm z-10 relative';
    const clickedStyles = 'bg-primary/20 border-primary shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background z-20 scale-[1.02]';

    return (
        <label
            ref={rowRef}
            htmlFor={`token-${tokenKey}`}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer group transition-all duration-300 ${isClicked ? clickedStyles : isActive ? activeStyles : 'hover:bg-muted/40'}`}
            onMouseEnter={onHover}
        >
            {/* Swatch */}
            <div className="relative flex-shrink-0 w-8 h-8 rounded-md border border-border shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                <div className="absolute inset-0" style={{ background: `hsl(${hsl})` }} />
                <input
                    id={`token-${tokenKey}`}
                    type="color"
                    value={hex}
                    onChange={e => onChange(tokenKey, hexToHsl(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
            </div>
            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{hint}</p>
            </div>
            {/* Hex */}
            <span className="text-[11px] font-mono text-muted-foreground tabular-nums flex-shrink-0">{hex}</span>
        </label>
    );
}

function GroupSection({ group, tokens, onChange, activeToken, clickedToken, onHoverToken }: {
    group: TokenGroup;
    tokens: DerivedTokens;
    onChange: (key: keyof DerivedTokens, hsl: string) => void;
    activeToken?: string | null;
    clickedToken?: string | null;
    onHoverToken?: (t: string | null) => void;
}) {
    const hasActive = group.tokens.some(t => t.key === activeToken || t.key === clickedToken);
    const hasClicked = group.tokens.some(t => t.key === clickedToken);
    const [open, setOpen] = useState(true);
    const [prevClicked, setPrevClicked] = useState(clickedToken);

    // Auto-expand ONLY when a token inside gets explicitly clicked
    // We do this during render to avoid cascading updates in useEffect
    if (clickedToken !== prevClicked) {
        setPrevClicked(clickedToken);
        if (hasClicked) {
            setOpen(true);
        }
    }

    return (
        <div className={`border rounded-xl transition-all duration-300 ${hasActive ? 'border-primary/50 shadow-sm' : 'border-border'}`}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 transition-colors text-left rounded-t-xl ${hasActive ? 'bg-primary/5' : 'bg-muted/30 hover:bg-muted/50'} ${!open && 'rounded-b-xl'}`}
            >
                <span className="text-sm">{group.emoji}</span>
                <span className="text-sm font-semibold flex-1">{group.label}</span>
                {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
            {open && (
                <div className="divide-y divide-border/50">
                    {group.tokens.map(t => (
                        <TokenRow
                            key={t.key}
                            tokenKey={t.key}
                            label={t.label}
                            hint={t.hint}
                            hsl={tokens[t.key] ?? '0 0% 50%'}
                            onChange={onChange}
                            isActive={activeToken === t.key}
                            isClicked={clickedToken === t.key}
                            onHover={() => onHoverToken?.(t.key)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/** Full token editor — all CSS variables grouped by semantic category. */
export function ThemeBuilderAdvanced({ tokens, onChange, activeToken, clickedToken, onHoverToken }: Props) {
    return (
        <div className="space-y-2" onMouseLeave={() => onHoverToken?.(null)}>
            {TOKEN_GROUPS.map(group => (
                <GroupSection key={group.label} group={group} tokens={tokens} onChange={onChange} activeToken={activeToken} clickedToken={clickedToken} onHoverToken={onHoverToken} />
            ))}
        </div>
    );
}
