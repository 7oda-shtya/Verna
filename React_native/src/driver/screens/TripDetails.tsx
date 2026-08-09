import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TripRouteMap from '../../client/components/map/TripRouteMap';
import { useTheme } from '../../theme/useTheme';
import { makeOffer } from '../../redux/slices/driver/tripSlice';

export default function TripDetails() {
  const dispatch = useDispatch<any>();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const trip = route.params?.trip;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { colors } = theme;

  const [price, setPrice] = useState('');
  const [timeToReach, setTimeToReach] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = Number(price) > 0 && timeToReach.trim().length > 0;

  const submitOffer = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      setError('');
      await dispatch(makeOffer({ tripId: trip.id, price: Number(price), timeToReach: timeToReach.trim() })).unwrap();
      navigation.goBack();
    } catch (requestError: any) {
      setError(requestError?.message || 'تعذر إرسال العرض حاليًا');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TripRouteMap
        startPin={{ lat: trip.startLat, lng: trip.startLng }}
        endPin={{ lat: trip.endLat, lng: trip.endLng }}
        waypoints={Array.isArray(trip.waypoints) ? trip.waypoints : []}
        routeCoordinates={trip.route?.coordinates || []}
      />

      <Pressable
        onPress={() => navigation.goBack()}
        style={{ position: 'absolute', top: insets.top + 12, right: 16, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.overlay, ...theme.shadows.floating }}>
        <Ionicons name='close' size={20} color={colors.textPrimary} />
      </Pressable>

      <View
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: Math.max(insets.bottom, 10),
          padding: 18,
          gap: 12,
          backgroundColor: colors.overlay,
          borderColor: colors.border,
          borderWidth: theme.borderWidths.subtle,
          borderRadius: 24,
          ...theme.shadows.floating,
        }}>
        <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16, textAlign: 'right' }}>
          {trip.startName || 'نقطة البداية'} ← {trip.endName || 'الوجهة'}
        </Text>
        <Text style={{ color: colors.textSecondary, textAlign: 'right' }}>عدد الركاب: {trip.ridersCount || 1}</Text>
        {trip.customerNote ? <Text style={{ color: colors.textSecondary, textAlign: 'right' }}>{trip.customerNote}</Text> : null}
        {trip.route?.distanceKm ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'right' }}>
            المسافة: {Number(trip.route.distanceKm).toFixed(1)} كم
            {trip.route?.durationMin ? ` — ${Math.round(trip.route.durationMin)} دقيقة` : ''}
          </Text>
        ) : null}

        {error ? <Text style={{ color: colors.error, textAlign: 'right' }}>{error}</Text> : null}

        <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType='numeric'
            placeholder='السعر'
            placeholderTextColor={colors.placeholder}
            style={{ flex: 1, color: colors.textPrimary, backgroundColor: colors.surfaceElevated, borderRadius: 12, padding: 11, textAlign: 'right' }}
          />
          <TextInput
            value={timeToReach}
            onChangeText={setTimeToReach}
            placeholder='وقت الوصول'
            placeholderTextColor={colors.placeholder}
            style={{ flex: 1, color: colors.textPrimary, backgroundColor: colors.surfaceElevated, borderRadius: 12, padding: 11, textAlign: 'right' }}
          />
        </View>

        <Pressable
          disabled={submitting || !canSubmit}
          onPress={submitOffer}
          style={{ alignItems: 'center', padding: 13, borderRadius: 12, backgroundColor: colors.primary, opacity: submitting || !canSubmit ? 0.55 : 1 }}>
          {submitting ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ color: colors.onPrimary, fontWeight: '800' }}>إرسال العرض</Text>}
        </Pressable>
      </View>
    </View>
  );
}
