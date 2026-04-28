import { useState, useMemo } from 'react';
import { Save, Shuffle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { useSettingsStore, type CustomTheme } from '@/presentation/features/settings/store/useSettingsStore';
import { useTheme } from '@/presentation/providers/useTheme';
import { deriveTokens, seedsFromTokens, THEME_PRESETS, type SeedColors } from '@/lib/color-derive';
import { ThemeBuilderPreview } from './ThemeBuilderPreview';

/** UUID v4 that works in extension content scripts (no secure-context requirement). */
function generateId(): string {
    const bytes = new Uint8Array(16);
    (window.crypto ?? globalThis.crypto).getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant bits
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

// ─── Seed colour descriptors shown to the user ───────────────────────────────

const SEED_FIELDS: { key: keyof SeedColors; label: string; hint: string }[] = [
    { key: 'background', label: 'Background',  hint: 'Main page colour' },
    { key: 'foreground', label: 'Text',         hint: 'Body text on background' },
    { key: 'primary',    label: 'Accent',       hint: 'Buttons & highlights' },
    { key: 'card',       label: 'Card Surface', hint: 'Panels & cards' },
    { key: 'border',     label: 'Border',       hint: 'Lines & separators' },
];

const DEFAULT_SEEDS: SeedColors = THEME_PRESETS[0].seeds;

interface ThemeBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    editThemeId?: string | null;
}

export function ThemeBuilder({ isOpen, onClose, editThemeId }: ThemeBuilderProps) {
    const { addCustomTheme, updateCustomTheme, customThemes } = useSettingsStore();
    const { setTheme } = useTheme();

    // Compute initial values when dialog opens / target changes
    const initialValues = useMemo(() => {
        if (editThemeId) {
            const existing = customThemes.find(t => t.id === editThemeId);
            if (existing) {
                return { name: existing.name, seeds: seedsFromTokens(existing.colors) };
            }
        }
        return { name: 'My Theme', seeds: DEFAULT_SEEDS };
    }, [editThemeId, customThemes]);

    const [name, setName]   = useState(initialValues.name);
    const [seeds, setSeeds] = useState<SeedColors>(initialValues.seeds);

    // Track dialog open/edit changes to reset form (React-recommended pattern)
    const [prevIsOpen, setPrevIsOpen]   = useState(isOpen);
    const [prevEditId, setPrevEditId]   = useState(editThemeId);

    if (isOpen !== prevIsOpen || editThemeId !== prevEditId) {
        setPrevIsOpen(isOpen);
        setPrevEditId(editThemeId);
        setName(initialValues.name);
        setSeeds(initialValues.seeds);
    }

    // Derived tokens update instantly as seeds change — pure computation, no effect needed
    const tokens = useMemo(() => deriveTokens(seeds), [seeds]);

    const handleSeedChange = (key: keyof SeedColors, hex: string) => {
        setSeeds(prev => ({ ...prev, [key]: hex }));
    };

    const handlePreset = (presetSeeds: SeedColors) => {
        setSeeds(presetSeeds);
    };

    const handleSave = () => {
        if (!name.trim()) return;
        const newTheme: CustomTheme = {
            id: editThemeId || `custom-${generateId()}`,
            name: name.trim(),
            colors: tokens,
        };
        if (editThemeId) {
            updateCustomTheme(newTheme);
        } else {
            addCustomTheme(newTheme);
        }
        setTheme(newTheme.id);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-xl max-h-[92vh] flex flex-col gap-0 p-0" aria-describedby={undefined}>
                <DialogHeader className="px-5 pt-5 pb-3">
                    <DialogTitle>{editThemeId ? 'Edit Theme' : 'Create New Theme'}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-5">
                    {/* Theme name */}
                    <div className="flex gap-3 items-center">
                        <Label htmlFor="theme-name" className="whitespace-nowrap text-sm">Theme Name</Label>
                        <Input
                            id="theme-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Midnight Teal"
                            className="max-w-xs"
                        />
                    </div>

                    {/* Start from a preset */}
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Shuffle className="w-3 h-3" /> Start from a preset
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {THEME_PRESETS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handlePreset(p.seeds)}
                                    className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/60 hover:bg-primary/5 transition-all"
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 5 seed colour pickers */}
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Colours</p>
                        <div className="grid grid-cols-1 gap-2">
                            {SEED_FIELDS.map(({ key, label, hint }) => (
                                <label
                                    key={key}
                                    htmlFor={`seed-${key}`}
                                    className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card/50 cursor-pointer hover:border-primary/50 transition-colors group"
                                >
                                    {/* Large clickable swatch */}
                                    <div className="relative flex-shrink-0">
                                        <div
                                            className="w-9 h-9 rounded-md border border-border shadow-sm group-hover:scale-105 transition-transform"
                                            style={{ background: seeds[key] }}
                                        />
                                        <input
                                            id={`seed-${key}`}
                                            type="color"
                                            value={seeds[key]}
                                            onChange={e => handleSeedChange(key, e.target.value)}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        />
                                    </div>

                                    {/* Labels */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{label}</p>
                                        <p className="text-xs text-muted-foreground">{hint}</p>
                                    </div>

                                    {/* Hex value */}
                                    <span className="text-xs font-mono text-muted-foreground tabular-nums">
                                        {seeds[key]}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Live preview */}
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Preview</p>
                        <ThemeBuilderPreview tokens={tokens} name={name} />
                    </div>
                </div>

                <DialogFooter className="px-5 py-4 border-t gap-2 sm:justify-between">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!name.trim()}>
                        <Save className="w-4 h-4 mr-2" />
                        Save & Apply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
