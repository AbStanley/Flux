import { useState, type FormEvent } from 'react';
import { useAuthStore } from './store/useAuthStore';
import './LoginPage.css';

export function LoginPage() {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, register, error, isLoading } = useAuthStore();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isRegister) {
            await register(email, password);
        } else {
            await login(email, password);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1 className="login-title">⚡ Flux</h1>
                    <p className="login-subtitle">Reader Helper</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <h2 className="form-title">
                        {isRegister ? 'Create Account' : 'Welcome Back'}
                    </h2>

                    {error && (
                        <div className="login-error">{error}</div>
                    )}

                    <div className="form-field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={isRegister ? 'Min 6 characters' : '••••••••'}
                            required
                            minLength={isRegister ? 6 : undefined}
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? 'Please wait...'
                            : isRegister
                                ? 'Create Account'
                                : 'Sign In'}
                    </button>
                </form>

                <div className="login-footer">
                    <button
                        type="button"
                        className="toggle-mode"
                        onClick={() => setIsRegister(!isRegister)}
                    >
                        {isRegister
                            ? 'Already have an account? Sign in'
                            : "Don't have an account? Register"}
                    </button>
                </div>
            </div>
        </div>
    );
}
