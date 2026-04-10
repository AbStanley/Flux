import { useState, useCallback } from 'react';

export interface Notification {
    message: string;
    type: 'success' | 'error';
}

export function useNotification() {
    const [notification, setNotification] = useState<Notification | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const showNotification = useCallback(
        (message: string, type: 'success' | 'error', duration = 3000) => {
            setNotification({ message, type });
            setTimeout(() => setNotification(null), duration);
        },
        [],
    );

    return { notification, isSaving, setIsSaving, showNotification };
}
