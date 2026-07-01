import ReactMarkdown from 'react-markdown';
import type { FluxTheme } from '../constants';
import { RefreshCw } from 'lucide-react';

interface FluxContentProps {
    loading: boolean;
    error: string | null;
    result: string;
    theme: FluxTheme;
    onRetry?: () => void;
}

export function FluxContent({ loading, error, result, theme, onRetry }: FluxContentProps) {
    return (
        <div>

            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textSecondary, padding: '20px 0' }}>
                    <div className="animate-spin" style={{ width: '16px', height: '16px', border: `2px solid ${theme.accent}`, borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                    Processing...
                </div>
            )}

            {error && (
                <div style={{ color: theme.error, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{error}</span>
                        {onRetry && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRetry(); }}
                                onMouseDown={(e) => e.stopPropagation()}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: theme.error,
                                    padding: '4px',
                                    cursor: 'pointer',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = theme.accent; e.currentTarget.style.transform = 'rotate(180deg)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = theme.error; e.currentTarget.style.transform = 'rotate(0deg)'; }}
                                title="Retry Translation"
                            >
                                <RefreshCw size={14} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                    {(error.includes('401') || error.includes('auth') || error.includes('Failed to connect')) && (
                        <div style={{
                            marginTop: '4px',
                            padding: '8px 12px',
                            backgroundColor: `${theme.info}1a`,
                            border: `1px solid ${theme.info}4d`,
                            borderRadius: '8px',
                            color: theme.info,
                            fontSize: '12px'
                        }}>
                            Make sure your server is running and check the extension popup to configure the connection.
                        </div>
                    )}
                </div>
            )}

            {!loading && !error && result && (
                <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    fontWeight: 500,
                    color: theme.text,
                }}>
                    <ReactMarkdown
                        components={{
                            p: ({ ...props }) => <p style={{ marginBottom: '6px' }} {...props} />,
                            ul: ({ ...props }) => <ul style={{ marginLeft: '16px', listStyleType: 'disc', marginBottom: '6px' }} {...props} />,
                            ol: ({ ...props }) => <ol style={{ marginLeft: '16px', listStyleType: 'decimal', marginBottom: '6px' }} {...props} />,
                            li: ({ ...props }) => <li style={{ marginBottom: '2px' }} {...props} />,
                            strong: ({ ...props }) => <strong style={{ color: theme.accent, fontWeight: '600' }} {...props} />
                        }}
                    >
                        {result}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
}
