import { io, type Socket } from 'socket.io-client';
import { defaultClient } from './api-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        const baseUrl = defaultClient.getBaseUrl() || window.location.origin;
        socket = io(`${baseUrl}/ws`, {
            transports: ['websocket'],
            autoConnect: true,
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
