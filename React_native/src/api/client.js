import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const configuredOrigin = process.env.EXPO_PUBLIC_API_URL;

if (!configuredOrigin) {
  throw new Error('EXPO_PUBLIC_API_URL is not configured. Set it in .env.local or the selected EAS environment.');
}

export const SERVER_ORIGIN = configuredOrigin.replace(/\/+$/, '');

const client = axios.create({
  baseURL: `${SERVER_ORIGIN}/api`,
  timeout: 10000,
  headers: { 'ngrok-skip-browser-warning': 'true' },
});

client.interceptors.request.use(async config => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
