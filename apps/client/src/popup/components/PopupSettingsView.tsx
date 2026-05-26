import type { FluxTheme } from '../../content/constants';

interface Props {
    onBack: () => void;
    tempUrl: string;
    onTempUrlChange: (url: string) => void;
    onSave: () => void;
    testStatus: 'idle' | 'testing' | 'success' | 'error';
    testMessage: string;
    onTestConnection: () => void;
    isAuthenticated: boolean;
    userEmail?: string;
    onLogout: () => void;
    theme: FluxTheme;
}

export function PopupSettingsView({
    onBack, tempUrl, onTempUrlChange, onSave,
    testStatus, testMessage, onTestConnection,
    isAuthenticated, userEmail, onLogout, theme,
}: Props) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            padding: '20px', backgroundColor: theme.bgSolid, color: theme.text, textAlign: 'left',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <button
                    onClick={onBack}
                    style={{ background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', padding: 0, marginRight: '10px' }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Settings</h2>
            </div>

            {isAuthenticated && (
                <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: theme.surface, borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: theme.textSecondary }}>Logged in as:</p>
                    <p style={{ margin: '4px 0 10px', fontWeight: 600 }}>{userEmail}</p>
                    <button
                        onClick={onLogout}
                        style={{
                            width: '100%', padding: '6px', backgroundColor: theme.error, color: 'white',
                            borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                        }}
                    >
                        Log Out
                    </button>
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: theme.textSecondary }}>
                    Server URL
                </label>
                <input
                    type="text"
                    value={tempUrl}
                    onChange={(e) => onTempUrlChange(e.target.value)}
                    placeholder="http://localhost"
                    style={{
                        width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${theme.border}`,
                        backgroundColor: theme.surface, color: theme.text, outline: 'none', boxSizing: 'border-box',
                    }}
                />
                <p style={{ fontSize: '0.75rem', color: theme.textDim, marginTop: '6px' }}>
                    Leave empty to use default.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    onClick={onTestConnection}
                    disabled={testStatus === 'testing'}
                    className="flex-1 p-2.5 rounded-lg font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    style={{
                        backgroundColor: theme.surfaceActive,
                        color: theme.text,
                        border: `1px solid ${theme.border}`,
                    }}
                >
                    {testStatus === 'testing' ? 'Testing...' : 'Test'}
                </button>
                <button
                    onClick={onSave}
                    className="flex-[2] p-2.5 rounded-lg font-semibold border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-[0.98]"
                    style={{
                        backgroundColor: theme.accent,
                        color: theme.accentForeground,
                        boxShadow: `0 4px 12px ${theme.accentGlow}`,
                    }}
                >
                    Save
                </button>
            </div>

            {testMessage && (
                <p style={{
                    marginTop: '15px', fontSize: '0.85rem', textAlign: 'center',
                    color: testStatus === 'success' ? theme.success : theme.error,
                }}>
                    {testMessage}
                </p>
            )}
        </div>
    );
}
