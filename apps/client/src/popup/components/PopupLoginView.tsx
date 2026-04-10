import { useRef, useEffect } from 'react';

interface Props {
    email: string;
    onEmailChange: (v: string) => void;
    password: string;
    onPasswordChange: (v: string) => void;
    onLogin: (e: React.FormEvent) => void;
    authError: string | null;
    authLoading: boolean;
    onSettingsClick: () => void;
}

export function PopupLoginView({
    email, onEmailChange, password, onPasswordChange,
    onLogin, authError, authLoading, onSettingsClick,
}: Props) {
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const didFocus = useRef(false);

    useEffect(() => {
        if (!didFocus.current) {
            didFocus.current = true;
            setTimeout(() => {
                if (emailRef.current?.value) passwordRef.current?.focus();
                else emailRef.current?.focus();
            }, 100);
        }
    }, []);

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%', padding: '20px',
            backgroundColor: '#0f172a', color: '#f8fafc', textAlign: 'center', position: 'relative',
        }}>
            <button
                onClick={onSettingsClick}
                style={{
                    position: 'absolute', top: '20px', right: '20px', background: 'none',
                    border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px',
                }}
                title="Settings"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            </button>

            <div style={{ marginBottom: '30px', marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <img src="/flux-logo.png" alt="Flux Logo" style={{ width: '60px', height: '60px' }} />
                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Flux Reader</h2>
                <p style={{ margin: 0, color: '#94a3b8' }}>Please log in to continue</p>
            </div>

            <form onSubmit={onLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                    ref={emailRef}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    required
                    style={{
                        padding: '12px', borderRadius: '8px', border: '1px solid #334155',
                        backgroundColor: '#1e293b', color: 'white', outline: 'none',
                    }}
                />
                <input
                    ref={passwordRef}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    required
                    style={{
                        padding: '12px', borderRadius: '8px', border: '1px solid #334155',
                        backgroundColor: '#1e293b', color: 'white', outline: 'none',
                    }}
                />

                {authError && (
                    <div style={{ color: '#f87171', fontSize: '0.85rem', textAlign: 'center' }}>
                        {authError}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={authLoading}
                    style={{
                        padding: '12px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px',
                        border: 'none', fontWeight: 600, cursor: authLoading ? 'not-allowed' : 'pointer',
                        opacity: authLoading ? 0.7 : 1, marginTop: '10px',
                    }}
                >
                    {authLoading ? 'Logging in...' : 'Log In'}
                </button>
            </form>
        </div>
    );
}
