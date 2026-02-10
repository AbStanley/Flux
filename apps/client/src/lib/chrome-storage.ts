/// <reference types="chrome"/>
import type { StateStorage } from 'zustand/middleware';

/**
 * Zustand storage implementation using chrome.storage.local.
 * This ensures state is synchronized between the side panel, 
 * options page, and content scripts.
 */
export const chromeStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return new Promise((resolve) => {
            if (typeof chrome === 'undefined' || !chrome.storage) {
                resolve(localStorage.getItem(name));
                return;
            }
            chrome.storage.local.get([name], (result) => {
                const val = result[name];
                resolve(typeof val === 'string' ? val : (val ? JSON.stringify(val) : null));
            });
        });
    },
    setItem: async (name: string, value: string): Promise<void> => {
        return new Promise((resolve) => {
            if (typeof chrome === 'undefined' || !chrome.storage) {
                localStorage.setItem(name, value);
                resolve();
                return;
            }
            chrome.storage.local.set({ [name]: value }, () => {
                resolve();
            });
        });
    },
    removeItem: async (name: string): Promise<void> => {
        return new Promise((resolve) => {
            if (typeof chrome === 'undefined' || !chrome.storage) {
                localStorage.removeItem(name);
                resolve();
                return;
            }
            chrome.storage.local.remove([name], () => {
                resolve();
            });
        });
    },
};
