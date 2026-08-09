import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { SERVER_ORIGIN } from '../../api/client';

let socket;

export async function connectSocket() {
  const token = await SecureStore.getItemAsync('authToken');
  if (!token) throw new Error('Authentication token is missing');

  if (!socket) {
    socket = io(SERVER_ORIGIN, {
      auth: { token },
      extraHeaders: { 'ngrok-skip-browser-warning': 'true' },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      transports: ['websocket', 'polling'],
    });
  } else {
    socket.auth = { token };
  }

  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = undefined;
}

export async function emit(event, payload, acknowledge) {
  const activeSocket = await connectSocket();
  activeSocket.emit(event, payload, acknowledge);
}

export async function on(event, listener) {
  const activeSocket = await connectSocket();
  activeSocket.on(event, listener);
  return () => activeSocket.off(event, listener);
}

export function off(event, listener) {
  socket?.off(event, listener);
}

export function isConnected() {
  return Boolean(socket?.connected);
}
