import { defaultClient } from './api-client';

interface AuthResponse {
    accessToken: string;
    user: { id: string; email: string };
}

const TOKEN_KEY = 'flux_auth_token';

export const authApi = {
    async login(email: string, password: string): Promise<AuthResponse> {
        return defaultClient.post<AuthResponse>('/api/auth/login', {
            email,
            password,
        });
    },

    async register(email: string, password: string): Promise<AuthResponse> {
        return defaultClient.post<AuthResponse>('/api/auth/register', {
            email,
            password,
        });
    },

    async getMe(): Promise<{ id: string; email: string }> {
        return defaultClient.get<{ id: string; email: string }>('/api/auth/me');
    },

    getStoredToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },

    setStoredToken(token: string): void {
        localStorage.setItem(TOKEN_KEY, token);
    },

    clearStoredToken(): void {
        localStorage.removeItem(TOKEN_KEY);
    },
};
