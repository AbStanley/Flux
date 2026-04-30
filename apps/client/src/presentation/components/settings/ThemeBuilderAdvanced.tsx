import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Check, X, Copy } from 'lucide-react';
import { hslToHex, hexToHsl } from '@/lib/color-utils';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
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
    const [originalHsl, setOriginalHsl] = useState(hsl);
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(hex);
    const rowRef = useRef<HTMLDivElement>(null);

    const [prevHex, setPrevHex] = useState(hex);

    if (hex !== prevHex) {
        setPrevHex(hex);
        setInputValue(hex);
    }

    useEffect(() => {
        if (isClicked && rowRef.current) {
            rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isClicked]);

    const handleColorChange = (newHex: string) => {
        if (!isEditing) {
            setOriginalHsl(hsl);
            setIsEditing(true);
        }
        onChange(tokenKey, hexToHsl(newHex));
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        if (/^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{3}$/.test(val)) {
            handleColorChange(val);
        }
    };

    const confirm = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        setIsEditing(false);
    };

    const cancel = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        onChange(tokenKey, originalHsl);
        setInputValue(hslToHex(originalHsl));
        setIsEditing(false);
    };

    const copyToClipboard = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        navigator.clipboard.writeText(hex);
    };

    const hasChanged = isEditing && hsl !== originalHsl;

    return (
        <div
            ref={rowRef}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 group",
                isClicked ? 'bg-primary/20 border-primary shadow-md ring-1 ring-primary z-20 scale-[1.01]' : 
                hasChanged ? 'border-primary shadow-sm bg-primary/5' : 
                isActive ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/40'
            )}
            onMouseEnter={onHover}
        >
            <label className="flex flex-1 items-center gap-3 cursor-pointer" title="Click to pick color">
                <div className="relative flex-shrink-0 w-8 h-8 rounded-md border border-border shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                    <div className="absolute inset-0" style={{ background: `hsl(${hsl})` }} />
                    <input
                        type="color"
                        value={hex}
                        onChange={(e) => handleColorChange(e.target.value)}
                        onClick={() => { if (!isEditing) setOriginalHsl(hsl); setIsEditing(true); }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium leading-tight">{label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{hint}</p>
                </div>
            </label>

            <div className="flex items-center gap-2">
                <Input 
                    value={inputValue} 
                    onChange={handleTextChange}
                    onFocus={() => { if (!isEditing) setOriginalHsl(hsl); setIsEditing(true); }}
                    className="h-7 text-[11px] font-mono w-[72px] px-1.5 bg-background/50 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                />
                {!hasChanged && (
                    <button onClick={copyToClipboard} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all" title="Copy HEX">
                        <Copy className="w-3 h-3 text-muted-foreground" />
                    </button>
                )}
            </div>

            {hasChanged && (
                <div className="flex gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                    <button onClick={confirm} className="p-1 rounded-full bg-green-500 text-white hover:bg-green-600 shadow-sm transition-colors cursor-pointer" title="Keep">
                        <Check className="w-3 h-3" />
                    </button>
                    <button onClick={cancel} className="p-1 rounded-full bg-destructive text-white hover:bg-destructive/90 shadow-sm transition-colors cursor-pointer" title="Discard">
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
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

export function ThemeBuilderAdvanced({ tokens, onChange, activeToken, clickedToken, onHoverToken }: Props) {
    return (
        <div className="space-y-2" onMouseLeave={() => onHoverToken?.(null)}>
            {TOKEN_GROUPS.map(group => (
                <GroupSection key={group.label} group={group} tokens={tokens} onChange={onChange} activeToken={activeToken} clickedToken={clickedToken} onHoverToken={onHoverToken} />
            ))}
        </div>
    );
}
