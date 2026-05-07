import type { Theme } from '@/presentation/providers/ThemeProvider';
import type { ReaderFont, FontSize } from '@/presentation/features/settings/store/useSettingsStore';

export const THEMES: { value: Theme; label: string; preview: string }[] = [
    { value: 'light', label: 'Light', preview: 'bg-[#f0f8ff] text-[#0081a7]' },
    { value: 'dark', label: 'Dark', preview: 'bg-[#1d2840] text-[#c8d4e8]' },
    { value: 'nordic', label: 'Nordic', preview: 'bg-[#1c2232] text-[#62c4e0]' },
    { value: 'cream', label: 'Cream', preview: 'bg-[#e8ddb0] text-[#c88520]' },
    { value: 'sunset', label: 'Sunset', preview: 'bg-[#ddd5a0] text-[#f77f00]' },
    { value: 'rose-pine', label: 'Rosé Pine', preview: 'bg-[#1f1b30] text-[#ebbcba]' },
    { value: 'evergreen', label: 'Evergreen', preview: 'bg-[#d8ead8] text-[#4a9970]' },
    { value: 'ember', label: 'Ember', preview: 'bg-[#0c1828] text-[#f77f00]' },
    { value: 'harvest', label: 'Harvest', preview: 'bg-[#e5d0a8] text-[#EA5252]' },
    { value: 'ultraviolet', label: 'Ultraviolet', preview: 'bg-[#ece5f5] text-[#FF653F]' },
    { value: 'sandcastle', label: 'Sandcastle', preview: 'bg-[#ede5d0] text-[#5a8eb5]' },
    { value: 'sage', label: 'Sage', preview: 'bg-[#dde5cc] text-[#546B41]' },
    { value: 'bauhaus', label: 'Bauhaus', preview: 'bg-[#f2e8d5] text-[#003049]' },
    { value: 'espresso', label: 'Espresso', preview: 'bg-[#e5d0bb] text-[#4B2E2B]' },
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
    { value: 'dyslexic', label: 'OpenDyslexic' },
];

export const SIZES: { value: FontSize; label: string }[] = [
    { value: 'small', label: 'S' },
    { value: 'medium', label: 'M' },
    { value: 'large', label: 'L' },
    { value: 'xl', label: 'XL' },
];
