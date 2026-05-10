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
