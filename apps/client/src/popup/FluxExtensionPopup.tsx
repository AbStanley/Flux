import { useState, useEffect } from 'react';
import { useSettingsStore } from '../infrastructure/settings/settings.store';
import { useExtensionAuthStore } from '../infrastructure/auth/extension-auth.store';

export default function FluxExtensionPopup() {
    const [enabled, setEnabled] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [tempUrl, setTempUrl] = useState('');

    // Settings & Auth Stores
    const { apiUrl, setApiUrl, loadSettings } = useSettingsStore();
    const { isAuthenticated, login, logout, loadAuth, user, error: authError, isLoading: authLoading } = useExtensionAuthStore();

    // Login Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        // Load initial state
        if (window.chrome?.storage?.local) {
            window.chrome.storage.local.get(['fluxEnabled'], (result) => {
                if (result.fluxEnabled !== undefined) {
                    setEnabled(result.fluxEnabled as boolean);
                }
            });
        }
        loadSettings();
        loadAuth();
    }, [loadSettings, loadAuth]);

    // Sync local state when store updates
    useEffect(() => {
        setTempUrl(apiUrl);
    }, [apiUrl]);

    const toggleFlux = () => {
        const newState = !enabled;
        setEnabled(newState);
        if (window.chrome?.storage?.local) {
            window.chrome.storage.local.set({ fluxEnabled: newState });
        }
    };

    const openSidePanel = () => {
        if (window.chrome?.sidePanel) {
            window.chrome.sidePanel.open({ windowId: window.chrome.windows.WINDOW_ID_CURRENT });
            window.close();
        }
    };

    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');

    const handleSaveSettings = async () => {
        await setApiUrl(tempUrl);
        setShowSettings(false);
    };

    const handleTestConnection = async () => {
        setTestStatus('testing');
        setTestMessage('');
        try {
            // We target /api/health which is explicitly public and bypasses Auth.
            const testUrl = tempUrl.replace(/\/$/, ''); // Remove trailing slash
            const response = await fetch(`${testUrl}/api/health`, {
                method: 'GET',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                setTestStatus('success');
                setTestMessage('Connected successfully! ✅');
            } else {
                throw new Error(`Status: ${response.status}`);
            }
        } catch (error: unknown) {
            setTestStatus('error');
            const message = (error as Error).message || 'Unknown error';
            setTestMessage(`Failed: ${message} ❌`);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch (e) {
            console.error(e);
        }
    };

    if (showSettings) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                padding: '20px',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                textAlign: 'left'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                    <button
                        onClick={() => setShowSettings(false)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, marginRight: '10px' }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Settings</h2>
                </div>

                {isAuthenticated && (
                    <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Logged in as:</p>
                        <p style={{ margin: '4px 0 10px', fontWeight: 600 }}>{user?.email}</p>
                        <button
                            onClick={logout}
                            style={{
                                width: '100%',
                                padding: '6px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                borderRadius: '6px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                            }}
                        >
                            Log Out
                        </button>
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>
                        Server URL
                    </label>
                    <input
                        type="text"
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        placeholder="http://localhost:3000"
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            backgroundColor: '#1e293b',
                            color: 'white',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                        Leave empty to use default.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleTestConnection}
                        disabled={testStatus === 'testing'}
                        style={{
                            flex: 1,
                            padding: '10px',
                            backgroundColor: '#475569',
                            color: 'white',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: 600,
                            cursor: testStatus === 'testing' ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {testStatus === 'testing' ? 'Testing...' : 'Test'}
                    </button>
                    <button
                        onClick={handleSaveSettings}
                        style={{
                            flex: 2,
                            padding: '10px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Save
                    </button>
                </div>

                {testMessage && (
                    <p style={{
                        marginTop: '15px',
                        fontSize: '0.85rem',
                        color: testStatus === 'success' ? '#4ade80' : '#f87171',
                        textAlign: 'center'
                    }}>
                        {testMessage}
                    </p>
                )}
            </div>
        );
    }

    // Login View (If not authenticated)
    if (!isAuthenticated) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                padding: '20px',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                textAlign: 'center',
                position: 'relative'
            }}>
                {/* Settings Gear - For URL config even when logged out */}
                <button
                    onClick={() => setShowSettings(true)}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px'
                    }}
                    title="Settings"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                </button>

                <div style={{ marginBottom: '30px', marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <img src="/flux-reader-helper.png" alt="Flux Logo" style={{ width: '60px', height: '60px' }} />
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Flux Reader</h2>
                    <p style={{ margin: 0, color: '#94a3b8' }}>Please log in to continue</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            backgroundColor: '#1e293b',
                            color: 'white',
                            outline: 'none'
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            backgroundColor: '#1e293b',
                            color: 'white',
                            outline: 'none'
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
                            padding: '12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: 600,
                            cursor: authLoading ? 'not-allowed' : 'pointer',
                            opacity: authLoading ? 0.7 : 1,
                            marginTop: '10px'
                        }}
                    >
                        {authLoading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '20px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            textAlign: 'center',
            position: 'relative' // For absolute positioning if needed
        }}>
            {/* Settings Gear - Absolute Top Right */}
            <button
                onClick={() => setShowSettings(true)}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px'
                }}
                title="Settings"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            </button>

            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/flux-reader-helper.png" alt="Flux Logo" style={{ width: '40px', height: '40px' }} />
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Flux Reader</h2>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: '0.9rem', color: '#94a3b8' }}>
                Welcome, {user?.email}
            </p>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>Enable Flux</span>
                <button
                    onClick={toggleFlux}
                    style={{
                        position: 'relative',
                        width: '44px',
                        height: '24px',
                        borderRadius: '999px',
                        backgroundColor: enabled ? '#3b82f6' : '#cbd5e1',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                >
                    <span style={{
                        position: 'absolute',
                        top: '2px',
                        left: enabled ? '22px' : '2px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        transition: 'left 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }} />
                </button>
            </div>

            <button
                onClick={openSidePanel}
                style={{
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '12px 20px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '12px',
                    border: 'none',
                    width: '100%',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                </svg>
                Open Side Panel
            </button>

            <p style={{
                marginTop: '20px',
                fontSize: '0.8rem',
                color: '#64748b'
            }}>
                {enabled ? 'Flux is active on all pages.' : 'Flux is disabled.'}
            </p>
        </div>
    );
}
