import { useState, useRef } from 'react';
import { useAuthStore, getUserStats } from './store/useAuthStore';
import { X, ArrowLeft, Loader2 } from 'lucide-react';

function getInitials(email: string): string {
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
}

function getColor(email: string): string {
    const colors = [
        'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
        'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
    ];
    let hash = 0;
    for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

export function LoginPage() {
    const { login, register, error, isLoading, rememberedUsers, forgetUser } = useAuthStore();
    const initialMode = rememberedUsers.length > 0 ? 'pick' : 'login';
    const [mode, setMode] = useState<'pick' | 'login' | 'register'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const passwordRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'register') {
            await register(email, password);
        } else {
            await login(email, password);
        }
    };

    const handlePickUser = (userEmail: string) => {
        setEmail(userEmail);
        setPassword('');
        setMode('login');
        setTimeout(() => passwordRef.current?.focus(), 50);
    };

    const handleBack = () => {
        setPassword('');
        useAuthStore.setState({ error: null });
        if (rememberedUsers.length > 0) {
            setMode('pick');
        }
    };

    return (
        <div className="min-h-dvh flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                        Flux
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Your learning assistant</p>
                </div>

                {/* User picker */}
                {mode === 'pick' && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                        <p className="text-sm font-medium text-center text-muted-foreground mb-4">
                            Choose an account
                        </p>
                        <div className="space-y-2">
                            {rememberedUsers.map((userEmail) => (
                                <button
                                    key={userEmail}
                                    type="button"
                                    onClick={() => handlePickUser(userEmail)}
                                    className="w-full flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-accent/50 group"
                                >
                                    <div className={`w-10 h-10 rounded-full ${getColor(userEmail)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                                        {getInitials(userEmail)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-foreground truncate block">
                                            {userEmail}
                                        </span>
                                        {getUserStats(userEmail) && (
                                            <span className="text-[11px] text-muted-foreground">
                                                {getUserStats(userEmail)!.wordCount} words saved
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); forgetUser(userEmail); }}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                                        title="Remove"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </button>
                            ))}
                        </div>

                        <div className="pt-2 flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => { setEmail(''); setMode('login'); }}
                                className="w-full rounded-xl border border-dashed border-border/60 px-4 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                            >
                                Use another account
                            </button>
                            <button
                                type="button"
                                onClick={() => { setEmail(''); setMode('register'); }}
                                className="text-sm text-primary hover:underline"
                            >
                                Create a new account
                            </button>
                        </div>
                    </div>
                )}

                {/* Login / Register form */}
                {(mode === 'login' || mode === 'register') && (
                    <div className="animate-in fade-in duration-200">
                        {rememberedUsers.length > 0 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Back
                            </button>
                        )}

                        {/* Selected user avatar (when coming from picker) */}
                        {mode === 'login' && email && rememberedUsers.includes(email) && (
                            <div className="flex items-center gap-3 mb-5 rounded-xl border border-border/60 bg-card px-4 py-3">
                                <div className={`w-9 h-9 rounded-full ${getColor(email)} flex items-center justify-center text-white text-sm font-bold`}>
                                    {getInitials(email)}
                                </div>
                                <span className="text-sm font-medium text-foreground truncate">{email}</span>
                            </div>
                        )}

                        <h2 className="text-lg font-semibold text-foreground mb-4">
                            {mode === 'register' ? 'Create account' : 'Sign in'}
                        </h2>

                        {error && (
                            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Hide email field if pre-filled from picker */}
                            {!(mode === 'login' && email && rememberedUsers.includes(email)) && (
                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        autoFocus={!email}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label htmlFor="password" className="text-sm font-medium text-foreground">
                                    Password
                                </label>
                                <input
                                    ref={passwordRef}
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={mode === 'register' ? 'Min 6 characters' : 'Enter your password'}
                                    required
                                    autoFocus={!!email}
                                    minLength={mode === 'register' ? 6 : undefined}
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isLoading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-muted-foreground mt-4">
                            {mode === 'register' ? (
                                <>Already have an account?{' '}
                                    <button type="button" onClick={() => setMode('login')} className="text-primary hover:underline">
                                        Sign in
                                    </button>
                                </>
                            ) : (
                                <>Don&apos;t have an account?{' '}
                                    <button type="button" onClick={() => setMode('register')} className="text-primary hover:underline">
                                        Register
                                    </button>
                                </>
                            )}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
