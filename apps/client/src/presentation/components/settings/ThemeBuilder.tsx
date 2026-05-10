import { useState, useMemo, useRef } from 'react';
import { Save, Sliders, Sparkles, Download, Upload, RotateCcw, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { useSettingsStore, type CustomTheme } from '@/presentation/features/settings/store/useSettingsStore';
import { useTheme } from '@/presentation/providers/useTheme';
import { deriveTokens, seedsFromTokens, autoFg, type DerivedTokens, type SeedColors } from '@/lib/color-derive';
import { hexToHsl, hslToHex } from '@/lib/color-utils';
import { THEME_PRESETS } from '@/lib/color-derive';
import { BUILT_IN_THEME_TOKENS } from '@/lib/theme-presets';
import { ThemeBuilderAdvanced } from './ThemeBuilderAdvanced';
import { ThemeBuilderPreview } from './ThemeBuilderPreview';
import { Check, X, Copy } from 'lucide-react';

type Mode = 'simple' | 'full';

function ColorPickerRow({ label, hint, color, onChange }: { label: string; hint: string; color: string; onChange: (c: string) => void }) {
    const [originalColor, setOriginalColor] = useState(color);
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(color);

    const [prevColor, setPrevColor] = useState(color);

    if (color !== prevColor) {
        setPrevColor(color);
        setInputValue(color);
    }

    const handleColorChange = (newColor: string) => {
        if (!isEditing) {
            setOriginalColor(color);
            setIsEditing(true);
        }
        onChange(newColor);
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
        onChange(originalColor);
        setInputValue(originalColor);
        setIsEditing(false);
    };

    const copyToClipboard = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        navigator.clipboard.writeText(color);
    };

    const hasChanged = isEditing && color !== originalColor;

    return (
        <div className={`flex items-center gap-3 p-2 rounded-lg border transition-all group ${hasChanged ? 'border-primary shadow-md bg-primary/5' : 'border-border bg-card/40 hover:border-primary/40'}`}>
            <label className="relative flex-shrink-0 cursor-pointer" title="Click to pick color">
                <div className="w-10 h-10 rounded-lg border border-border/50 shadow-sm group-hover:scale-105 transition-transform"
                    style={{ background: color }} />
                <input type="color" value={color} onChange={(e) => handleColorChange(e.target.value)} onClick={() => { if (!isEditing) setOriginalColor(color); setIsEditing(true); }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </label>

            <div className="flex-1 min-w-0" title={hint}>
                <p className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <Input
                        value={inputValue}
                        onChange={handleTextChange}
                        onFocus={() => { if (!isEditing) setOriginalColor(color); setIsEditing(true); }}
                        className="h-7 text-xs font-mono w-24 px-2 bg-background/50 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                    />
                    {!hasChanged && (
                        <button onClick={copyToClipboard} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all" title="Copy HEX">
                            <Copy className="w-3 h-3 text-muted-foreground" />
                        </button>
                    )}
                </div>
            </div>

            {hasChanged && (
                <div className="flex gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                    <button onClick={confirm} className="p-1.5 rounded-full bg-green-500 text-white hover:bg-green-600 shadow-sm transition-colors cursor-pointer" title="Keep new color">
                        <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={cancel} className="p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90 shadow-sm transition-colors cursor-pointer" title="Discard">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}

const SEED_FIELDS: { key: keyof SeedColors; label: string; hint: string }[] = [
    { key: 'background', label: 'Page Background', hint: 'Main page and overall app background' },
    { key: 'foreground', label: 'Text', hint: 'Body text on background' },
    { key: 'primary', label: 'Accent', hint: 'Buttons & highlights' },
    { key: 'card', label: 'Card Surface', hint: 'Panels & cards' },
    { key: 'border', label: 'Border', hint: 'Lines & separators' },
];

function generateId(): string {
    const bytes = new Uint8Array(16);
    (window.crypto ?? globalThis.crypto).getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

interface ThemeBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    editThemeId?: string | null;
}

export function ThemeBuilder({ isOpen, onClose, editThemeId }: ThemeBuilderProps) {
    const { addCustomTheme, updateCustomTheme, customThemes } = useSettingsStore();
    const { setTheme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initial = useMemo(() => {
        if (editThemeId) {
            const ex = customThemes.find(t => t.id === editThemeId);
            if (ex) return { name: ex.name, emoji: ex.emoji || '🎨', tokens: ex.colors as DerivedTokens };
        }
        return { name: 'My Theme', emoji: '🎨', tokens: BUILT_IN_THEME_TOKENS.light };
    }, [editThemeId, customThemes]);

    const [name, setName] = useState(initial.name);
    const [emoji, setEmoji] = useState(initial.emoji);
    const [tokens, setTokens] = useState<DerivedTokens>(initial.tokens);
    const [mode, setMode] = useState<Mode>('simple');
    const [hoveredToken, setHoveredToken] = useState<string | null>(null);
    const [clickedToken, setClickedToken] = useState<string | null>(null);
    const [showPreviewMobile, setShowPreviewMobile] = useState(false);

    // Reset when dialog opens / edit target changes
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    const [prevEditId, setPrevEditId] = useState(editThemeId);
    if (isOpen !== prevIsOpen || editThemeId !== prevEditId) {
        setPrevIsOpen(isOpen); setPrevEditId(editThemeId);
        setName(initial.name); 
        setEmoji(initial.emoji);
        setTokens(initial.tokens); setMode('simple');
        setHoveredToken(null);
        setClickedToken(null);
        setShowPreviewMobile(false);
    }

    // Simple mode: 5 seed colors that auto-derive all tokens
    const seeds = useMemo(() => seedsFromTokens(tokens), [tokens]);

    const handleSeedChange = (key: keyof SeedColors, hex: string) => {
        const newSeeds = { ...seeds, [key]: hex };

        // Auto-adapt foregrounds based on contrast
        if (key === 'background') {
            const bgHsl = hexToHsl(hex);
            const autoText = autoFg(bgHsl, '220 13% 10%', '210 20% 98%');
            newSeeds.foreground = hslToHex(autoText);
        }

        setTokens(deriveTokens(newSeeds));
    };

    const handlePreviewClick = (token: string) => {
        setClickedToken(token);
        setHoveredToken(token);
        if (mode === 'simple') setMode('full');
    };

    const handleTokenChange = (key: keyof DerivedTokens, hsl: string) => {
        setTokens(prev => {
            const next = { ...prev, [key]: hsl };
            if (key === 'link-color') {
                next['link-foreground'] = autoFg(hsl, '0 0% 8%', '0 0% 98%');
            }
            return next;
        });
    };

    // Preset: always load exact CSS values; seeds in Simple mode are extracted from them
    const handlePreset = (id: string, presetSeeds: SeedColors) => {
        const exact = BUILT_IN_THEME_TOKENS[id];
        setTokens(exact ?? deriveTokens(presetSeeds));
    };

    const handleReset = () => {
        setName(initial.name);
        setTokens(initial.tokens);
    };

    const handleExport = () => {
        const blob = new Blob([JSON.stringify({ name, emoji, colors: tokens }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.replace(/\s+/g, '_').toLowerCase()}_theme.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target?.result as string);
                if (imported.colors && imported.name) {
                    setName(imported.name || 'Imported Theme');
                    setEmoji(imported.emoji || '🎨');
                    setTokens(imported.colors);
                    setMode('full'); // Imported themes might have advanced tweaks
                } else {
                    alert('Invalid theme file format. Missing colors.');
                }
            } catch {
                alert('Could not read theme file. Make sure it is a valid JSON.');
            }
        };
        reader.readAsText(file);
        // Reset input so the same file can be imported again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSave = () => {
        if (!name.trim()) return;
        const newTheme: CustomTheme = {
            id: editThemeId || `custom-${generateId()}`,
            name: name.trim(),
            emoji: emoji || '🎨',
            colors: tokens,
        };
        if (editThemeId) updateCustomTheme(newTheme); else addCustomTheme(newTheme);
        setTheme(newTheme.id);
        onClose();
    };

    const handleCancel = () => {
        const isModified = name !== initial.name || JSON.stringify(tokens) !== JSON.stringify(initial.tokens);
        if (isModified) {
            if (!window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
                return;
            }
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => {
            // We ONLY want to allow closing via the Cancel or Save buttons explicitly
            // to prevent accidental data loss.
        }}>
            <DialogContent
                className="max-w-4xl h-[90vh] md:h-[85vh] max-h-[850px] min-h-[500px] flex flex-col gap-0 p-0 sm:rounded-2xl overflow-hidden"
                hideClose={true}
                aria-describedby={undefined}
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="px-4 md:px-5 pt-5 pb-3 border-b flex flex-row items-center justify-between gap-4">
                    <DialogTitle className="truncate text-base md:text-xl">
                        {editThemeId ? 'Edit Theme' : 'New Theme'}
                    </DialogTitle>
                    <div className="flex items-center gap-2 pr-2">
                        <Button variant="outline" size="sm" className="h-7 text-[10px] md:text-xs px-2" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-3 h-3 mr-1 hidden sm:inline" /> Import
                        </Button>
                        <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />

                        <Button variant="outline" size="sm" className="h-7 text-[10px] md:text-xs px-2" onClick={handleExport}>
                            <Download className="w-3 h-3 mr-1 hidden sm:inline" /> Export
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className={`md:hidden h-7 w-7 p-0 ${showPreviewMobile ? 'bg-primary text-primary-foreground' : ''}`}
                            onClick={() => setShowPreviewMobile(!showPreviewMobile)}
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
                    {/* Left Column: Form controls */}
                    <div className={`flex-1 overflow-y-auto px-4 md:px-5 py-4 space-y-4 border-b md:border-b-0 md:border-r border-border transition-opacity ${showPreviewMobile ? 'opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto' : 'opacity-100'}`}>
                        {/* Name + mode toggle */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                            <div className="flex-1 flex items-center gap-2">
                                <Label htmlFor="theme-name" className="whitespace-nowrap text-xs md:text-sm">Name</Label>
                                <Input
                                    id="theme-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-8 md:h-9"
                                    placeholder="Theme Name..."
                                />
                                <Input
                                    id="theme-emoji"
                                    value={emoji}
                                    onChange={(e) => setEmoji(e.target.value)}
                                    className="h-8 md:h-9 w-10 md:w-12 text-center px-1"
                                    placeholder="🎨"
                                    maxLength={2}
                                />
                            </div>
                            <div className="flex gap-1 border rounded-lg p-0.5 self-end sm:self-auto bg-muted/20">
                                <button onClick={() => setMode('simple')}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] md:text-xs font-medium transition-all ${mode === 'simple' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                    <Sparkles className="w-3 h-3" /> Simple
                                </button>
                                <button onClick={() => setMode('full')}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] md:text-xs font-medium transition-all ${mode === 'full' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                    <Sliders className="w-3 h-3" /> Full
                                </button>
                            </div>
                        </div>

                        {/* Preset row */}
                        <div>
                            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">
                                Quick Presets
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {THEME_PRESETS.map(p => (
                                    <button key={p.id} onClick={() => handlePreset(p.id, p.seeds)}
                                        className="text-[10px] md:text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/60 hover:bg-primary/5 transition-all">
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Editors */}
                        <div className="pt-2">
                            {mode === 'simple' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {SEED_FIELDS.map(({ key, label, hint }) => (
                                        <ColorPickerRow
                                            key={key}
                                            label={label}
                                            hint={hint}
                                            color={seeds[key]}
                                            onChange={(val) => handleSeedChange(key, val)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <ThemeBuilderAdvanced tokens={tokens} onChange={handleTokenChange} activeToken={hoveredToken} clickedToken={clickedToken} onHoverToken={setHoveredToken} />
                            )}
                        </div>
                    </div>

                    {/* Right Column: Sticky preview - Fixed/Overlay on mobile if toggled */}
                    <div className={`
                        w-full md:w-[320px] lg:w-[380px] bg-muted/5 flex-shrink-0
                        absolute md:relative inset-0 md:inset-auto z-10 md:z-auto
                        transition-transform duration-300 ease-in-out md:translate-x-0
                        ${showPreviewMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                    `}>
                        <div className="h-full overflow-y-auto bg-background md:bg-transparent p-4 md:p-5">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Live Preview</p>
                                <Button variant="ghost" size="sm" className="md:hidden h-7 w-7 p-0" onClick={() => setShowPreviewMobile(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="mb-3 text-[10px] text-muted-foreground text-center italic">Tip: Click preview elements to edit their colors directly.</p>
                            <div className="rounded-xl shadow-2xl md:shadow-none border md:border-0 overflow-hidden">
                                <ThemeBuilderPreview tokens={tokens} name={name} activeToken={hoveredToken} onHoverToken={setHoveredToken} onClickToken={handlePreviewClick} />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-4 md:px-5 py-4 border-t gap-2 flex-col sm:flex-row sm:justify-between bg-background">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleCancel} className="flex-1 sm:flex-none">Cancel</Button>
                        <Button variant="ghost" onClick={handleReset} className="text-muted-foreground hover:text-destructive hidden sm:flex">
                            <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
                        </Button>
                    </div>
                    <Button onClick={handleSave} disabled={!name.trim()} className="flex-1 sm:flex-none">
                        <Save className="w-4 h-4 mr-2" /> Save & Apply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
