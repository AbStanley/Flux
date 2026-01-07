import React from 'react';
import ReactMarkdown from 'react-markdown';

interface FluxContentProps {
    loading: boolean;
    error: string | null;
    result: string;
}

export const FluxContent: React.FC<FluxContentProps> = ({ loading, error, result }) => {
    return (
        <div>
            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', padding: '20px 0' }}>
                    <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                    Processing...
                </div>
            )}

            {error && (
                <div style={{ color: '#f87171', padding: '8px 0' }}>{error}</div>
            )}

            {!loading && !error && result && (
                <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: '#0f172a',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    fontSize: '14px',
                    lineHeight: '1.6'
                }}>
                    <ReactMarkdown
                        components={{
                            p: ({ node, ...props }) => <p style={{ marginBottom: '8px' }} {...props} />,
                            ul: ({ node, ...props }) => <ul style={{ marginLeft: '16px', listStyleType: 'disc', marginBottom: '8px' }} {...props} />,
                            ol: ({ node, ...props }) => <ol style={{ marginLeft: '16px', listStyleType: 'decimal', marginBottom: '8px' }} {...props} />,
                            li: ({ node, ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
                            strong: ({ node, ...props }) => <strong style={{ color: '#bae6fd', fontWeight: '600' }} {...props} />
                        }}
                    >
                        {result}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};
