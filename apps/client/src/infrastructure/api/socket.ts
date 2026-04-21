import { io, type Socket } from 'socket.io-client';
import { defaultClient, getAuthToken } from './api-client';

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
    if (!socket) {
        const wsUrl = import.meta.env.VITE_WS_URL as string | undefined;
        let baseUrl = wsUrl || (await defaultClient.getActiveBaseUrl());
        
        // Remove trailing slashes and ensure it doesn't end with /api
        baseUrl = baseUrl.replace(/\/+$/, '').replace(/\/api$/, '');
        
        const token = await getAuthToken();
        
        console.log(`[Socket] Connecting to ${baseUrl} (namespace: /ws)`);
        
        socket = io(`${baseUrl}/ws`, {
            path: '/socket.io',
            transports: ['websocket', 'polling'], // Allow fallback to polling
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            auth: token ? { token } : undefined,
        });
        
        socket.on('connect', () => {
            console.log('[Socket] Connected to server');
        });
        
        socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
        });
    }
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
