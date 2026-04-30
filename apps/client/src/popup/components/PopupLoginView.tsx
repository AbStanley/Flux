import { useState, useRef, useEffect } from 'react';

interface Props {
    email: string;
    onEmailChange: (v: string) => void;
    password: string;
    onPasswordChange: (v: string) => void;
    onLogin: (e: React.FormEvent) => void;
    authError: string | null;
    authLoading: boolean;
    onSettingsClick: () => void;
    rememberedUsers: string[];
    onForgetUser: (email: string) => void;
}

function getInitials(email: string): string {
    return email.split('@')[0].slice(0, 2).toUpperCase();
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#ec4899', '#6366f1'];
function getColor(email: string): string {
    let hash = 0;
    for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
    return COLORS[Math.abs(hash) % COLORS.length];
}

export function PopupLoginView({
    email, onEmailChange, password, onPasswordChange,
    onLogin, authError, authLoading, onSettingsClick,
    rememberedUsers, onForgetUser,
}: Props) {
    const hasRemembered = rememberedUsers.length > 0;
    const [mode, setMode] = useState<'pick' | 'login'>(hasRemembered ? 'pick' : 'login');
    const passwordRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);

    // Clean focus management without timeouts
    useEffect(() => {
        if (mode === 'login') {
            const timer = requestAnimationFrame(() => {
                if (email) passwordRef.current?.focus();
                else emailRef.current?.focus();
            });
            return () => cancelAnimationFrame(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    const handlePickUser = (userEmail: string) => {
        onEmailChange(userEmail);
        onPasswordChange('');
        setMode('login');
    };

    const handleBack = () => {
        onPasswordChange('');
        if (hasRemembered) setMode('pick');
    };

    const settingsBtn: React.CSSProperties = {
        position: 'absolute', top: '16px', right: '16px', background: 'none',
        border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px',
    };

    return (
        <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <button onClick={onSettingsClick} style={settingsBtn} title="Settings">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            </button>

            {/* Logo */}
            <div style={{ textAlign: 'center', marginTop: '16px', marginBottom: '24px' }}>
                <img src="/flux-logo.png" alt="Flux" style={{ width: '48px', height: '48px', margin: '0 auto 8px' }} />
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>Flux</h2>
                <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>Your learning assistant</p>
            </div>

            {/* User picker */}
            {mode === 'pick' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', margin: '0 0 4px' }}>
                        Choose an account
                    </p>
                    {rememberedUsers.map((userEmail) => (
                        <button
                            key={userEmail}
                            type="button"
                            onClick={() => handlePickUser(userEmail)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                                borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#1e293b',
                                color: '#f8fafc', cursor: 'pointer', textAlign: 'left', width: '100%',
                                transition: 'border-color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#334155')}
                        >
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%', backgroundColor: getColor(userEmail),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                            }}>
                                {getInitials(userEmail)}
                            </div>
                            <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {userEmail}
                            </span>
                            <span
                                onClick={(e) => { e.stopPropagation(); onForgetUser(userEmail); }}
                                style={{ color: '#64748b', cursor: 'pointer', fontSize: '14px', padding: '2px 4px', lineHeight: 1 }}
                                title="Remove"
                            >
                                &times;
                            </span>
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() => { onEmailChange(''); setMode('login'); }}
                        style={{
                            padding: '10px', borderRadius: '10px', border: '1px dashed #334155',
                            backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer',
                            fontSize: '0.8rem', transition: 'border-color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#334155')}
                    >
                        Use another account
                    </button>
                </div>
            )}

            {/* Login form */}
            {mode === 'login' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    {hasRemembered && (
                        <button
                            type="button"
                            onClick={handleBack}
                            style={{
                                background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
                                fontSize: '0.8rem', textAlign: 'left', padding: 0, marginBottom: '4px',
                            }}
                        >
                            &larr; Back
                        </button>
                    )}

                    {/* Selected user badge */}
                    {email && rememberedUsers.includes(email) && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                            borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#1e293b',
                        }}>
                            <div style={{
                                width: '32px', height: '32px', minWidth: '32px', borderRadius: '50%', backgroundColor: getColor(email),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: '0.7rem', fontWeight: 700,
                            }}>
                                {getInitials(email)}
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{email}</span>
                        </div>
                    )}

                    <form onSubmit={onLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Hide email if pre-filled from picker */}
                        {!(email && rememberedUsers.includes(email)) && (
                            <input
                                ref={emailRef}
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => onEmailChange(e.target.value)}
                                required
                                style={{
                                    padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155',
                                    backgroundColor: '#1e293b', color: 'white', outline: 'none', fontSize: '0.9rem',
                                }}
                            />
                        )}

                        <input
                            ref={passwordRef}
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => onPasswordChange(e.target.value)}
                            required
                            style={{
                                padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155',
                                backgroundColor: '#1e293b', color: 'white', outline: 'none', fontSize: '0.9rem',
                            }}
                        />

                        {authError && (
                            <div style={{ color: '#f87171', fontSize: '0.8rem', textAlign: 'center' }}>
                                {authError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={authLoading}
                            style={{
                                padding: '10px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px',
                                border: 'none', fontWeight: 600, cursor: authLoading ? 'not-allowed' : 'pointer',
                                opacity: authLoading ? 0.6 : 1, fontSize: '0.9rem',
                            }}
                        >
                            {authLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
