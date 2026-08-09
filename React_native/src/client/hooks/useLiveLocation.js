import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emit } from '../services/socket.service';
import { distanceMeters } from '../../redux/utils/geo';

const LOCATION_TASK = 'verna-active-trip-location';
const ACTIVE_TRIP_KEY = 'activeTripId';
const ACTIVE_TRIP_ROLE_KEY = 'activeTripLocationRole';
const LAST_BACKGROUND_SEND_KEY = 'lastBackgroundLocationSend';

// Background points are batched by the OS and can arrive faster than useful for a party-location
// marker once the app isn't foregrounded, so — for the DRIVER only — we additionally require BOTH
// a 60s gap AND real movement since the last point we actually sent. The client's own background
// tracking (while waiting for/riding with a driver) stays unthrottled: it's the signal that drives
// the driver's "party location" marker, and slowing it down would degrade that live view for no
// battery benefit (only the driver's background feed was the agreed target for this throttle).
// 25m matches the OS-level distanceInterval below and comfortably exceeds typical GPS drift
// (5-15m), so it filters noise without swallowing genuine short hops.
const BACKGROUND_MIN_INTERVAL_MS = 60 * 1000;
const BACKGROUND_MIN_DISTANCE_M = 25;

if (!TaskManager.isTaskDefined(LOCATION_TASK)) {
  TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
    if (error || !data?.locations?.length) return;
    const tripId = await AsyncStorage.getItem(ACTIVE_TRIP_KEY);
    if (!tripId) return;
    const { latitude: lat, longitude: lng } = data.locations.at(-1).coords;

    const role = await AsyncStorage.getItem(ACTIVE_TRIP_ROLE_KEY);
    if (role === 'DRIVER') {
      const lastRaw = await AsyncStorage.getItem(LAST_BACKGROUND_SEND_KEY);
      const last = lastRaw ? JSON.parse(lastRaw) : null;
      const now = Date.now();
      if (last && (now - last.at < BACKGROUND_MIN_INTERVAL_MS || distanceMeters(last, { lat, lng }) < BACKGROUND_MIN_DISTANCE_M)) {
        return;
      }
      await AsyncStorage.setItem(LAST_BACKGROUND_SEND_KEY, JSON.stringify({ lat, lng, at: now }));
    }

    await emit('location:update', { tripId, lat, lng }).catch(() => {});
  });
}

export default function useLiveLocation(tripId, active = true, isDriver = false) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tripId || !active) return undefined;
    let foregroundSubscription;
    let cancelled = false;

    const start = async () => {
      const foreground = await Location.requestForegroundPermissionsAsync();
      if (foreground.status !== 'granted') throw new Error('Location permission is required');

      await AsyncStorage.setItem(ACTIVE_TRIP_KEY, tripId);
      await AsyncStorage.setItem(ACTIVE_TRIP_ROLE_KEY, isDriver ? 'DRIVER' : 'CLIENT');
      foregroundSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
        current => {
          if (cancelled) return;
          setLocation(current);
          const { latitude: lat, longitude: lng } = current.coords;
          emit('location:update', { tripId, lat, lng }).catch(() => {});
        },
      );

      const background = await Location.requestBackgroundPermissionsAsync();
      if (background.status === 'granted' && !(await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK))) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK, {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 25,
          deferredUpdatesInterval: 10000,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'Verna trip is active',
            notificationBody: 'Sharing your location with the other trip party',
          },
        });
      }
    };

    start().catch(startError => {
      if (!cancelled) setError(startError.message);
    });

    return () => {
      cancelled = true;
      foregroundSubscription?.remove();
      AsyncStorage.multiRemove([ACTIVE_TRIP_KEY, ACTIVE_TRIP_ROLE_KEY, LAST_BACKGROUND_SEND_KEY]);
      Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)
        .then(started => started && Location.stopLocationUpdatesAsync(LOCATION_TASK))
        .catch(() => {});
    };
  }, [tripId, active, isDriver]);

  return { location, error };
}
