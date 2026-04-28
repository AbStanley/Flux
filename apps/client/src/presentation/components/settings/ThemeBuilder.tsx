import { useState, useMemo, useRef } from 'react';
import { Save, Sliders, Sparkles, Download, Upload, RotateCcw } from 'lucide-react';
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

type Mode = 'simple' | 'full';

function ColorPickerRow({ label, hint, color, onChange }: { label: string; hint: string; color: string; onChange: (c: string) => void }) {
    return (
        <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card/50 hover:border-primary/50 transition-colors group">
            <label className="relative flex-shrink-0 cursor-pointer">
                <div className="w-9 h-9 rounded-md border border-border shadow-sm group-hover:scale-105 transition-transform"
                    style={{ background: color }} />
                <input type="color" value={color} onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
            </label>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{color}</span>
        </div>
    );
}

const SEED_FIELDS: { key: keyof SeedColors; label: string; hint: string }[] = [
    { key: 'background', label: 'Background', hint: 'Main page colour' },
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
            if (ex) return { name: ex.name, tokens: ex.colors as DerivedTokens };
        }
        return { name: 'My Theme', tokens: BUILT_IN_THEME_TOKENS.light };
    }, [editThemeId, customThemes]);

    const [name, setName] = useState(initial.name);
    const [tokens, setTokens] = useState<DerivedTokens>(initial.tokens);
    const [mode, setMode] = useState<Mode>('simple');
    const [hoveredToken, setHoveredToken] = useState<string | null>(null);
    const [clickedToken, setClickedToken] = useState<string | null>(null);

    // Reset when dialog opens / edit target changes
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    const [prevEditId, setPrevEditId] = useState(editThemeId);
    if (isOpen !== prevIsOpen || editThemeId !== prevEditId) {
        setPrevIsOpen(isOpen); setPrevEditId(editThemeId);
        setName(initial.name); setTokens(initial.tokens); setMode('simple');
        setHoveredToken(null);
        setClickedToken(null);
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
        setTokens(prev => ({ ...prev, [key]: hsl }));
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
        const blob = new Blob([JSON.stringify({ name, colors: tokens }, null, 2)], { type: 'application/json' });
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
                className="max-w-4xl h-[85vh] max-h-[800px] min-h-[500px] flex flex-col gap-0 p-0 sm:rounded-2xl overflow-hidden"
                hideClose={true}
                aria-describedby={undefined}
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader className="px-5 pt-5 pb-3 border-b flex flex-row items-center justify-between">
                    <DialogTitle>{editThemeId ? 'Edit Theme' : 'Create New Theme'}</DialogTitle>
                    <div className="flex items-center gap-2 pr-6">
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => fileInputRef.current?.click()} title="Import Theme">
                            <Upload className="w-3 h-3 mr-1" /> Import
                        </Button>
                        <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleImport} />

                        <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={handleExport} title="Export Theme">
                            <Download className="w-3 h-3 mr-1" /> Export
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left Column: Form controls */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 border-b md:border-b-0 md:border-r border-border">
                        {/* Name + mode toggle */}
                        <div className="flex gap-3 items-center flex-wrap">
                            <Label htmlFor="theme-name" className="whitespace-nowrap text-sm">Theme Name</Label>
                            <Input id="theme-name" value={name} onChange={e => setName(e.target.value)}
                                placeholder="e.g. Midnight Teal" className="max-w-xs flex-1" />
                            <div className="flex gap-1 ml-auto border rounded-lg p-0.5">
                                <button onClick={() => setMode('simple')}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${mode === 'simple' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                    <Sparkles className="w-3 h-3" /> Simple
                                </button>
                                <button onClick={() => setMode('full')}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${mode === 'full' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                    <Sliders className="w-3 h-3" /> Full
                                </button>
                            </div>
                        </div>

                        {/* Preset row */}
                        <div>
                            <p className="text-[11px] text-muted-foreground mb-1.5">
                                Start from — {mode === 'full' ? 'loads exact original values' : 'loads seed colors for auto-derivation'}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {THEME_PRESETS.map(p => (
                                    <button key={p.id} onClick={() => handlePreset(p.id, p.seeds)}
                                        className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/60 hover:bg-primary/5 transition-all">
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Editors */}
                        {mode === 'simple' ? (
                            <div className="grid grid-cols-1 gap-2">
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

                    {/* Right Column: Sticky preview */}
                    <div className="w-full md:w-[320px] lg:w-[380px] bg-muted/10 overflow-y-auto flex-shrink-0">
                        <div className="p-5 sticky top-0">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Live Preview (Hover or click elements)</p>
                            <ThemeBuilderPreview tokens={tokens} name={name} activeToken={hoveredToken} onHoverToken={setHoveredToken} onClickToken={handlePreviewClick} />
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-5 py-4 border-t gap-2 sm:justify-between bg-background">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                        <Button variant="ghost" onClick={handleReset} className="text-muted-foreground hover:text-destructive">
                            <RotateCcw className="w-4 h-4 mr-1.5" /> Reset
                        </Button>
                    </div>
                    <Button onClick={handleSave} disabled={!name.trim()}>
                        <Save className="w-4 h-4 mr-2" /> Save & Apply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
