import ReactMarkdown from 'react-markdown';
import type { FluxTheme } from '../constants';

interface FluxContentProps {
    loading: boolean;
    error: string | null;
    result: string;
    theme: FluxTheme;
}

export function FluxContent({ loading, error, result, theme }: FluxContentProps) {
    return (
        <div>
            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.textSecondary, padding: '20px 0' }}>
                    <div className="animate-spin" style={{ width: '16px', height: '16px', border: `2px solid ${theme.accent}`, borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                    Processing...
                </div>
            )}

            {error && (
                <div style={{ color: theme.error, padding: '8px 0' }}>
                    {error}
                    {(error.includes('401') || error.includes('auth') || error.includes('Failed to connect')) && (
                        <div style={{
                            marginTop: '8px',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '8px',
                            color: '#93c5fd',
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
                    background: theme.bgSolid,
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.surface}`,
                    fontSize: 'inherit',
                    lineHeight: 'inherit'
                }}>
                    <ReactMarkdown
                        components={{
                            p: ({ ...props }) => <p style={{ marginBottom: '8px' }} {...props} />,
                            ul: ({ ...props }) => <ul style={{ marginLeft: '16px', listStyleType: 'disc', marginBottom: '8px' }} {...props} />,
                            ol: ({ ...props }) => <ol style={{ marginLeft: '16px', listStyleType: 'decimal', marginBottom: '8px' }} {...props} />,
                            li: ({ ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
                            strong: ({ ...props }) => <strong style={{ color: theme.info, fontWeight: '600' }} {...props} />
                        }}
                    >
                        {result}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
}
