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
}

export function PopupSettingsView({
    onBack, tempUrl, onTempUrlChange, onSave,
    testStatus, testMessage, onTestConnection,
    isAuthenticated, userEmail, onLogout,
}: Props) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            padding: '20px', backgroundColor: '#0f172a', color: '#f8fafc', textAlign: 'left',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <button
                    onClick={onBack}
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
                    <p style={{ margin: '4px 0 10px', fontWeight: 600 }}>{userEmail}</p>
                    <button
                        onClick={onLogout}
                        style={{
                            width: '100%', padding: '6px', backgroundColor: '#ef4444', color: 'white',
                            borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
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
                    onChange={(e) => onTempUrlChange(e.target.value)}
                    placeholder="http://localhost:3000"
                    style={{
                        width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155',
                        backgroundColor: '#1e293b', color: 'white', outline: 'none', boxSizing: 'border-box',
                    }}
                />
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                    Leave empty to use default.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <button
                    onClick={onTestConnection}
                    disabled={testStatus === 'testing'}
                    style={{
                        flex: 1, padding: '10px', backgroundColor: '#475569', color: 'white',
                        borderRadius: '8px', border: 'none', fontWeight: 600,
                        cursor: testStatus === 'testing' ? 'not-allowed' : 'pointer',
                    }}
                >
                    {testStatus === 'testing' ? 'Testing...' : 'Test'}
                </button>
                <button
                    onClick={onSave}
                    style={{
                        flex: 2, padding: '10px', backgroundColor: '#3b82f6', color: 'white',
                        borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    Save
                </button>
            </div>

            {testMessage && (
                <p style={{
                    marginTop: '15px', fontSize: '0.85rem', textAlign: 'center',
                    color: testStatus === 'success' ? '#4ade80' : '#f87171',
                }}>
                    {testMessage}
                </p>
            )}
        </div>
    );
}
