import { create } from 'zustand';
import { authApi } from '@/infrastructure/api/auth';

interface AuthUser {
    id: string;
    email: string;
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
        if (token) {
            set({ token, isAuthenticated: true, isLoading: false });
        } else {
            set({ isLoading: false });
        }
    },

    login: async (email: string, password: string) => {
        set({ error: null, isLoading: true });
        try {
            const response = await authApi.login(email, password);
            authApi.setStoredToken(response.accessToken);
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
        set({
            token: null,
            user: null,
            isAuthenticated: false,
            error: null,
        });
    },
}));
