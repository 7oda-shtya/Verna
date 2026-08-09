import { Expo } from 'expo-server-sdk';
import { prisma } from '../db.js';

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

export async function sendNotification({ userId, title, body, data = {}, type = null, channelId, priority }) {
  await prisma.notification.create({ data: { userId, title, body, type } });
  const tokens = await prisma.deviceToken.findMany({ where: { userId }, select: { token: true } });
  const messages = tokens
    .filter(({ token }) => Expo.isExpoPushToken(token))
    // Keep the persisted type and the Expo payload aligned so clients can route notifications.
    .map(({ token }) => ({ to: token, sound: 'default', title, body, data: { ...data, ...(type ? { type } : {}) }, ...(channelId ? { channelId } : {}), ...(priority ? { priority } : {}) }));
  if (!messages.length) return [];

  const tickets = [];
  try {
    for (const chunk of expo.chunkPushNotifications(messages)) {
      tickets.push(...await expo.sendPushNotificationsAsync(chunk));
    }
  } catch (error) {
    console.error('Expo push delivery failed:', error.message);
  }
  return tickets;
}
