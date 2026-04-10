import { useState } from 'react';

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

export function useConnectionTest() {
    const [testStatus, setTestStatus] = useState<TestStatus>('idle');
    const [testMessage, setTestMessage] = useState('');

    const handleTestConnection = async (url: string) => {
        setTestStatus('testing');
        setTestMessage('');
        try {
            const testUrl = url.replace(/\/$/, '');
            const response = await fetch(`${testUrl}/api/health`, {
                method: 'GET',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                setTestStatus('success');
                setTestMessage('Connected successfully!');
            } else {
                throw new Error(`Status: ${response.status}`);
            }
        } catch (error: unknown) {
            setTestStatus('error');
            const message = (error as Error).message || 'Unknown error';
            setTestMessage(`Failed: ${message}`);
        }
    };

    return { testStatus, testMessage, handleTestConnection };
}
