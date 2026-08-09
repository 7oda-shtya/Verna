import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { registerPushTokenRequest } from '../../api/devices.api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export default function usePushNotifications(enabled, onNotification) {
  useEffect(() => {
    if (!enabled || !Device.isDevice) return;
    let tokenSubscription;
    let receivedSubscription;
    let responseSubscription;
    const notify = notification => onNotification?.(notification?.request?.content?.data || {});

    const register = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
        });
        await Notifications.setNotificationChannelAsync('ride-requests', {
          name: 'Ride requests',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 300, 180, 300, 180, 500],
          sound: 'default',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }
      const current = await Notifications.getPermissionsAsync();
      const permission = current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
      if (permission.status !== 'granted') return;
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      await registerPushTokenRequest(token);
      tokenSubscription = Notifications.addPushTokenListener(next => {
        registerPushTokenRequest(next.data).catch(() => {});
      });
      receivedSubscription = Notifications.addNotificationReceivedListener(notify);
      responseSubscription = Notifications.addNotificationResponseReceivedListener(response => notify(response.notification));
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) notify(lastResponse.notification);
    };
    register().catch(() => {});
    return () => {
      tokenSubscription?.remove();
      receivedSubscription?.remove();
      responseSubscription?.remove();
    };
  }, [enabled, onNotification]);
}
