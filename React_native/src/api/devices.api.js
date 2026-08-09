import client from './client';

export const registerPushTokenRequest = token => client.post('/devices/push-token', { token });
