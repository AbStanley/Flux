import { useState, useEffect, useMemo } from 'react';
import { useSettingsStore } from '../infrastructure/settings/settings.store';
import { useExtensionAuthStore } from '../infrastructure/auth/extension-auth.store';
import { THEMES, DEFAULT_THEME, type FluxTheme } from '../content/constants';
import { useChromeStorage } from './hooks/useChromeStorage';
import { useConnectionTest } from './hooks/useConnectionTest';
import { useAvailableModels } from './hooks/useAvailableModels';
import { PopupLoginView } from './components/PopupLoginView';
import { PopupSettingsView } from './components/PopupSettingsView';
import { customThemeToFluxTheme } from '../lib/color-derive';

export default function FluxExtensionPopup() {
    const [showSettings, setShowSettings] = useState(false);
    const [password, setPassword] = useState('');

    const { apiUrl, setApiUrl, loadSettings } = useSettingsStore();
    const { isAuthenticated, login, logout, loadAuth, user, error: authError, isLoading: authLoading } = useExtensionAuthStore();

    const [tempUrl, setTempUrl] = useState(apiUrl);
    const [prevApiUrl, setPrevApiUrl] = useState(apiUrl);
    if (prevApiUrl !== apiUrl) {
        setPrevApiUrl(apiUrl);
        setTempUrl(apiUrl);
    }

    const storage = useChromeStorage(DEFAULT_THEME);
    const { testStatus, testMessage, handleTestConnection } = useConnectionTest();
    const { availableModels } = useAvailableModels(apiUrl);

    useEffect(() => { loadSettings(); loadAuth(); }, [loadSettings, loadAuth]);

    // Compute all available themes (built-in + custom from storage)
    const availableThemes = useMemo(() => {
        const merged: Record<string, FluxTheme> = { ...THEMES };
        if (storage.customThemes) {
            storage.customThemes.forEach(ct => {
                merged[ct.id] = customThemeToFluxTheme(ct);
            });
        }
        return merged;
    }, [storage.customThemes]);

    const theme = availableThemes[storage.themeId] || availableThemes[DEFAULT_THEME] || THEMES[DEFAULT_THEME];

    const handleSaveSettings = async () => {
        await setApiUrl(tempUrl);
        setShowSettings(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(storage.email, password);
            storage.persistEmail(storage.email);
        } catch (err) {
            console.error(err);
        }
    };

    const openSidePanel = () => {
        if (window.chrome?.sidePanel) {
            window.chrome.sidePanel.open({ windowId: window.chrome.windows.WINDOW_ID_CURRENT });
            window.close();
        }
    };

    const scanSubtitles = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0]?.id;
            if (tabId) {
                chrome.tabs.sendMessage(tabId, { type: 'SCAN_SUBTITLES' });
                window.close();
            }
        });
    };

    if (showSettings) {
        return (
            <PopupSettingsView
                onBack={() => setShowSettings(false)}
                tempUrl={tempUrl}
                onTempUrlChange={setTempUrl}
                onSave={handleSaveSettings}
                testStatus={testStatus}
                testMessage={testMessage}
                onTestConnection={() => handleTestConnection(tempUrl)}
                isAuthenticated={isAuthenticated}
                userEmail={user?.email}
                onLogout={logout}
                theme={theme}
            />
        );
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '450px', padding: '24px', 
            backgroundColor: theme.bgSolid,
            color: theme.text,
            textAlign: 'center', position: 'relative', transition: 'background-color 0.3s, color 0.3s',
            width: '100%', boxSizing: 'border-box',
        }}>
            {!isAuthenticated ? (
                <PopupLoginView
                    email={storage.email}
                    onEmailChange={storage.setEmail}
                    password={password}
                    onPasswordChange={setPassword}
                    onLogin={handleLogin}
                    authError={authError}
                    authLoading={authLoading}
                    onSettingsClick={() => setShowSettings(true)}
                    rememberedUsers={storage.rememberedUsers}
                    onForgetUser={storage.forgetUser}
                    theme={theme}
                />
            ) : (
                <>
                    {/* Settings Gear */}
                    <button
                        onClick={() => setShowSettings(true)}
                        style={{
                            position: 'absolute', top: '20px', right: '20px', background: 'none',
                            border: 'none', color: theme.textSecondary, cursor: 'pointer', padding: '4px',
                        }}
                        title="Settings"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    </button>

                    <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src="/flux-logo.png" alt="Flux Logo" style={{ width: '40px', height: '40px' }} />
                        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Flux Reader</h2>
                    </div>

                    <p style={{ margin: '0 0 20px', fontSize: '0.9rem', color: theme.textSecondary }}>
                        Welcome, {user?.email}
                    </p>

                    <button
                        onClick={openSidePanel}
                        style={{
                            marginTop: '8px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '10px', padding: '12px 20px', backgroundColor: theme.accent, color: theme.accentForeground,
                            borderRadius: '12px', border: 'none', width: '100%', fontWeight: 600,
                            cursor: 'pointer', transition: 'opacity 0.2s, background-color 0.3s',
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
                </>
            )}

            {/* Enable toggle - Always visible at bottom */}
            <div style={{
                marginTop: isAuthenticated ? '12px' : '0px',
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                backgroundColor: theme.surface, borderRadius: '12px', border: `1px solid ${theme.border}`,
                width: '100%', boxSizing: 'border-box', transition: 'background-color 0.3s',
            }}>
                <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>Enable Flux</span>
                <button
                    onClick={storage.toggleEnabled}
                    style={{
                        position: 'relative', width: '44px', height: '24px', borderRadius: '999px',
                        backgroundColor: storage.enabled ? theme.accent : '#cbd5e1',
                        border: 'none', cursor: 'pointer', transition: 'background-color 0.2s',
                    }}
                >
                    <span style={{
                        position: 'absolute', top: '2px', left: storage.enabled ? '22px' : '2px',
                        width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white',
                        transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }} />
                </button>
            </div>

            {isAuthenticated && (
                <>
                    {/* Theme picker with horizontal scroll */}
                    <div style={{
                        marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                        backgroundColor: theme.surface, borderRadius: '12px', border: `1px solid ${theme.border}`,
                        transition: 'background-color 0.3s', width: '100%', boxSizing: 'border-box',
                    }}>
                        <span style={{ flex: 1, textAlign: 'left', fontWeight: 500, fontSize: '0.9rem' }}>Theme</span>
                        <div style={{ 
                            display: 'flex', 
                            gap: '8px', 
                            overflowX: 'auto', 
                            padding: '4px 2px',
                            maxWidth: '180px',
                            scrollbarWidth: 'none',
                        }}>
                            {Object.values(availableThemes).map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => storage.persistTheme(t.id)}
                                    title={t.name}
                                    style={{
                                        position: 'relative', width: '24px', height: '24px', borderRadius: '50%',
                                        overflow: 'hidden',
                                        border: storage.themeId === t.id ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                                        cursor: 'pointer', padding: 0, flexShrink: 0,
                                        boxShadow: storage.themeId === t.id ? `0 0 10px ${theme.accent}66` : 'none',
                                        transform: storage.themeId === t.id ? 'scale(1.15)' : 'scale(1)',
                                        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        background: 'none',
                                    }}
                                >
                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', transform: 'rotate(15deg) scale(1.6)' }}>
                                        <div style={{ flex: 1, background: t.bgSolid }} />
                                        <div style={{ flex: 1, background: t.accent }} />
                                    </div>
                                    {/* Inner ring for selected state to make it pop */}
                                    {storage.themeId === t.id && (
                                        <div style={{ position: 'absolute', inset: '1px', border: '1px solid white', borderRadius: '50%', opacity: 0.5 }} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Model selector */}
                    {availableModels.length > 0 && (
                        <div style={{
                            marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                            backgroundColor: theme.surface, borderRadius: '12px', border: `1px solid ${theme.border}`,
                            transition: 'background-color 0.3s', width: '100%', boxSizing: 'border-box',
                        }}>
                            <span style={{ textAlign: 'left', fontWeight: 500, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Model</span>
                            <select
                                value={storage.selectedModel || availableModels[0]}
                                onChange={(e) => storage.persistModel(e.target.value)}
                                style={{
                                    flex: 1, background: theme.surfaceActive, color: theme.text,
                                    border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '6px 8px',
                                    fontSize: '0.8rem', outline: 'none', cursor: 'pointer', minWidth: 0,
                                }}
                            >
                                {availableModels.map(m => (
                                    <option key={m} value={m} style={{ backgroundColor: theme.bgSolid }}>{m}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={scanSubtitles}
                        style={{
                            marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '10px', padding: '12px 20px', backgroundColor: theme.surface, color: theme.text,
                            borderRadius: '12px', border: `1px solid ${theme.border}`, width: '100%', fontWeight: 600,
                            cursor: 'pointer', transition: 'opacity 0.2s, background-color 0.3s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="6" width="20" height="12" rx="2" />
                            <path d="M6 14h2M10 14h8" />
                        </svg>
                        Scan Videos for Subtitles
                    </button>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: theme.textSecondary }}>
                            {storage.enabled ? 'Flux is active on all pages.' : 'Flux is disabled.'}
                        </p>
                        <button
                            onClick={logout}
                            style={{
                                background: 'none', border: 'none', color: theme.textSecondary,
                                cursor: 'pointer', fontSize: '0.75rem', padding: '4px 8px',
                                borderRadius: '6px', transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = theme.error)}
                            onMouseLeave={(e) => (e.currentTarget.style.color = theme.textSecondary)}
                        >
                            Log out
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
