import { create } from 'zustand';
import { authApi } from '@/infrastructure/api/auth';
import { wordsApi } from '@/infrastructure/api/words';
import { defaultClient } from '@/infrastructure/api/api-client';
import type { AuthUser } from './auth-storage';
import { 
    setStoredUser, 
    getRememberedUsers, 
    addRememberedUser, 
    removeRememberedUser, 
    setUserStats 
} from './auth-storage';

interface AuthState {
    token: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitializing: boolean;
    error: string | null;
    rememberedUsers: string[];
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
    initialize: () => Promise<void>;
    forgetUser: (email: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitializing: true,
    error: null,
    rememberedUsers: getRememberedUsers(),

    initialize: async () => {
        // Register the logout callback with the API client so 401s trigger a redirect
        defaultClient.setOnUnauthorized(() => {
            const hadToken = !!localStorage.getItem('flux_auth_token');
            useAuthStore.getState().logout();
            if (hadToken) {
                set({ error: 'Session expired. Please log in again.' });
            }
        });

        let token: string | null = null;

        // 1. Try Extension Storage first
        if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
            try {
                const result = await new Promise<Record<string, unknown>>((resolve) => {
                    chrome.storage.local.get(['flux_auth_token', 'flux_user'], (r) => resolve(r));
                });
                if (result.flux_auth_token) {
                    token = result.flux_auth_token as string;
                }
            } catch { /* ignore */ }
        }

        // 2. Fallback to LocalStorage
        if (!token) {
            token = authApi.getStoredToken();
        }

        // 3. Mandatory Verification
        if (token) {
            try {
                // Verify against server
                const verifiedUser = await authApi.getMe();
                
                // Sync back to storage
                authApi.setStoredToken(token);
                setStoredUser(verifiedUser);
                if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
                    chrome.storage.local.set({ flux_auth_token: token, flux_user: verifiedUser });
                }

                set({ 
                    token, 
                    user: verifiedUser, 
                    isAuthenticated: true, 
                    isLoading: false, 
                    isInitializing: false,
                    rememberedUsers: getRememberedUsers() 
                });
            } catch (err) {
                console.error('[Auth] Verification failed:', err);
                authApi.clearStoredToken();
                setStoredUser(null);
                if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
                    chrome.storage.local.remove(['flux_auth_token', 'flux_user']);
                }
                set({ 
                    token: null, 
                    user: null, 
                    isAuthenticated: false, 
                    isLoading: false, 
                    isInitializing: false,
                    rememberedUsers: getRememberedUsers() 
                });
            }
        } else {
            set({ isLoading: false, isInitializing: false, rememberedUsers: getRememberedUsers() });
        }
    },

    login: async (email: string, password: string) => {
        set({ error: null, isLoading: true });
        try {
            const response = await authApi.login(email, password);
            authApi.setStoredToken(response.accessToken);
            setStoredUser(response.user);
            addRememberedUser(email);
            if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
                await new Promise<void>((resolve) => {
                    chrome.storage.local.set({ flux_auth_token: response.accessToken, flux_user: response.user }, () => resolve());
                });
            }
            set({
                token: response.accessToken,
                user: response.user,
                isAuthenticated: true,
                isLoading: false,
                rememberedUsers: getRememberedUsers(),
            });
            wordsApi.getAll({ limit: 1 }).then(r => setUserStats(email, { wordCount: r.total })).catch(() => {});
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Login failed';
            set({ error: message, isLoading: false });
        }
    },

    register: async (email: string, password: string) => {
        set({ error: null, isLoading: true });
        try {
            const response = await authApi.register(email, password);
            authApi.setStoredToken(response.accessToken);
            setStoredUser(response.user);
            addRememberedUser(email);
            if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
                await new Promise<void>((resolve) => {
                    chrome.storage.local.set({ flux_auth_token: response.accessToken, flux_user: response.user }, () => resolve());
                });
            }
            set({
                token: response.accessToken,
                user: response.user,
                isAuthenticated: true,
                isLoading: false,
                rememberedUsers: getRememberedUsers(),
            });
            setUserStats(email, { wordCount: 0 });
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Registration failed';
            set({ error: message, isLoading: false });
        }
    },

    logout: () => {
        authApi.clearStoredToken();
        setStoredUser(null);
        if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
            chrome.storage.local.remove(['flux_auth_token', 'flux_user']);
            chrome.runtime?.sendMessage?.({ type: 'AUTH_LOGOUT' });
        }
        set({
            token: null,
            user: null,
            isAuthenticated: false,
            error: null,
        });
    },

    forgetUser: (email: string) => {
        removeRememberedUser(email);
        set({ rememberedUsers: getRememberedUsers() });
    },
}));
