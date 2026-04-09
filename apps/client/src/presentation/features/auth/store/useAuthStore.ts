import { create } from 'zustand';
import { authApi } from '@/infrastructure/api/auth';

const USER_KEY = 'flux_auth_user';

interface AuthUser {
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

interface AuthState {
    token: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
    initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    initialize: () => {
        const token = authApi.getStoredToken();
        const user = getStoredUser();
        if (token) {
            set({ token, user, isAuthenticated: true, isLoading: false });
        } else {
            set({ isLoading: false });
        }
    },

    login: async (email: string, password: string) => {
        set({ error: null, isLoading: true });
        try {
            const response = await authApi.login(email, password);
            authApi.setStoredToken(response.accessToken);
            setStoredUser(response.user);
            set({
                token: response.accessToken,
                user: response.user,
                isAuthenticated: true,
                isLoading: false,
            });
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
            set({
                token: response.accessToken,
                user: response.user,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (err) {
            const message =
                err instanceof Error ? err.message : 'Registration failed';
            set({ error: message, isLoading: false });
        }
    },

    logout: () => {
        authApi.clearStoredToken();
        setStoredUser(null);
        set({
            token: null,
            user: null,
            isAuthenticated: false,
            error: null,
        });
    },
}));
