import type { Theme } from '@/presentation/providers/ThemeProvider';
import type { ReaderFont, FontSize } from '@/presentation/features/settings/store/useSettingsStore';

export const THEMES: { value: Theme; label: string; preview: string }[] = [
    { value: 'light', label: 'Light', preview: 'bg-blue-50 text-slate-700' },
    { value: 'dark', label: 'Dark', preview: 'bg-slate-800 text-white' },
    { value: 'nordic', label: 'Nordic', preview: 'bg-slate-900 text-sky-400' },
    { value: 'cream', label: 'Cream', preview: 'bg-amber-100 text-amber-900' },
    { value: 'sunset', label: 'Sunset', preview: 'bg-orange-200 text-orange-950' },
    { value: 'rose-pine', label: 'Rosé Pine', preview: 'bg-[#191724] text-[#ebbcba]' },
    { value: 'evergreen', label: 'Evergreen', preview: 'bg-[#f0f5f0] text-[#2d4a3e]' },
    { value: 'moonlight', label: 'Moonlight', preview: 'bg-[#161a2e] text-[#65d9ef]' },
];

export const FONTS: { value: ReaderFont; label: string }[] = [
    { value: 'system', label: 'System Default' },
    { value: 'merriweather', label: 'Merriweather' },
    { value: 'literata', label: 'Literata' },
    { value: 'lora', label: 'Lora' },
    { value: 'crimson-pro', label: 'Crimson Pro' },
    { value: 'eb-garamond', label: 'EB Garamond' },
    { value: 'inter', label: 'Inter' },
    { value: 'roboto', label: 'Roboto' },
];

export const SIZES: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'S' },
    { value: 'medium', label: 'M' },
    { value: 'large', label: 'L' },
    { value: 'xl', label: 'XL' },
];
