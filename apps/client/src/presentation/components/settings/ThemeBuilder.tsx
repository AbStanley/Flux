import { useState, useMemo } from 'react';
import { Save } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { useSettingsStore, type CustomTheme } from '@/presentation/features/settings/store/useSettingsStore';
import { hexToHsl, hslToHex } from '@/lib/color-utils';
import { useTheme } from '@/presentation/providers/useTheme';

const DEFAULT_COLORS = {
    background: "0 0% 100%",
    foreground: "240 10% 3.9%",
    card: "0 0% 100%",
    'card-foreground': "240 10% 3.9%",
    popover: "0 0% 100%",
    'popover-foreground': "240 10% 3.9%",
    primary: "240 5.9% 10%",
    'primary-foreground': "0 0% 98%",
    secondary: "240 4.8% 95.9%",
    'secondary-foreground': "240 5.9% 10%",
    muted: "240 4.8% 95.9%",
    'muted-foreground': "240 3.8% 46.1%",
    accent: "240 4.8% 95.9%",
    'accent-foreground': "240 5.9% 10%",
    destructive: "0 84.2% 60.2%",
    'destructive-foreground': "0 0% 98%",
    border: "240 5.9% 90%",
    input: "240 5.9% 90%",
    'input-background': "0 0% 100%",
    'reader-textarea-bg': "0 0% 100%",
    ring: "240 5.9% 10%",
};

const COLOR_LABELS: Record<string, string> = {
    background: "Page Background",
    foreground: "Main Text Color",
    card: "Card/Panel Background",
    'card-foreground': "Card Text",
    popover: "Dropdown/Popup Background",
    'popover-foreground': "Dropdown Text",
    primary: "Primary Brand Color",
    'primary-foreground': "Primary Text (on Brand)",
    secondary: "Secondary Button BG",
    'secondary-foreground': "Secondary Button Text",
    muted: "Muted/Disabled Background",
    'muted-foreground': "Muted/Hint Text",
    accent: "Hover/Accent Background",
    'accent-foreground': "Hover Text",
    destructive: "Error/Destructive Color",
    'destructive-foreground': "Error Text",
    border: "Borders & Dividers",
    input: "Input Field Borders",
    'input-background': "Input Field Background",
    'reader-textarea-bg': "Reader Text Area (Read Mode)",
    ring: "Focus Ring Outline",
};

interface ThemeBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    editThemeId?: string | null;
}

export function ThemeBuilder({ isOpen, onClose, editThemeId }: ThemeBuilderProps) {
    const { addCustomTheme, updateCustomTheme, customThemes } = useSettingsStore();
    const { setTheme } = useTheme();

    // Compute initial values based on edit state
    const getInitialValues = useMemo(() => {
        if (editThemeId) {
            const existing = customThemes.find(t => t.id === editThemeId);
            if (existing) {
                return { name: existing.name, colors: existing.colors };
            }
        }
        return { name: 'My New Theme', colors: DEFAULT_COLORS };
    }, [editThemeId, customThemes]);

    const [name, setName] = useState(getInitialValues.name);
    const [colors, setColors] = useState(getInitialValues.colors);

    // Track previous props in state (React-recommended pattern for prop-based resets)
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    const [prevEditId, setPrevEditId] = useState(editThemeId);

    // Reset form when dialog opens or edit target changes
    if (isOpen !== prevIsOpen || editThemeId !== prevEditId) {
        setPrevIsOpen(isOpen);
        setPrevEditId(editThemeId);
        setName(getInitialValues.name);
        setColors(getInitialValues.colors);
    }

    const handleColorChange = (key: keyof typeof DEFAULT_COLORS, hex: string) => {
        setColors(prev => ({
            ...prev,
            [key]: hexToHsl(hex)
        }));
    };

    const handleSave = () => {
        if (!name.trim()) return;

        const newTheme: CustomTheme = {
            id: editThemeId || `custom-${crypto.randomUUID()}`,
            name,
            colors
        };

        if (editThemeId) {
            updateCustomTheme(newTheme);
        } else {
            addCustomTheme(newTheme);
        }

        // Auto-apply component
        setTheme(newTheme.id);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>{editThemeId ? 'Edit Theme' : 'Create New Theme'}</DialogTitle>
                </DialogHeader>

                <div className="flex gap-4 items-center py-4">
                    <Label htmlFor="theme-name" className="whitespace-nowrap">Theme Name</Label>
                    <Input
                        id="theme-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="max-w-xs"
                    />
                </div>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4">
                        {Object.entries(colors).map(([key, hslValue]) => (
                            <div key={key} className="flex flex-col gap-2 p-3 rounded-lg border bg-card/50">
                                <Label className="text-xs truncate font-medium" title={key}>
                                    {COLOR_LABELS[key] || key}
                                </Label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={hslToHex(hslValue)}
                                        onChange={(e) => handleColorChange(key as keyof typeof DEFAULT_COLORS, e.target.value)}
                                        className="h-8 w-12 p-0 border-0 rounded cursor-pointer"
                                    />
                                    <span className="text-xs text-muted-foreground font-mono truncate">
                                        {hslToHex(hslValue)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter className="gap-2 sm:justify-between">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!name}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Theme
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
