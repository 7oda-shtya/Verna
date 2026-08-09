import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import TripTrackingScreen from '../../shared/screens/TripTrackingScreen';
import { useTheme } from '../../theme/useTheme';
import { fetchActiveTrip } from '../../redux/slices/driver/tripSlice';

export default function ActiveTrip() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<any>();
  const trip = useSelector((state: any) => state.trip.activeTrip);
  const activeTripLoaded = useSelector((state: any) => state.trip.activeTripLoaded);
  const activeTripLoading = useSelector((state: any) => state.trip.activeTripLoading);
  const { theme } = useTheme();

  useEffect(() => { (dispatch as any)(fetchActiveTrip()); }, [dispatch]);

  if (activeTripLoading || !activeTripLoaded) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}><ActivityIndicator color={theme.colors.primary} /></View>;
  }
  if (!trip) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 28, backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>لا توجد رحلة نشطة</Text>
      <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>عند قبول عرضك ستظهر تفاصيل الرحلة هنا.</Text>
      <Pressable onPress={() => navigation.goBack()} style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.colors.primary }}><Text style={{ color: theme.colors.onPrimary, fontWeight: '800' }}>العودة للرئيسية</Text></Pressable>
    </View>;
  }
  return <TripTrackingScreen route={{ params: { trip } }} navigation={navigation} />;
}
