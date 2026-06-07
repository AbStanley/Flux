import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Theme } from '@/presentation/providers/ThemeProvider';
import {
    FONT_FAMILY_MAP,
    FONT_SIZE_MAP,
    type ReaderFont,
    type FontSize,
    type CustomTheme
} from '@/presentation/features/settings/store/useSettingsStore';
import { THEMES, FONTS, SIZES } from './constants';

export function ThemeSection({
    theme, setTheme, customThemes, onEdit, onDelete, onCreate,
}: {
    theme: Theme;
    setTheme: (t: Theme) => void;
    customThemes: CustomTheme[];
    onEdit: (id: string, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onCreate: () => void;
}) {
    return (
        <div>
            <h3 className="text-xs md:text-sm font-medium mb-1.5 md:mb-3">Theme</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 md:gap-2">
                {/* 1. Add New Button */}
                <button
                    onClick={onCreate}
                    className="flex flex-col items-center justify-center gap-1 md:gap-2 p-2 md:p-3 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                    title="Create custom theme"
                >
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center border border-dashed">
                        <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] md:text-xs">New</span>
                </button>

                {/* 2. Custom Themes (User Created) */}
                {customThemes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`relative group flex flex-col items-center gap-1 md:gap-2 p-2 md:p-3 rounded-lg border-2 transition-all ${theme === t.id
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-border/40 hover:border-primary/50 hover:bg-muted/50'
                            }`}
                    >
                        <div className="relative w-7 h-7 md:w-9 md:h-9 rounded-full border overflow-hidden shadow-sm flex items-center justify-center transition-transform group-hover:scale-105"
                             style={{ background: `hsl(${t.colors.background})`, borderColor: `hsl(${t.colors.border})` }}>
                            <div className="absolute inset-0 flex rotate-12 scale-150">
                                <div className="flex-1" style={{ background: `hsl(${t.colors.background})` }} />
                                <div className="w-1/2" style={{ background: `hsl(${t.colors.primary})` }} />
                            </div>
                            <span className="relative z-10 text-xs md:text-sm drop-shadow-sm group-hover:rotate-12 transition-transform">
                                {t.emoji || '🎨'}
                            </span>
                        </div>
                        <span className="text-[9px] md:text-xs font-medium truncate max-w-full w-full text-center px-1" title={t.name}>
                            {t.emoji || '🎨'} {t.name}
                        </span>

                        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 bg-background/90 rounded-md shadow-sm border border-border/50">
                            <span role="button" onClick={(e) => onEdit(t.id, e)} className="p-1 hover:text-primary transition-colors cursor-pointer" title="Edit">
                                <Pencil className="w-2.5 h-2.5" />
                            </span>
                            <span role="button" onClick={(e) => onDelete(t.id, e)} className="p-1 hover:text-destructive transition-colors cursor-pointer" title="Delete">
                                <Trash2 className="w-2.5 h-2.5" />
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Gap and Separator */}
            <div className="mt-6 mb-4 border-t border-border/50" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 md:gap-2 opacity-80">
                {/* 3. Default Themes */}
                {THEMES.map((t) => (
                    <button
                        key={t.value}
                        onClick={() => setTheme(t.value)}
                        className={`flex flex-col items-center gap-1 md:gap-2 p-2 md:p-3 rounded-lg border-2 transition-all ${theme === t.value
                            ? 'border-primary bg-primary/10 shadow-sm opacity-100'
                            : 'border-border/40 hover:border-primary/50 hover:bg-muted/50'
                            }`}
                    >
                        <div className={`relative w-7 h-7 md:w-9 md:h-9 rounded-full border overflow-hidden shadow-sm flex items-center justify-center transition-transform group-hover:scale-105 ${t.preview.split(' ')[0]}`}>
                            <div className="absolute inset-0 flex rotate-12 scale-150">
                                <div className={`flex-1 ${t.preview.split(' ')[0]}`} />
                                <div className="w-1/2" style={{ background: t.primary }} />
                            </div>
                            <span className="relative z-10 text-xs md:text-sm drop-shadow-sm group-hover:rotate-12 transition-transform">
                                {t.emoji}
                            </span>
                        </div>
                        <span className="text-[9px] md:text-xs font-medium truncate max-w-full text-center">
                            {t.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export function FontSection({ font, setFont }: { font: ReaderFont; setFont: (f: ReaderFont) => void }) {
    return (
        <div>
            <h3 className="text-xs md:text-sm font-medium mb-1.5 md:mb-3">Font</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 md:gap-2 max-h-48 overflow-y-auto">
                {FONTS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFont(f.value)}
                        style={{ fontFamily: FONT_FAMILY_MAP[f.value] }}
                        className={`p-2 md:p-3 rounded-lg border-2 text-left transition-all ${font === f.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                            }`}
                    >
                        <span className="text-xs md:text-sm">{f.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export function SizeSection({ fontSize, setFontSize }: { fontSize: FontSize; setFontSize: (s: FontSize) => void }) {
    return (
        <div>
            <h3 className="text-xs md:text-sm font-medium mb-1.5 md:mb-3">Font Size</h3>
            <div className="flex gap-1 md:gap-2">
                {SIZES.map((s) => (
                    <button
                        key={s.value}
                        onClick={() => setFontSize(s.value)}
                        style={{ fontSize: FONT_SIZE_MAP[s.value] }}
                        className={`flex-1 h-8 md:h-10 min-w-[2.5rem] text-xs rounded-md border transition-all ${fontSize === s.value
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
