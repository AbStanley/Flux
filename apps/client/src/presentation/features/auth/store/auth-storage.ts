export const USER_KEY = 'flux_auth_user';
export const REMEMBERED_KEY = 'flux_remembered_users';
export const STATS_KEY = 'flux_user_stats';

export interface AuthUser {
    id: string;
    email: string;
}

export function setStoredUser(user: AuthUser | null) {
    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(USER_KEY);
    }
}

export function getRememberedUsers(): string[] {
    try {
        const raw = localStorage.getItem(REMEMBERED_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

export function addRememberedUser(email: string) {
    const users = getRememberedUsers().filter(e => e !== email);
    users.unshift(email); // most recent first
    localStorage.setItem(REMEMBERED_KEY, JSON.stringify(users.slice(0, 5)));
}

export function removeRememberedUser(email: string) {
    const users = getRememberedUsers().filter(e => e !== email);
    localStorage.setItem(REMEMBERED_KEY, JSON.stringify(users));
}

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
