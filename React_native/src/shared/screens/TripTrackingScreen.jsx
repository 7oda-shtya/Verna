import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TripRouteMap from '../../client/components/map/TripRouteMap';
import useTrackParty from '../../client/hooks/useTrackParty';
import useLiveLocation from '../../client/hooks/useLiveLocation';
import { useTheme } from '../../theme/useTheme';
import client from '../../api/client';
import { cancelTrip } from '../../redux/slices/client/tripSlice';
import { updateClientInfo } from '../../redux/slices/client/authSlice';
import { cancelBookedTripRequest, endTripRequest, startTripRequest } from '../../api/driver.api';
import { clearActiveTrip } from '../../redux/slices/driver/tripSlice';

const STATUS_LABELS = {
  PENDING: 'جاري البحث عن سائق',
  BOOKED: 'السائق في الطريق إليك',
  ONGOING: 'السائق في الطريق إليك',
  STARTED: 'الرحلة بدأت',
  COMPLETED: 'وصلت إلى وجهتك',
  CANCELLED: 'تم إلغاء الرحلة',
};

const REPORT_REASONS = ['سلوك غير لائق', 'مشكلة في القيادة', 'مشكلة في السيارة', 'مشكلة أخرى'];

export default function TripTrackingScreen({ route, navigation }) {
  const { trip } = route.params;
  const dispatch = useDispatch();
  const isDriver = useSelector(state => state.auth.role) === 'DRIVER';
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { colors, shadows: elevation } = theme;
  const { partyLocation, error: trackingError } = useTrackParty(trip.id);
  const { location, error: locationError } = useLiveLocation(
    trip.id,
    ['BOOKED', 'STARTED'].includes(String(trip.status).toUpperCase()),
    isDriver,
  );
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [startingTrip, setStartingTrip] = useState(false);
  const [endingTrip, setEndingTrip] = useState(false);
  const [localStatus, setLocalStatus] = useState(null);
  const [cashOverride, setCashOverride] = useState(null);
  const [actionError, setActionError] = useState('');
  const [ratingModalVisible, setRatingModalVisible] = useState(String(trip.status).toUpperCase() === 'COMPLETED');
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDescription, setReportDescription] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const details = useMemo(() => {
    const driver = isDriver ? (trip.client || {}) : (trip.driver || {});
    const car = isDriver ? {} : (driver.car || trip.car || {});
    return {
      name: driver.name || trip.driverName || 'بيانات السائق غير متاحة',
      rating: driver.avgRating ?? (isDriver ? trip.clientRating : trip.driverRating) ?? trip.rate,
      carModel: typeof car === 'string' ? car : car.model,
      plateNumber: typeof car === 'string' ? trip.plateNumber : car.plateNumber,
      phone: driver.phone || (isDriver ? trip.clientPhone : trip.driverPhone),
      eta: trip.eta || trip.timeToReach || trip.offer?.timeToReach,
    };
  }, [isDriver, trip]);

  const status = String(localStatus || trip.status || '').toUpperCase();
  const statusLabel = STATUS_LABELS[status] || 'جاري تحديث حالة الرحلة';
  const visibleError = actionError || trackingError || locationError;
  // The client must rate before leaving a completed trip; the driver's own rating stays optional.
  const ratingMandatory = !isDriver && ratingModalVisible;

  useEffect(() => {
    if (!ratingMandatory) return undefined;
    return navigation.addListener('beforeRemove', event => event.preventDefault());
  }, [navigation, ratingMandatory]);

  const callDriver = async () => {
    if (!details.phone) {
      setActionError('رقم هاتف السائق غير متاح حاليًا');
      return;
    }
    try {
      await Linking.openURL(`tel:${details.phone}`);
    } catch {
      setActionError('تعذر فتح تطبيق الاتصال');
    }
  };

  const openExternalNavigation = async () => {
    const lat = Number(trip.endLat);
    const lng = Number(trip.endLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setActionError('إحداثيات الوجهة غير متاحة حاليًا');
      return;
    }
    try {
      await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);
    } catch {
      setActionError('تعذر فتح تطبيق الملاحة');
    }
  };

  const submitRating = async () => {
    if (!rating) return setActionError('اختار تقييم من نجمة إلى 5 نجوم');
    const ratedId = isDriver ? (trip.clientId || trip.client?.id) : (trip.driverId || trip.driver?.id);
    if (!ratedId) return setActionError('بيانات السائق غير متاحة للتقييم');
    try {
      setSubmittingFeedback(true);
      setActionError('');
      await client.post(`/shared/trips/${trip.id}/rate`, { ratedId, rateStars: rating, comment: ratingComment.trim() || null });
      setRatingModalVisible(false);
    } catch (error) {
      setActionError(error.response?.data?.message || 'تعذر إرسال التقييم حاليًا');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const submitReport = async () => {
    const reportedId = isDriver ? (trip.clientId || trip.client?.id) : (trip.driverId || trip.driver?.id);
    if (!reportedId) return setActionError('بيانات السائق غير متاحة للإبلاغ');
    try {
      setSubmittingFeedback(true);
      setActionError('');
      const reason = reportDescription.trim() ? `${reportReason}: ${reportDescription.trim()}` : reportReason;
      await client.post(`/shared/trips/${trip.id}/report`, { reportedId, reason });
      setReportModalVisible(false);
    } catch (error) {
      setActionError(error.response?.data?.message || 'تعذر إرسال البلاغ حاليًا');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const confirmStartTrip = async () => {
    try {
      setStartingTrip(true);
      setActionError('');
      await startTripRequest(trip.id);
      setLocalStatus('STARTED');
    } catch (error) {
      setActionError(error.response?.data?.message || 'تعذر بدء الرحلة حاليًا');
    } finally {
      setStartingTrip(false);
    }
  };

  const finishEndTrip = () => {
    dispatch(clearActiveTrip());
    setLocalStatus('COMPLETED');
    setCashOverride(null);
    setRatingModalVisible(true);
  };

  const confirmEndTrip = async () => {
    try {
      setEndingTrip(true);
      setActionError('');
      await endTripRequest(trip.id);
      finishEndTrip();
    } catch (error) {
      if (error.response?.data?.field === 'INSUFFICIENT_WALLET_BALANCE') {
        setCashOverride(error.response.data.details || {});
      } else {
        setActionError(error.response?.data?.message || 'تعذر إنهاء الرحلة حاليًا');
      }
    } finally {
      setEndingTrip(false);
    }
  };

  const confirmCashOverride = async () => {
    try {
      setEndingTrip(true);
      setActionError('');
      await endTripRequest(trip.id, 'CASH');
      finishEndTrip();
    } catch (error) {
      setCashOverride(null);
      setActionError(error.response?.data?.message || 'تعذر إنهاء الرحلة حاليًا');
    } finally {
      setEndingTrip(false);
    }
  };

  const confirmCancellation = async () => {
    try {
      setCancelling(true);
      setActionError('');
      if (isDriver) {
        await cancelBookedTripRequest(trip.id);
        dispatch(clearActiveTrip());
        setCancelModalVisible(false);
        navigation.navigate('DriverTabs');
        return;
      }
      const response = await client.patch(`/client/trips/${trip.id}/cancel`);
      if (response.data?.data?.ban) dispatch(updateClientInfo(response.data.data.ban));
      dispatch(cancelTrip());
      setCancelModalVisible(false);
      navigation.navigate('ClientTabs');
    } catch (error) {
      setCancelModalVisible(false);
      setActionError(error.response?.data?.message || 'تعذر إلغاء الرحلة حاليًا');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TripRouteMap
        startPin={{ lat: trip.startLat, lng: trip.startLng }}
        endPin={{ lat: trip.endLat, lng: trip.endLng }}
        routeCoordinates={trip.route?.coordinates || []}
        userLocation={location?.coords && {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        }}
        partyLocation={partyLocation}
      />

      <View
        style={{
          position: 'absolute',
          top: insets.top + 12,
          left: 16,
          right: 16,
          alignItems: 'center',
          gap: 8,
        }}>
        <View style={{ backgroundColor: colors.overlay, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 11, ...elevation.floating }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '800', textAlign: 'center' }}>{statusLabel}</Text>
        </View>
        {visibleError ? (
          <Pressable
            onPress={() => setActionError('')}
            style={{ width: '100%', flexDirection: 'row-reverse', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceElevated, borderColor: colors.error, borderWidth: 1, borderRadius: 14, padding: 11, ...elevation.card }}>
            <Ionicons name='warning-outline' size={19} color={colors.error} />
            <Text style={{ flex: 1, color: colors.error, textAlign: 'right', fontSize: 13 }}>{visibleError}</Text>
            <Ionicons name='close' size={17} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <View
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: Math.max(insets.bottom, 10),
          padding: 18,
          gap: 14,
          backgroundColor: colors.overlay,
          borderColor: colors.border,
          borderWidth: theme.borderWidths.subtle,
          borderRadius: 24,
          ...elevation.floating,
        }}>
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800' }}>{details.name}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 3 }}>
              {details.rating != null ? `★ ${Number(details.rating).toFixed(1)}` : 'التقييم غير متاح'}
            </Text>
          </View>
          {details.eta ? (
            <View style={{ backgroundColor: colors.primaryMuted, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: colors.primary, fontWeight: '800' }}>الوصول خلال {details.eta}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 11 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'right' }}>نوع العربية</Text>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', textAlign: 'right', marginTop: 3 }}>{details.carModel || 'غير متاح'}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 11 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'right' }}>رقم اللوحة</Text>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', textAlign: 'right', marginTop: 3 }}>{details.plateNumber || 'غير متاح'}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
          {isDriver ? (
            <Pressable onPress={openExternalNavigation} style={{ flex: 1, minHeight: 48, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 15, backgroundColor: colors.primary }}>
              <Ionicons name='navigate' size={18} color={colors.onPrimary} />
              <Text style={{ color: colors.onPrimary, fontWeight: '800' }}>الملاحة</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={callDriver} style={{ flex: 1, minHeight: 48, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 15, backgroundColor: colors.primary }}>
            <Ionicons name='call' size={18} color={colors.onPrimary} />
            <Text style={{ color: colors.onPrimary, fontWeight: '800' }}>اتصال بالسائق</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('TripChat', { tripId: trip.id })} style={{ flex: 1, minHeight: 48, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 15, backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1 }}>
            <Ionicons name='chatbubble-ellipses-outline' size={18} color={colors.primary} />
            <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>شات</Text>
          </Pressable>
        </View>

        {!isDriver && !['STARTED', 'COMPLETED', 'CANCELLED'].includes(status) ? (
          <Pressable onPress={() => setCancelModalVisible(true)} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.error, fontWeight: '700' }}>إلغاء الرحلة</Text>
          </Pressable>
        ) : null}
        {isDriver && status === 'BOOKED' ? (
          <Pressable disabled={startingTrip} onPress={confirmStartTrip} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.primary, opacity: startingTrip ? 0.65 : 1 }}>
            {startingTrip ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ color: colors.onPrimary, fontWeight: '800' }}>بدء الرحلة</Text>}
          </Pressable>
        ) : null}
        {isDriver && ['BOOKED', 'STARTED'].includes(status) ? (
          <Pressable disabled={endingTrip} onPress={confirmEndTrip} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.success, opacity: endingTrip ? 0.65 : 1 }}>
            {endingTrip ? <ActivityIndicator color='#FFFFFF' /> : <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>إنهاء الرحلة</Text>}
          </Pressable>
        ) : null}
        {isDriver && status === 'BOOKED' ? (
          <Pressable onPress={() => setCancelModalVisible(true)} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.error, fontWeight: '700' }}>إلغاء الرحلة</Text>
          </Pressable>
        ) : null}
        {isDriver && cashOverride ? (
          <View style={{ gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.errorMuted, borderColor: colors.error, borderWidth: 1 }}>
            <Text style={{ color: colors.error, textAlign: 'right', fontSize: 13, lineHeight: 19 }}>
              رصيد العميل في المحفظة غير كافٍ ({cashOverride.walletBalance ?? 0} من {cashOverride.price ?? trip.price}). يمكنك تحصيل المبلغ نقدًا بدلاً من ذلك.
            </Text>
            <Pressable disabled={endingTrip} onPress={confirmCashOverride} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.error, opacity: endingTrip ? 0.65 : 1 }}>
              {endingTrip ? <ActivityIndicator color='#FFFFFF' /> : <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>تحصيل نقدي وإنهاء الرحلة</Text>}
            </Pressable>
            <Pressable disabled={endingTrip} onPress={() => setCashOverride(null)}><Text style={{ color: colors.textMuted, textAlign: 'center' }}>رجوع</Text></Pressable>
          </View>
        ) : null}
        {status === 'COMPLETED' ? (
          <Pressable onPress={() => setReportModalVisible(true)} style={{ minHeight: 40, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Ionicons name='flag-outline' size={16} color={colors.error} />
            <Text style={{ color: colors.error, fontWeight: '700' }}>الإبلاغ عن مشكلة</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal transparent visible={cancelModalVisible} animationType='fade' onRequestClose={() => setCancelModalVisible(false)}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.backdrop }}>
          <View style={{ width: '100%', maxWidth: 420, padding: 20, gap: 16, ...theme.components.modal }}>
            <Text style={{ color: colors.textPrimary, textAlign: 'center', fontSize: 19, fontWeight: '800' }}>إلغاء الرحلة؟</Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 21 }}>هل أنت متأكد إنك عايز تلغي الرحلة الحالية؟</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
              <Pressable disabled={cancelling} onPress={confirmCancellation} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.error, opacity: cancelling ? 0.65 : 1 }}>
                {cancelling ? <ActivityIndicator color='#FFFFFF' /> : <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>تأكيد الإلغاء</Text>}
              </Pressable>
              <Pressable disabled={cancelling} onPress={() => setCancelModalVisible(false)} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.surfaceElevated }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>رجوع</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={ratingModalVisible} animationType='fade' onRequestClose={() => { if (!ratingMandatory) setRatingModalVisible(false); }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.backdrop }}>
          <View style={{ width: '100%', maxWidth: 420, padding: 20, gap: 16, ...theme.components.modal }}>
            <Text style={{ color: colors.textPrimary, textAlign: 'center', fontSize: 20, fontWeight: '800' }}>قيّم رحلتك</Text>
            {ratingMandatory ? <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 12 }}>لازم تقيّم الرحلة قبل ما تكمل</Text> : null}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 9 }}>
              {[1, 2, 3, 4, 5].map(star => <Pressable key={star} onPress={() => setRating(star)} hitSlop={5}><Ionicons name={star <= rating ? 'star' : 'star-outline'} size={35} color={colors.rating} /></Pressable>)}
            </View>
            <TextInput value={ratingComment} onChangeText={setRatingComment} placeholder='تعليق اختياري' placeholderTextColor={colors.placeholder} multiline maxLength={300} style={{ ...theme.components.input, minHeight: 90, color: colors.textPrimary, textAlign: 'right', textAlignVertical: 'top' }} />
            <Pressable disabled={submittingFeedback || !rating} onPress={submitRating} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary, opacity: submittingFeedback || !rating ? 0.55 : 1 }}>
              {submittingFeedback ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ color: colors.onPrimary, fontWeight: '800' }}>إرسال التقييم</Text>}
            </Pressable>
            {!ratingMandatory ? (
              <Pressable disabled={submittingFeedback} onPress={() => setRatingModalVisible(false)}><Text style={{ color: colors.textMuted, textAlign: 'center' }}>لاحقًا</Text></Pressable>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal transparent visible={reportModalVisible} animationType='slide' onRequestClose={() => setReportModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: colors.backdrop }}>
          <View style={{ padding: 20, paddingBottom: Math.max(insets.bottom, 20), gap: 14, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.surface }}>
            <Text style={{ color: colors.textPrimary, textAlign: 'right', fontSize: 19, fontWeight: '800' }}>الإبلاغ عن مشكلة</Text>
            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
              {REPORT_REASONS.map(reason => <Pressable key={reason} onPress={() => setReportReason(reason)} style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, backgroundColor: reportReason === reason ? colors.errorMuted : colors.surfaceElevated, borderColor: reportReason === reason ? colors.error : colors.border, borderWidth: 1 }}><Text style={{ color: reportReason === reason ? colors.error : colors.textSecondary, fontWeight: '700' }}>{reason}</Text></Pressable>)}
            </View>
            <TextInput value={reportDescription} onChangeText={setReportDescription} placeholder='وصف اختياري للمشكلة' placeholderTextColor={colors.placeholder} multiline maxLength={500} style={{ ...theme.components.input, minHeight: 100, color: colors.textPrimary, textAlign: 'right', textAlignVertical: 'top' }} />
            <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
              <Pressable disabled={submittingFeedback} onPress={submitReport} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.error, opacity: submittingFeedback ? 0.6 : 1 }}>{submittingFeedback ? <ActivityIndicator color='#FFFFFF' /> : <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>إرسال البلاغ</Text>}</Pressable>
              <Pressable disabled={submittingFeedback} onPress={() => setReportModalVisible(false)} style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.surfaceElevated }}><Text style={{ color: colors.textPrimary, fontWeight: '700' }}>إلغاء</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
