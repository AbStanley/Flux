import { defaultClient } from './api-client';

export interface UserSettings {
    theme?: string | null;
    sourceLang?: string | null;
    targetLang?: string | null;
    customThemes?: unknown[] | null;
}

export const usersApi = {
    getSettings: async (): Promise<UserSettings> => {
        return defaultClient.get<UserSettings>('/api/users/settings');
    },

    updateSettings: async (settings: UserSettings): Promise<UserSettings> => {
        return defaultClient.patch<UserSettings>('/api/users/settings', settings);
    },
};
