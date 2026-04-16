import { create } from 'zustand';
import { authApi } from '@/infrastructure/api/auth';
import { wordsApi } from '@/infrastructure/api/words';

const USER_KEY = 'flux_auth_user';
const REMEMBERED_KEY = 'flux_remembered_users';

export interface AuthUser {
    id: string;
    email: string;
}

function getStoredUser(): AuthUser | null {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function setStoredUser(user: AuthUser | null) {
    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(USER_KEY);
    }
}

function getRememberedUsers(): string[] {
    try {
        const raw = localStorage.getItem(REMEMBERED_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function addRememberedUser(email: string) {
    const users = getRememberedUsers().filter(e => e !== email);
    users.unshift(email); // most recent first
    localStorage.setItem(REMEMBERED_KEY, JSON.stringify(users.slice(0, 5)));
}

function removeRememberedUser(email: string) {
    const users = getRememberedUsers().filter(e => e !== email);
    localStorage.setItem(REMEMBERED_KEY, JSON.stringify(users));
}

const STATS_KEY = 'flux_user_stats';

export function getUserStats(email: string): { wordCount: number } | null {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        const all = raw ? JSON.parse(raw) : {};
        return all[email] || null;
    } catch { return null; }
}

export function setUserStats(email: string, stats: { wordCount: number }) {
    try {
        const raw = localStorage.getItem(STATS_KEY);
        const all = raw ? JSON.parse(raw) : {};
        all[email] = stats;
        localStorage.setItem(STATS_KEY, JSON.stringify(all));
    } catch { /* ignore */ }
}

interface AuthState {
    token: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
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
    isLoading: true,
    error: null,
    rememberedUsers: getRememberedUsers(),

    initialize: async () => {
        // In extension context, sync from chrome.storage.local first
        if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
            try {
                const result = await new Promise<Record<string, unknown>>((resolve) => {
                    chrome.storage.local.get(['flux_auth_token', 'flux_user'], (r) => resolve(r));
                });
                if (result.flux_auth_token) {
                    const token = result.flux_auth_token as string;
                    const user = (result.flux_user as AuthUser) || null;
                    // Sync to localStorage so the rest of the app works
                    authApi.setStoredToken(token);
                    if (user) setStoredUser(user);
                    set({ token, user, isAuthenticated: true, isLoading: false, rememberedUsers: getRememberedUsers() });
                    return;
                }
            } catch { /* fall through to localStorage */ }
        }

        const token = authApi.getStoredToken();
        const user = getStoredUser();
        if (token) {
            set({ token, user, isAuthenticated: true, isLoading: false, rememberedUsers: getRememberedUsers() });
        } else {
            set({ isLoading: false, rememberedUsers: getRememberedUsers() });
        }
    },

    login: async (email: string, password: string) => {
        set({ error: null, isLoading: true });
        try {
            const response = await authApi.login(email, password);
            // Store token in BOTH localStorage and chrome storage before updating state.
            // This ensures getAuthToken() can find it when components fire API calls on mount.
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
        // Also clear chrome storage and notify other extension contexts
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
