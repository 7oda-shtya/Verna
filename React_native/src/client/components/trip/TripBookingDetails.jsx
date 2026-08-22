import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../theme/useTheme';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { TourTarget, useTour } from '../../../tour';
import { VEHICLE_CATEGORIES, estimateTripPrice } from '../../utils/tripPricing';

const Section = ({ title, icon, children, theme, tourId, tourStepId }) => {
	const content = (
		<View className='gap-3 p-4 rounded-3xl' style={theme.components.card}>
			<View className='flex-row-reverse items-center gap-2'>
				<Ionicons name={icon} size={20} color={theme.colors.primary} />
				<Text style={{ ...theme.typography.subtitle, color: theme.colors.textPrimary }}>{title}</Text>
			</View>
			{children}
		</View>
	);

	return tourId && tourStepId ? <TourTarget tourId={tourId} targetId={tourStepId} asChild>{content}</TourTarget> : content;
};

export default function TripBookingDetails({
	route,
	timing,
	onTimingChange,
	scheduledTime,
	onScheduledTimeChange,
	passengerCount,
	onPassengerCountChange,
	vehicleCategory,
	onVehicleCategoryChange,
	paymentMethod,
	onPaymentMethodChange,
	driverNotes,
	onDriverNotesChange,
	submitting,
	error,
	onConfirm,
	onEditRoute,
	tourId,
}) {
	const { theme } = useTheme();
	const { colors, shadows: elevation } = theme;
	const { currentStep, activeTourId } = useTour();
	const wallet = Number(useSelector(state => state.auth?.wallet) || 0);
	const scrollRef = useRef(null);
	const [timePickerVisible, setTimePickerVisible] = useState(false);
	const [timePickerError, setTimePickerError] = useState('');
	const estimatedPrice = estimateTripPrice(route?.distanceKm, vehicleCategory);
	const walletInsufficient = paymentMethod === 'wallet' && wallet < estimatedPrice;
	const now = new Date();
	const maximumTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);
	const selectedTime = scheduledTime instanceof Date && !Number.isNaN(scheduledTime.getTime()) ? scheduledTime : null;
	const formattedTime = selectedTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

	const selectTiming = value => {
		onTimingChange(value);
		setTimePickerError('');
		if (value === 'later') setTimePickerVisible(true);
	};

	const confirmTime = date => {
		setTimePickerVisible(false);
		const selectionNow = new Date();
		selectionNow.setSeconds(0, 0);
		const selectionMaximum = new Date(selectionNow.getTime() + 12 * 60 * 60 * 1000);
		const normalizedDate = new Date(date);
		normalizedDate.setSeconds(0, 0);
		if (normalizedDate < selectionNow) normalizedDate.setDate(normalizedDate.getDate() + 1);
		if (normalizedDate < selectionNow || normalizedDate > selectionMaximum) {
			setTimePickerError('اختار وقتًا من الآن وحتى 12 ساعة قادمة فقط.');
			return;
		}
		setTimePickerError('');
		onScheduledTimeChange(normalizedDate);
	};

	const cancelTimeSelection = () => {
		setTimePickerVisible(false);
		if (!selectedTime) onTimingChange('now');
	};

	useEffect(() => {
		if (!tourId || activeTourId !== tourId) return;
		if (currentStep?.targetId !== 'confirmTrip') return;
		const timer = setTimeout(() => {
			scrollRef.current?.scrollToEnd?.({ animated: true });
		}, 250);
		return () => clearTimeout(timer);
	}, [activeTourId, currentStep?.targetId, tourId]);

	return (
		<View className='flex-1' style={{ backgroundColor: colors.background }}>
			<View className='flex-row-reverse items-center justify-between px-5 py-4' style={{ borderBottomColor: colors.divider, borderBottomWidth: theme.borderWidths.subtle }}>
				<Pressable onPress={onEditRoute} className='flex-row-reverse items-center gap-1 px-3 py-2 rounded-xl' style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}>
					<Ionicons name='arrow-back' size={16} color={colors.textPrimary} />
					<Text style={{ ...theme.typography.caption, fontWeight: '700', color: colors.textPrimary }}>رجوع</Text>
				</Pressable>
				<View className='items-end'>
					<Text style={{ ...theme.typography.title, color: colors.textPrimary }}>تفاصيل حجز الرحلة</Text>
					<Text className='mt-1' style={{ ...theme.typography.caption, color: colors.textSecondary }}>راجع اختياراتك قبل إرسال الطلب</Text>
				</View>
				<Pressable onPress={onEditRoute} className='flex-row-reverse items-center gap-1 px-3 py-2 rounded-xl' style={{ backgroundColor: colors.primaryMuted }}>
					<Ionicons name='map-outline' size={17} color={colors.primary} />
					<Text style={{ ...theme.typography.caption, fontWeight: '700', color: colors.primary }}>تعديل المسار</Text>
				</Pressable>
			</View>

			<ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}>
				<View className='flex-row-reverse rounded-2xl px-4 py-3' style={{ backgroundColor: colors.primaryMuted }}>
					<View className='flex-1 items-center'>
						<Text style={{ ...theme.typography.tiny, color: colors.textSecondary }}>المسافة</Text>
						<Text className='mt-1' style={{ ...theme.typography.subtitle, color: colors.textPrimary }}>{route?.distanceKm ?? '—'} كم</Text>
					</View>
					<View style={{ width: 1, backgroundColor: colors.divider }} />
					<View className='flex-1 items-center'>
						<Text style={{ ...theme.typography.tiny, color: colors.textSecondary }}>وقت الرحلة</Text>
						<Text className='mt-1' style={{ ...theme.typography.subtitle, color: colors.textPrimary }}>{route?.durationMin ?? '—'} دقيقة</Text>
					</View>
				</View>

				<Section title='موعد الرحلة' icon='calendar-outline' theme={theme}>
					<View className='flex-row-reverse gap-2'>
						{[
							{ id: 'now', label: 'الانطلاق الآن', icon: 'flash-outline', targetId: 'timingNow' },
							{ id: 'later', label: 'حجز موعد لاحق', icon: 'time-outline', targetId: 'timingLater' },
						].map(option => {
							const active = timing === option.id;
							return (
									<TourTarget key={option.id} tourId={tourId} targetId={option.targetId} asChild>
										<Pressable onPress={() => selectTiming(option.id)} className='flex-1 flex-row-reverse items-center justify-center gap-2 py-3 rounded-2xl' style={{ backgroundColor: active ? colors.primaryMuted : colors.surfaceElevated, borderColor: active ? colors.primary : colors.border, borderWidth: 1 }}>
											<Ionicons name={option.icon} size={18} color={active ? colors.primary : colors.iconInactive} />
											<Text style={{ ...theme.typography.caption, fontWeight: '700', color: active ? colors.primary : colors.textSecondary }}>{option.label}</Text>
										</Pressable>
									</TourTarget>
							);
						})}
					</View>
					{timing === 'later' ? (
						<Pressable onPress={() => { setTimePickerError(''); setTimePickerVisible(true); }} className='flex-row-reverse items-center justify-between px-4 py-3 rounded-2xl' style={{ backgroundColor: colors.surfaceElevated, borderColor: selectedTime ? colors.primary : colors.border, borderWidth: 1 }}>
							<View className='flex-row-reverse items-center gap-2'>
								<Ionicons name='time-outline' size={20} color={colors.primary} />
								<Text style={{ ...theme.typography.subtitle, color: selectedTime ? colors.textPrimary : colors.textSecondary }}>{formattedTime || 'اختيار الوقت'}</Text>
							</View>
							<Text style={{ ...theme.typography.caption, color: colors.textSecondary }}>خلال 12 ساعة</Text>
						</Pressable>
					) : null}
					{timePickerError ? <Text className='text-right' style={{ ...theme.typography.caption, color: colors.error }}>{timePickerError}</Text> : null}
					<DateTimePickerModal
						isVisible={timePickerVisible}
						mode='time'
						date={selectedTime || now}
						minimumDate={now}
						maximumDate={maximumTime}
						onConfirm={confirmTime}
						onCancel={cancelTimeSelection}
						confirmTextIOS='تأكيد'
						cancelTextIOS='إلغاء'
					/>
				</Section>

				<Section title='عدد الركاب' icon='people-outline' theme={theme}>
					<View className='flex-row items-center justify-center gap-7'>
						<Pressable disabled={passengerCount <= 1} onPress={() => onPassengerCountChange(passengerCount - 1)} className='w-11 h-11 items-center justify-center rounded-full' style={{ backgroundColor: colors.surfaceElevated, opacity: passengerCount <= 1 ? 0.4 : 1 }}>
							<Ionicons name='remove' size={22} color={colors.textPrimary} />
						</Pressable>
						<Text style={{ ...theme.typography.display, minWidth: 34, textAlign: 'center', color: colors.textPrimary }}>{passengerCount}</Text>
						<Pressable disabled={passengerCount >= 4} onPress={() => onPassengerCountChange(passengerCount + 1)} className='w-11 h-11 items-center justify-center rounded-full' style={{ backgroundColor: colors.primary, opacity: passengerCount >= 4 ? 0.4 : 1 }}>
							<Ionicons name='add' size={22} color={colors.onPrimary} />
						</Pressable>
					</View>
				</Section>


				<Section title='طريقة الدفع' icon='wallet-outline' theme={theme}>
					<View className='flex-row-reverse gap-2'>
						{[
							{ id: 'cash', label: 'نقدًا (كاش)', detail: 'الدفع للكابتن', icon: 'cash-outline' },
							{ id: 'wallet', label: 'المحفظة الإلكترونية', detail: `الرصيد: ${wallet} ج.م`, icon: 'wallet-outline' },
						].map(option => {
							const active = paymentMethod === option.id;
							return (
								<Pressable key={option.id} onPress={() => onPaymentMethodChange(option.id)} className='flex-1 items-center gap-1.5 p-3 rounded-2xl' style={{ backgroundColor: active ? colors.primaryMuted : colors.surfaceElevated, borderColor: active ? colors.primary : colors.border, borderWidth: 1 }}>
									<Ionicons name={option.icon} size={21} color={active ? colors.primary : colors.iconInactive} />
									<Text className='text-center' style={{ ...theme.typography.caption, fontWeight: '700', color: active ? colors.primary : colors.textPrimary }}>{option.label}</Text>
									<Text className='text-center' style={{ ...theme.typography.tiny, color: colors.textSecondary }}>{option.detail}</Text>
								</Pressable>
							);
						})}
					</View>
					{walletInsufficient ? <Text className='text-center' style={{ ...theme.typography.caption, color: colors.error }}>رصيد المحفظة لا يكفي للسعر التقديري لهذه الفئة.</Text> : null}
				</Section>

				<Section title='ملاحظات للكابتن (اختياري)' icon='chatbox-ellipses-outline' theme={theme}>
					<TextInput
						value={driverNotes}
						onChangeText={onDriverNotesChange}
						placeholder='مثال: معايا شنط سفر، يرجى الاتصال عند الوصول'
						placeholderTextColor={colors.placeholder}
						multiline
						maxLength={300}
						style={{ ...theme.components.input, ...theme.typography.body, minHeight: 90, paddingVertical: 12, color: colors.textPrimary, textAlign: 'right', textAlignVertical: 'top' }}
					/>
					<Text style={{ ...theme.typography.tiny, color: colors.textMuted, textAlign: 'left' }}>{driverNotes.length}/300</Text>
				</Section>

				{error ? (
					<View className='flex-row-reverse items-center gap-2 p-3 rounded-2xl' style={{ backgroundColor: colors.errorMuted }}>
						<Ionicons name='warning-outline' size={18} color={colors.error} />
						<Text className='flex-1 text-right' style={{ ...theme.typography.caption, color: colors.error }}>{error}</Text>
					</View>
				) : null}

				{tourId ? (
					<TourTarget tourId={tourId} targetId='confirmTrip' asChild>
						<Pressable disabled={submitting || walletInsufficient || (timing === 'later' && !selectedTime)} onPress={() => onConfirm({ estimatedPrice, walletInsufficient })} className='items-center justify-center py-4 rounded-2xl' style={{ backgroundColor: colors.primary, opacity: submitting || walletInsufficient || (timing === 'later' && !selectedTime) ? 0.5 : 1, ...elevation.card }}>
							{submitting ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ ...theme.typography.subtitle, color: colors.onPrimary }}>تأكيد طلب الرحلة</Text>}
						</Pressable>
					</TourTarget>
				) : (
					<Pressable disabled={submitting || walletInsufficient || (timing === 'later' && !selectedTime)} onPress={() => onConfirm({ estimatedPrice, walletInsufficient })} className='items-center justify-center py-4 rounded-2xl' style={{ backgroundColor: colors.primary, opacity: submitting || walletInsufficient || (timing === 'later' && !selectedTime) ? 0.5 : 1, ...elevation.card }}>
						{submitting ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ ...theme.typography.subtitle, color: colors.onPrimary }}>تأكيد طلب الرحلة</Text>}
					</Pressable>
				)}
			</ScrollView>
		</View>
	);
}
