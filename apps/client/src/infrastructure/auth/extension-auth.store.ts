import { create } from 'zustand';
import { defaultClient } from '../api/api-client';

interface User {
    id: string;
    email: string;
}

interface ExtensionAuthStore {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    loadAuth: () => Promise<void>;
}

export const useExtensionAuthStore = create<ExtensionAuthStore>((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    loadAuth: async () => {
        set({ isLoading: true });
        try {
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const result = await new Promise<{ flux_auth_token?: string, flux_user?: User, flux_api_url?: string }>((resolve) => {
                    chrome.storage.local.get(['flux_auth_token', 'flux_user', 'flux_api_url'], (res) => {
                        const data = res as { flux_auth_token?: string, flux_user?: User, flux_api_url?: string };
                        resolve(data);
                    });
                });

                if (result.flux_auth_token) {
                    set({
                        token: result.flux_auth_token,
                        user: result.flux_user || null,
                        isAuthenticated: true,
                        isLoading: false
                    });
                    return;
                }

                // Auto-connect for localhost (server skips auth for local requests)
                const apiUrl = result.flux_api_url || import.meta.env.VITE_EXT_API_URL || 'http://localhost:3000';
                if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
                    try {
                        const res = await fetch(`${apiUrl}/api/health`);
                        if (res.ok) {
                            set({
                                token: null,
                                user: { id: 'local', email: 'localhost' },
                                isAuthenticated: true,
                                isLoading: false
                            });
                            return;
                        }
                    } catch { /* server not reachable, fall through to unauthenticated */ }
                }
            }
        } catch (e) {
            console.error('Failed to load auth from storage', e);
        }
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await defaultClient.post<{ accessToken: string, user: User }>('/api/auth/login', { email, password });

            const { accessToken, user } = response;

            // Persist to Chrome Storage
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                await new Promise<void>((resolve) => {
                    chrome.storage.local.set({
                        flux_auth_token: accessToken,
                        flux_user: user
                    }, () => resolve());
                });
            }

            set({ token: accessToken, user, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
            console.error('Login failed', error);
            const message = (error as Error).message || 'Login failed';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true });
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            await new Promise<void>((resolve) => {
                chrome.storage.local.remove(['flux_auth_token', 'flux_user'], () => resolve());
            });
        }
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
}));
