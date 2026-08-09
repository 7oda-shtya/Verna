import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import Header from '../components/Header'
import client from '../../api/client'
import { useTheme } from '../../theme/useTheme'
import { cancelTrip, hydrateCurrentTrip } from '../../redux/slices/client/tripSlice'
import { updateClientInfo } from '../../redux/slices/client/authSlice'
import { getStoredReputation } from '../../utils/reputation'
import { ReputationDetailsModal, TemporaryBanBanner } from '../components/ReputationStatus'
import { getMeRequest } from '../../api/auth.api'
import { TourTarget, TOUR_IDS } from '../../tour'

const ACTIVE_STATUSES = ['PENDING', 'BOOKED', 'STARTED', 'ONGOING']
const TRIP_DRAFT_STORAGE_KEY = 'tripDraft'

const statusLabels = {
	PENDING: 'بانتظار عروض السائقين',
	BOOKED: 'تم حجز الرحلة',
	STARTED: 'الرحلة بدأت',
	ONGOING: 'الرحلة جارية',
}

const ClientHome = () => {
	const navigation = useNavigation()
	const route = useRoute()
	const dispatch = useDispatch()
	const { theme } = useTheme()
	const { colors, shadows: elevation } = theme
	const currentTrip = useSelector(state => state.trip?.currentTrip)
	const user = useSelector(state => state.auth)
	const reputation = getStoredReputation(user)
	const tripStatus = String(currentTrip?.status || '').toUpperCase()
	const hasActiveTrip = Boolean(currentTrip?.id && ACTIVE_STATUSES.includes(tripStatus))
	const canManageTrip = tripStatus === 'PENDING'
	const [leaderboard, setLeaderboard] = useState([])
	const [loadingLeaderboard, setLoadingLeaderboard] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [leaderboardError, setLeaderboardError] = useState('')
	const [toast, setToast] = useState('')
	const [cancelModalVisible, setCancelModalVisible] = useState(false)
	const [cancelling, setCancelling] = useState(false)
	const [tripActionError, setTripActionError] = useState('')
	const [reputationDetailsVisible, setReputationDetailsVisible] = useState(false)
	const checkedCurrentTrip = useRef(false)

	const loadLeaderboard = useCallback(async ({ refresh = false } = {}) => {
		try {
			if (refresh) setRefreshing(true)
			else setLoadingLeaderboard(true)
			setLeaderboardError('')
			const response = await client.get('/leaderboard')
			setLeaderboard(response.data?.data?.currentWeek?.top10 ?? [])
		} catch {
			setLeaderboardError('تعذر تحميل الليدر بورد حالياً')
		} finally {
			setLoadingLeaderboard(false)
			setRefreshing(false)
		}
	}, [])

	useEffect(() => {
		const timer = setTimeout(loadLeaderboard, 0)
		return () => clearTimeout(timer)
	}, [loadLeaderboard])

	useEffect(() => {
		getMeRequest()
			.then(response => dispatch(updateClientInfo(response.data?.data?.user || {})))
			.catch(() => {})
	}, [dispatch])

	useEffect(() => {
		if (hasActiveTrip || checkedCurrentTrip.current) return
		checkedCurrentTrip.current = true
		client.get('/client/trips').then(response => {
			const latestTrip = (response.data?.data || [])[0]
			if (latestTrip && ['PENDING', 'BOOKED', 'STARTED'].includes(latestTrip.status)) dispatch(hydrateCurrentTrip(latestTrip))
		}).catch(() => {})
	}, [dispatch, hasActiveTrip])

	useEffect(() => {
		if (!route.params?.tripSuccess) return
		const successMessage = route.params.tripSuccess
		const timer = setTimeout(() => {
			setToast(successMessage)
			navigation.setParams({ tripSuccess: undefined })
		}, 0)
		return () => clearTimeout(timer)
	}, [navigation, route.params?.tripSuccess])

	useEffect(() => {
		if (!toast) return
		const timer = setTimeout(() => setToast(''), 3200)
		return () => clearTimeout(timer)
	}, [toast])

	const handleEditTrip = async () => {
		if (!canManageTrip) return
		await AsyncStorage.setItem(TRIP_DRAFT_STORAGE_KEY, JSON.stringify({
			startPin: currentTrip.startPin,
			endPin: currentTrip.endPin,
			waypoints: currentTrip.waypoints || [],
			route: currentTrip.route,
		}))
		navigation.navigate('RequestTrip', { editTripId: currentTrip.id })
	}

	const handleCancelTrip = async () => {
		try {
			setCancelling(true)
			setTripActionError('')
			const response = await client.patch(`/client/trips/${currentTrip.id}/cancel`)
			if (response.data?.data?.ban) dispatch(updateClientInfo(response.data.data.ban))
			dispatch(cancelTrip())
			setCancelModalVisible(false)
			setToast('تم حذف طلب الرحلة')
		} catch (error) {
			setTripActionError(error.response?.data?.message || 'تعذر حذف طلب الرحلة. حاول مرة أخرى.')
		} finally {
			setCancelling(false)
		}
	}

	return (
		<View className='flex-1 z-0' style={{ backgroundColor: colors.background }}>
			<Header />
			{toast ? (
				<View className='absolute top-24 self-center z-50 flex-row-reverse items-center gap-2 rounded-full px-5 py-3' style={{ backgroundColor: colors.surfaceElevated, ...elevation.floating }}>
					<Ionicons name='checkmark-circle' size={20} color={colors.primary} />
					<Text style={{ ...theme.typography.body, fontWeight: '700', color: colors.textPrimary }}>{toast}</Text>
				</View>
			) : null}
			<ScrollView
				className='flex-1'
				showsVerticalScrollIndicator={false}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadLeaderboard({ refresh: true })} tintColor={colors.primary} colors={[colors.primary]} />}
				contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 130, gap: 16 }}>
				<TemporaryBanBanner user={user} onShowDetails={() => setReputationDetailsVisible(true)} />
				{!hasActiveTrip ? (user.isBanned ? (
					<View className='w-full rounded-3xl p-5 items-center gap-2' style={{ backgroundColor: colors.surface, ...elevation.card }}>
						<Ionicons name='lock-closed-outline' size={28} color={colors.error} />
						<Text className='text-base font-bold text-center' style={{ color: colors.textPrimary }}>طلب رحلة جديدة غير متاح أثناء الإيقاف المؤقت</Text>
						<Text className='text-xs text-center' style={{ color: colors.textSecondary }}>راجع تفاصيل السمعة لمعرفة السبب وموعد انتهاء الإيقاف.</Text>
					</View>
				) : <Pressable
					onPress={() => navigation.navigate('RequestTrip', { editTripId: null })}
					accessibilityRole='button'
					accessibilityLabel='اطلب رحلة جديدة'
					className='w-full overflow-hidden rounded-3xl p-5'
					style={{ backgroundColor: colors.primary, ...elevation.floating }}>
					<View className='flex-row-reverse items-center justify-between gap-4'>
						<View className='flex-1 items-end'>
							<Text className='text-2xl font-extrabold text-right' style={{ color: colors.onPrimary }}>فين وجهتك؟</Text>
							<Text className='mt-1 text-sm text-right' style={{ color: colors.onPrimary, opacity: 0.74 }}>حدد نقطة الوصول واطلب سائق في ثوانٍ</Text>
						</View>
						<View className='h-14 w-14 items-center justify-center rounded-2xl' style={{ backgroundColor: colors.overlay }}>
							<Ionicons name='navigate' size={27} color={colors.primary} />
						</View>
					</View>
					<View
						className='mt-5 flex-row-reverse items-center justify-center gap-2 rounded-2xl py-3.5'
						style={{ backgroundColor: colors.overlay }}>
						<Text style={{ ...theme.typography.subtitle, fontWeight: '800', color: colors.textPrimary }}>ابدأ رحلتك دلوقتي</Text>
						<Ionicons name='arrow-back-circle' size={21} color={colors.primary} />
					</View>
				</Pressable>) : null}

				{hasActiveTrip ? (
					<View className='rounded-3xl p-5 gap-4' style={{ backgroundColor: colors.surface, ...elevation.card }}>
						<View className='flex-row-reverse items-center justify-between'>
							<View className='flex-row-reverse items-center gap-2'>
								<View className='h-3 w-3 rounded-full' style={{ backgroundColor: colors.primary }} />
								<Text style={{ ...theme.typography.title, color: colors.textPrimary }}>رحلتك الحالية</Text>
							</View>
							<Text className='rounded-full px-3 py-1.5' style={{ ...theme.typography.caption, color: colors.primary, backgroundColor: colors.primaryMuted }}>{statusLabels[tripStatus] || 'رحلة نشطة'}</Text>
						</View>

						<View className='gap-3'>
							{[
								{ icon: 'radio-button-on', color: colors.primary, label: 'من', value: currentTrip.startPin?.name || 'نقطة البداية' },
								{ icon: 'location', color: colors.error, label: 'إلى', value: currentTrip.endPin?.name || 'الوجهة' },
							].map(item => (
								<View key={item.label} className='flex-row-reverse items-center gap-3'>
									<Ionicons name={item.icon} size={18} color={item.color} />
									<View className='flex-1 items-end'>
										<Text style={{ ...theme.typography.tiny, color: colors.textSecondary }}>{item.label}</Text>
										<Text numberOfLines={1} style={{ ...theme.typography.body, fontWeight: '700', color: colors.textPrimary }}>{item.value}</Text>
									</View>
								</View>
							))}
						</View>

						<View className='flex-row-reverse rounded-2xl p-3' style={{ backgroundColor: colors.surfaceElevated }}>
							{[
								['المسافة', currentTrip.route?.distanceKm != null ? `${currentTrip.route.distanceKm} كم` : '—'],
								['الوقت', currentTrip.route?.durationMin != null ? `${currentTrip.route.durationMin} دقيقة` : '—'],
								['الركاب', `${currentTrip.passengerCount || currentTrip.ridersCount || 1}`],
								...(['BOOKED', 'STARTED', 'ONGOING'].includes(tripStatus) && Number(currentTrip.price) > 0 ? [['السعر', `${currentTrip.price} ج.م`]] : []),
							].map(([label, value]) => (
								<View key={label} className='flex-1 items-center gap-1'>
									<Text style={{ ...theme.typography.tiny, color: colors.textSecondary }}>{label}</Text>
									<Text style={{ ...theme.typography.caption, fontWeight: '700', color: colors.textPrimary }}>{value}</Text>
								</View>
							))}
						</View>

						{canManageTrip ? (
							<>
								<Pressable onPress={() => navigation.navigate('Offers', { tripId: currentTrip.id })} className='flex-row-reverse items-center justify-center gap-2 rounded-2xl py-3' style={{ backgroundColor: colors.primary }}>
									<Ionicons name='pricetags-outline' size={19} color={colors.onPrimary} />
									<Text style={{ ...theme.typography.subtitle, color: colors.onPrimary }}>عرض عروض السائقين</Text>
								</Pressable>
								<View className='flex-row-reverse gap-3'>
									<Pressable onPress={handleEditTrip} className='flex-1 flex-row-reverse items-center justify-center gap-2 rounded-2xl py-3' style={{ backgroundColor: colors.surfaceElevated }}>
										<Ionicons name='create-outline' size={19} color={colors.textPrimary} />
										<Text style={{ ...theme.typography.subtitle, color: colors.textPrimary }}>تعديل</Text>
									</Pressable>
									<Pressable onPress={() => setCancelModalVisible(true)} className='flex-1 flex-row-reverse items-center justify-center gap-2 rounded-2xl py-3' style={{ backgroundColor: colors.errorMuted }}>
										<Ionicons name='trash-outline' size={19} color={colors.error} />
										<Text style={{ ...theme.typography.subtitle, color: colors.error }}>حذف</Text>
									</Pressable>
								</View>
							</>
						) : null}
					</View>
				) : (
					<View className='items-center rounded-3xl px-5 py-6' style={{ backgroundColor: colors.surface, ...elevation.card }}>
						<View className='mb-3 h-14 w-14 items-center justify-center rounded-full' style={{ backgroundColor: colors.primaryMuted }}>
							<Ionicons name='car-sport-outline' size={27} color={colors.primary} />
						</View>
						<Text className='text-base font-bold' style={{ color: colors.textPrimary }}>مفيش رحلة نشطة دلوقتي</Text>
						<Text className='mt-1 text-center text-sm' style={{ color: colors.textSecondary }}>لما تطلب رحلة، تفاصيلها هتظهر هنا.</Text>
					</View>
				)}

					<TourTarget tourId={TOUR_IDS.APP_GLOBAL} targetId='leaderboard' asChild>
						<View className='rounded-3xl p-4 w-full' style={{ backgroundColor: colors.surface, ...elevation.card }}>
					<View className='mb-3 flex-row-reverse items-center justify-between'>
						<Text className='font-bold text-lg' style={{ color: colors.textPrimary }}>الأكثر نشاطًا هذا الأسبوع</Text>
						<Ionicons name='trophy-outline' size={20} color={colors.warning} />
					</View>
					{loadingLeaderboard ? <View className='items-center justify-center py-6'><ActivityIndicator color={colors.primary} /></View> : leaderboardError ? (
						<View className='flex-row-reverse items-center justify-between gap-3 py-2'>
							<Text className='text-sm flex-1 text-right' style={{ color: colors.textSecondary }}>{leaderboardError}</Text>
							<Pressable onPress={() => loadLeaderboard()} className='flex-row-reverse items-center gap-1 rounded-xl px-3 py-2' style={{ backgroundColor: colors.primaryMuted }}><Ionicons name='refresh' size={16} color={colors.primary} /><Text className='text-xs font-bold' style={{ color: colors.primary }}>إعادة المحاولة</Text></Pressable>
						</View>
					) : leaderboard.length ? <View className='gap-3'>{leaderboard.slice(0, 5).map(item => (
						<View key={`${item.id}-${item.rank}`} className='flex-row items-center justify-between rounded-2xl px-4 py-3' style={{ backgroundColor: colors.surfaceElevated }}><View className='flex-row items-center gap-3'><View className='h-9 w-9 items-center justify-center rounded-full' style={{ backgroundColor: colors.primaryMuted }}><Text className='font-bold' style={{ color: colors.primary }}>{item.rank}</Text></View><Text className='font-semibold' style={{ color: colors.textPrimary }}>{item?.user?.name ?? 'مستخدم'}</Text></View><Text className='font-bold' style={{ color: colors.textSecondary }}>{item.tripCount} رحلة</Text></View>
					))}</View> : <Text className='text-sm' style={{ color: colors.textSecondary }}>لا توجد بيانات لليدر بورد حالياً.</Text>}
						</View>
					</TourTarget>
			</ScrollView>
			<ReputationDetailsModal visible={reputationDetailsVisible} onClose={() => setReputationDetailsVisible(false)} reputation={reputation} banReason={user.banReason} />

			<Modal transparent visible={cancelModalVisible} animationType='fade' onRequestClose={() => setCancelModalVisible(false)}>
				<Pressable className='flex-1 items-center justify-center px-5' style={{ backgroundColor: colors.backdrop }} onPress={() => !cancelling && setCancelModalVisible(false)}>
					<Pressable className='w-full max-w-md p-5 gap-4' style={theme.components.modal} onPress={event => event.stopPropagation()}>
						<View className='h-14 w-14 self-center items-center justify-center rounded-full' style={{ backgroundColor: colors.errorMuted }}><Ionicons name='trash-outline' size={25} color={colors.error} /></View>
						<View className='gap-2'><Text className='text-center' style={{ ...theme.typography.title, color: colors.textPrimary }}>حذف طلب الرحلة؟</Text><Text className='text-center' style={{ ...theme.typography.body, color: colors.textSecondary }}>سيتم إلغاء الطلب ولن يتمكن السائقون من تقديم عروض عليه.</Text></View>
						{tripActionError ? <Text className='text-center' style={{ ...theme.typography.caption, color: colors.error }}>{tripActionError}</Text> : null}
						<View className='flex-row-reverse gap-3'>
							<Pressable disabled={cancelling} onPress={handleCancelTrip} className='flex-1 items-center justify-center rounded-2xl py-3.5' style={{ backgroundColor: colors.error }}>{cancelling ? <ActivityIndicator color='#fff' /> : <Text style={{ ...theme.typography.subtitle, color: '#fff' }}>تأكيد الحذف</Text>}</Pressable>
							<Pressable disabled={cancelling} onPress={() => setCancelModalVisible(false)} className='flex-1 items-center justify-center rounded-2xl py-3.5' style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}><Text style={{ ...theme.typography.subtitle, color: colors.textPrimary }}>رجوع</Text></Pressable>
						</View>
					</Pressable>
				</Pressable>
			</Modal>
		</View>
	)
}

export default ClientHome
