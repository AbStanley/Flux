import { useMemo } from 'react';
import { THEMES, DEFAULT_THEME } from '../constants';
import { customThemeToFluxTheme } from '../../lib/color-derive';
import type { CustomTheme } from '../../presentation/features/settings/store/useSettingsStore';

export function useFluxTheme(themeId: string, customThemes: CustomTheme[]) {
    return useMemo(() => {
        if (themeId.startsWith('custom-')) {
            const custom = customThemes.find(t => t.id === themeId);
            if (custom) return customThemeToFluxTheme(custom);
        }
        return THEMES[themeId] ?? THEMES[DEFAULT_THEME];
    }, [themeId, customThemes]);
}
