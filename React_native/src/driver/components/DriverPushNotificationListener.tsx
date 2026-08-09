import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import usePushNotifications from '../../client/hooks/usePushNotifications';
import { fetchAvailableTrips, setActiveTrip } from '../../redux/slices/driver/tripSlice';

export default function DriverPushNotificationListener() {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const onNotification = useCallback((data: Record<string, unknown>) => {
    if (data?.type === 'NEW_RIDE_REQUEST') {
      (dispatch as any)(fetchAvailableTrips());
      return;
    }
    if (data?.type !== 'OFFER_ACCEPTED' || typeof data.tripId !== 'string') return;
    dispatch(setActiveTrip({ id: data.tripId, status: 'BOOKED' }));
    navigation.navigate('ActiveTrip');
  }, [dispatch, navigation]);
  usePushNotifications(true, onNotification);
  return null;
}
