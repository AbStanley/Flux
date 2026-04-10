import { io, type Socket } from 'socket.io-client';
import { defaultClient, getAuthToken } from './api-client';

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
    if (!socket) {
        const baseUrl = (await defaultClient.getActiveBaseUrl()) || window.location.origin;
        const token = await getAuthToken();
        socket = io(`${baseUrl}/ws`, {
            transports: ['websocket'],
            autoConnect: true,
            auth: token ? { token } : undefined,
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
