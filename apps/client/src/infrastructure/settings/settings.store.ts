import { create } from 'zustand';

interface SettingsState {
    apiUrl: string;
    setApiUrl: (url: string) => Promise<void>;
    loadSettings: () => Promise<void>;
}

// Helper to promisify chrome.storage.local.get
const storageGet = (key: string): Promise<string | null> => {
    return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get([key], (result) => {
                const data = result as Record<string, string>;
                resolve(data[key] || null);
            });
        } else {
            resolve(null);
        }
    });
};

// Helper to promisify chrome.storage.local.set
const storageSet = (key: string, value: string): Promise<void> => {
    return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ [key]: value }, () => {
                resolve();
            });
        } else {
            resolve();
        }
    });
};

export const useSettingsStore = create<SettingsState>((set) => ({
    apiUrl: '', // Default to empty, will load from storage
    setApiUrl: async (url: string) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            await storageSet('flux_api_url', url);
        } else {
            localStorage.setItem('flux_api_url', url);
        }
        set({ apiUrl: url });
    },
    loadSettings: async () => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const stored = await storageGet('flux_api_url');
            if (stored) {
                set({ apiUrl: stored });
            }
        } else {
            const stored = localStorage.getItem('flux_api_url');
            if (stored) {
                set({ apiUrl: stored });
            }
        }
    }
}));

// Helper for non-React contexts (ApiClient)
export const getStoredApiUrl = async (): Promise<string | null> => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        return storageGet('flux_api_url');
    }
    return localStorage.getItem('flux_api_url');
};
