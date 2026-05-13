import type { FluxTheme } from '../constants';

interface Props {
    message: string;
    type: 'success' | 'error';
    theme: FluxTheme;
}

export function FluxNotification({ message, type, theme }: Props) {
    const isSuccess = type === 'success';
    
    return (
        <div style={{
            position: 'fixed', 
            bottom: '24px', 
            right: '24px',
            backgroundColor: isSuccess ? theme.success : theme.error,
            color: isSuccess ? theme.successForeground : theme.errorForeground, 
            padding: '12px 20px', 
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 2147483647, 
            fontSize: '14px', 
            fontWeight: 500,
            animation: 'flux-fade-in 0.3s ease-out',
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
            {isSuccess ? '✅' : '❌'} {message}
        </div>
    );
}
