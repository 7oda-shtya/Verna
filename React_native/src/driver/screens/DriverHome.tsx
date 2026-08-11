import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, Pressable, View } from 'react-native';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../theme/useTheme';
import { fetchAvailableTrips, removeAvailableTrip, upsertAvailableTrip } from '../../redux/slices/driver/tripSlice';
import { toggleDriverStatusRequest } from '../../api/driver.api';
import { updateClientInfo } from '../../redux/slices/client/authSlice';
import { emit, on } from '../../client/services/socket.service';

export default function DriverHome() {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { theme } = useTheme();
  const { availableTrips, activeTrip, loading, error } = useSelector((state: any) => state.trip);
  const isOnline = useSelector((state: any) => state.auth.isOnline);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');

  const refresh = useCallback(() => dispatch(fetchAvailableTrips()), [dispatch]);
  useEffect(() => { refresh(); }, [refresh]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  // Real-time feed sync: only join the drivers:online room while online and this screen is
  // focused, so a backgrounded/offline driver isn't paying the battery cost of a live socket feed.
  useEffect(() => {
    if (!isOnline || !isFocused) return undefined;
    let unsubscribers: (() => void)[] = [];
    let cancelled = false;

    const resubscribe = () => { emit('drivers:subscribe').catch(() => {}); };
    emit('drivers:subscribe').catch(() => {});
    Promise.all([
      on('connect', resubscribe),
      on('ride:new', (trip: any) => dispatch(upsertAvailableTrip(trip))),
      on('ride:taken', ({ tripId }: any) => dispatch(removeAvailableTrip(tripId))),
      on('ride:cancelled', ({ tripId }: any) => dispatch(removeAvailableTrip(tripId))),
    ]).then(fns => { if (!cancelled) unsubscribers = fns; else fns.forEach(fn => fn()); });

    return () => {
      cancelled = true;
      unsubscribers.forEach(fn => fn());
      emit('drivers:unsubscribe').catch(() => {});
    };
  }, [isOnline, isFocused, dispatch]);

  const toggleStatus = async () => {
    try {
      setUpdatingStatus(true);
      setStatusError('');
      const response = await toggleDriverStatusRequest(!isOnline);
      dispatch(updateClientInfo(response.data.data));
      if (!isOnline) refresh();
    } catch (requestError: any) {
      setStatusError(requestError.response?.data?.message || 'تعذر تحديث حالة الاتصال، حاول مرة أخرى');
    } finally { setUpdatingStatus(false); }
  };

  return <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 18, gap: 14 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.colors.primary} />}>
    <Pressable disabled={updatingStatus} onPress={toggleStatus} style={{ alignItems: 'center', padding: 13, borderRadius: 14, backgroundColor: isOnline ? theme.colors.success : theme.colors.surfaceElevated, borderColor: isOnline ? theme.colors.success : theme.colors.border, borderWidth: theme.borderWidths.subtle, opacity: updatingStatus ? .6 : 1 }}>
      <Text style={{ color: isOnline ? '#fff' : theme.colors.textPrimary, fontWeight: '800' }}>{isOnline ? 'متصل — استقبال الطلبات مفعّل' : 'غير متصل — اضغط لتفعيل استقبال الطلبات'}</Text>
    </Pressable>
    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
      <View><Text style={{ ...theme.typography.display, color: theme.colors.textPrimary }}>طلبات الرحلات</Text><Text style={{ color: theme.colors.textSecondary, marginTop: 4 }}>اضغط على رحلة لعرض التفاصيل وإرسال عرضك</Text></View>
      {activeTrip?.id ? <Pressable onPress={() => navigation.navigate('ActiveTrip')} style={{ padding: 10, borderRadius: 12, backgroundColor: theme.colors.primary }}><Text style={{ color: theme.colors.onPrimary, fontWeight: '800' }}>رحلتي الحالية</Text></Pressable> : null}
    </View>
    {(error || statusError) ? <Text style={{ color: theme.colors.error, textAlign: 'right' }}>{error || statusError}</Text> : null}
    {!loading && !availableTrips.length ? <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginTop: 60 }}>لا توجد طلبات مناسبة الآن.</Text> : null}
    {availableTrips.map((trip: any) => (
      <Pressable key={trip.id} onPress={() => navigation.navigate('TripDetails', { trip })} style={{ padding: 16, gap: 10, borderRadius: 18, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: theme.borderWidths.subtle }}>
        <Text style={{ color: theme.colors.textPrimary, fontWeight: '800', textAlign: 'right' }}>{trip.startName || 'نقطة البداية'} ← {trip.endName || 'الوجهة'}</Text>
        <Text style={{ color: theme.colors.textSecondary, textAlign: 'right' }}>عدد الركاب: {trip.ridersCount || 1}</Text>
        {trip.customerNote ? <Text style={{ color: theme.colors.textSecondary, textAlign: 'right' }}>{trip.customerNote}</Text> : null}
      </Pressable>
    ))}
  </ScrollView>;
}
