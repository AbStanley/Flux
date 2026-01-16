import { Settings } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useTheme } from '@/presentation/providers/useTheme';
import type { Theme } from '@/presentation/providers/ThemeProvider';
import {
    useSettingsStore,
    FONT_FAMILY_MAP,
    FONT_SIZE_MAP,
    type ReaderFont,
    type FontSize,
} from '@/presentation/features/settings/store/useSettingsStore';

const THEMES: { value: Theme; label: string; preview: string }[] = [
    { value: 'light', label: 'Light', preview: 'bg-blue-50 text-slate-700' },
    { value: 'dark', label: 'Dark', preview: 'bg-slate-800 text-white' },
    { value: 'midnight', label: 'Midnight', preview: 'bg-slate-900 text-sky-400' },
    { value: 'cream', label: 'Cream', preview: 'bg-amber-100 text-amber-900' },
    { value: 'sunset', label: 'Sunset', preview: 'bg-amber-50 text-sky-900' },
];

const FONTS: { value: ReaderFont; label: string }[] = [
    { value: 'system', label: 'System Default' },
    { value: 'merriweather', label: 'Merriweather' },
    { value: 'literata', label: 'Literata' },
    { value: 'lora', label: 'Lora' },
    { value: 'crimson-pro', label: 'Crimson Pro' },
    { value: 'eb-garamond', label: 'EB Garamond' },
    { value: 'inter', label: 'Inter' },
    { value: 'roboto', label: 'Roboto' },
];

const SIZES: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'S' },
    { value: 'medium', label: 'M' },
    { value: 'large', label: 'L' },
    { value: 'xl', label: 'XL' },
];

export function SettingsModal() {
    const { theme, setTheme } = useTheme();
    const { font, fontSize, setFont, setFontSize } = useSettingsStore();

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-10 h-10 bg-background/50 hover:bg-background/80 backdrop-blur-sm border border-border/50"
                >
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Settings</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reader Settings</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Theme Selection */}
                    <ThemeSection theme={theme} setTheme={setTheme} />

                    {/* Font Selection */}
                    <FontSection font={font} setFont={setFont} />

                    {/* Font Size Selection */}
                    <SizeSection fontSize={fontSize} setFontSize={setFontSize} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ThemeSection({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
    return (
        <div>
            <h3 className="text-sm font-medium mb-3">Theme</h3>
            <div className="grid grid-cols-4 gap-2">
                {THEMES.map((t) => (
                    <button
                        key={t.value}
                        onClick={() => setTheme(t.value)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${theme === t.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                            }`}
                    >
                        <div className={`w-8 h-8 rounded-full ${t.preview} border`} />
                        <span className="text-xs">{t.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function FontSection({ font, setFont }: { font: ReaderFont; setFont: (f: ReaderFont) => void }) {
    return (
        <div>
            <h3 className="text-sm font-medium mb-3">Font</h3>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {FONTS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFont(f.value)}
                        style={{ fontFamily: FONT_FAMILY_MAP[f.value] }}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${font === f.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                            }`}
                    >
                        <span className="text-sm">{f.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function SizeSection({ fontSize, setFontSize }: { fontSize: FontSize; setFontSize: (s: FontSize) => void }) {
    return (
        <div>
            <h3 className="text-sm font-medium mb-3">Font Size</h3>
            <div className="flex gap-2">
                {SIZES.map((s) => (
                    <button
                        key={s.value}
                        onClick={() => setFontSize(s.value)}
                        style={{ fontSize: FONT_SIZE_MAP[s.value] }}
                        className={`flex-1 h-10 min-w-[2.5rem] text-xs rounded-md border transition-all ${fontSize === s.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                            }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
