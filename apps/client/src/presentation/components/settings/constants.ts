import type { Theme } from '@/presentation/providers/ThemeProvider';
import type { ReaderFont, FontSize } from '@/presentation/features/settings/store/useSettingsStore';

export const THEMES: { value: Theme; label: string; emoji: string; primary: string; preview: string }[] = [
    { value: 'light', label: 'Light', emoji: '☀️', primary: '#0081a7', preview: 'bg-[#f0f8ff] text-[#0081a7]' },
    { value: 'dark', label: 'Dark', emoji: '🌙', primary: '#3b82f6', preview: 'bg-[#1d2840] text-[#c8d4e8]' },
    { value: 'nordic', label: 'Nordic', emoji: '❄️', primary: '#62c4e0', preview: 'bg-[#1c2232] text-[#62c4e0]' },
    { value: 'cream', label: 'Cream', emoji: '🍦', primary: '#c88520', preview: 'bg-[#e8ddb0] text-[#c88520]' },
    { value: 'sunset', label: 'Sunset', emoji: '🌇', primary: '#f77f00', preview: 'bg-[#ddd5a0] text-[#f77f00]' },
    { value: 'rose-pine', label: 'Rosé Pine', emoji: '🌹', primary: '#ebbcba', preview: 'bg-[#1f1b30] text-[#ebbcba]' },
    { value: 'evergreen', label: 'Evergreen', emoji: '🌲', primary: '#4a9970', preview: 'bg-[#d8ead8] text-[#4a9970]' },
    { value: 'ember', label: 'Ember', emoji: '🔥', primary: '#f77f00', preview: 'bg-[#0c1828] text-[#f77f00]' },
    { value: 'harvest', label: 'Harvest', emoji: '🌾', primary: '#EA5252', preview: 'bg-[#e5d0a8] text-[#EA5252]' },
    { value: 'ultraviolet', label: 'Ultraviolet', emoji: '🔮', primary: '#FF653F', preview: 'bg-[#ece5f5] text-[#FF653F]' },
    { value: 'sandcastle', label: 'Sandcastle', emoji: '🏰', primary: '#5a8eb5', preview: 'bg-[#ede5d0] text-[#5a8eb5]' },
    { value: 'sage', label: 'Sage', emoji: '🌿', primary: '#546B41', preview: 'bg-[#dde5cc] text-[#546B41]' },
    { value: 'bauhaus', label: 'Bauhaus', emoji: '📐', primary: '#003049', preview: 'bg-[#f2e8d5] text-[#003049]' },
    { value: 'espresso', label: 'Espresso', emoji: '☕', primary: '#4B2E2B', preview: 'bg-[#e5d0bb] text-[#4B2E2B]' },
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
