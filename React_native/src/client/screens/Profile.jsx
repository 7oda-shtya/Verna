import { useCallback, useRef, useState } from 'react'
import { Image, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import ProfileSections from '../components/ProfileSections'
import Header from '../components/Header'
import { useTheme } from '../../theme/useTheme'
import apiClient from '../../api/client'
import { setTripHistory } from '../../redux/slices/client/librarySlice'
import { getStoredReputation } from '../../utils/reputation'
import { ReputationDetailsModal, TemporaryBanBanner } from '../components/ReputationStatus'
import { getMeRequest } from '../../api/auth.api'
import { updateClientInfo } from '../../redux/slices/client/authSlice'
import { TOUR_IDS, TourTarget, useTour } from '../../tour'

const ClientProfile = ({ navigation }) => {
	const [selectedSection, setSelectedSection] = useState('reports')
	const [reputationDetailsVisible, setReputationDetailsVisible] = useState(false)
	const scrollRef = useRef(null)
	const tourAttemptedRef = useRef(false)
	const dispatch = useDispatch()
	const { theme } = useTheme()
	const { colors, shadows: elevation } = theme
	const { startTour, isTourSeen, ready: tourReady, activeTourId } = useTour()

	const user = useSelector((state) => state.auth)
	const tripHistory = useSelector((state) => state.library?.tripHistory || [])
	const completedTripCount = tripHistory.filter(trip => String(trip.status).toUpperCase() === 'COMPLETED').length
	const reputation = getStoredReputation(user)
	const reputationColor = colors[reputation.colorKey] ?? colors.textMuted
	const reputationIcon = reputation.colorKey === 'success' ? 'checkmark-circle' : 'alert-circle-outline'
	const appVersion = Constants.expoConfig?.version || '1.0.0'

	const client = {
		avatar: user?.avatar,
		name: user?.name,
		username: user?.username,
		homeAddress: user?.homeAddress,
		officeAddress: user?.officeAddress,
		phone: user?.phone,
		email: user?.email,
		avgRating: user?.avgRating,
	}
	const phone = client.phone
		? String(client.phone).startsWith('+') ? String(client.phone) : `+${client.phone}`
		: ''

	useFocusEffect(
		useCallback(() => {
			let active = true
			apiClient.get('/client/trips')
				.then(response => {
					if (!active) return
					const allTrips = response.data?.data ?? []
					dispatch(setTripHistory(allTrips.filter(trip => ['COMPLETED', 'CANCELLED'].includes(trip.status))))
				})
				.catch(() => {})
			return () => { active = false }
		}, [dispatch])
	)

	useFocusEffect(
		useCallback(() => {
			let active = true
			getMeRequest()
				.then(response => {
					if (active) dispatch(updateClientInfo(response.data?.data?.user || {}))
				})
				.catch(() => {})
			return () => { active = false }
		}, [dispatch])
	)

	useFocusEffect(
		useCallback(() => {
			if (!tourReady || activeTourId || isTourSeen(TOUR_IDS.PROFILE) || tourAttemptedRef.current) return undefined
			// Set synchronously (before the AsyncStorage-backed markTourSeen write in startTour
			// resolves) so a second focus event within this component's lifetime can't slip past
			// isTourSeen while seenTours state hasn't caught up yet, and start the tour twice.
			tourAttemptedRef.current = true
			const timer = setTimeout(() => {
				startTour(TOUR_IDS.PROFILE)
			}, 850)
			return () => clearTimeout(timer)
		}, [activeTourId, isTourSeen, startTour, tourReady])
	)

	const tabs = [
		{ id: 'reports', label: 'البلاغات', icon: 'flag-outline' },
		{ id: 'rates', label: 'التقييمات', icon: 'star-outline' },
		{ id: 'coupons', label: 'الكوبونات', icon: 'ticket-outline' },
		{ id: 'referral', label: 'كود الدعوة', icon: 'people-outline' },
	]

	return (
		<View className='flex-1 z-0' style={{ backgroundColor: colors.background }}>
			<SafeAreaView className='flex-1 z-10' dir='rtl'>
				<Header />
				<ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
					<TemporaryBanBanner user={user} onShowDetails={() => setReputationDetailsVisible(true)} />
					<TourTarget tourId={TOUR_IDS.PROFILE} targetId='profileCard' asChild>
						<View className='relative w-full rounded-3xl p-5 flex-col items-center gap-3 mt-2' style={{ backgroundColor: colors.surface, ...elevation.card }}>
							<TourTarget tourId={TOUR_IDS.PROFILE} targetId='profileEdit' asChild>
								<Pressable
							onPress={() => navigation.navigate('EditProfile')}
							hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
							className='absolute top-5 left-5 z-10 rounded-full w-11 h-11 items-center justify-center'
							style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}
							>
								<Ionicons name='pencil' size={18} color={colors.warning} />
								</Pressable>
							</TourTarget>
						<View className='relative'>
							<Image
								className='w-24 h-24 rounded-full'
								style={theme.components.avatar}
								source={client.avatar ? { uri: client.avatar } : require('../../../assets/images/user-icon.png')}
							/>
						</View>
						<Text className='text-center' style={{ ...theme.typography.display, color: colors.textPrimary }}>{client.username || client.name}</Text>
						{client.username && client.name ? (
							<Text className='text-center' style={{ ...theme.typography.caption, color: colors.textSecondary, fontWeight: '400' }}>{client.name}</Text>
						) : null}
						{client.homeAddress ? (
							<Text className='text-center' style={{ ...theme.typography.caption, color: colors.textSecondary }}>{client.homeAddress}</Text>
						) : null}

						{phone || client.email ? (
							<View className='flex-row flex-wrap justify-center items-center gap-4 pt-3 w-full mt-1' style={{ borderTopColor: colors.divider, borderTopWidth: theme.borderWidths.subtle }}>
								{phone ? (
									<View className='items-center gap-1.5' style={{ flexDirection: 'row', direction: 'ltr' }}>
										<Ionicons name='phone-portrait-outline' size={14} color={colors.textMuted} />
										<Text style={{ ...theme.typography.caption, fontSize: 11, color: colors.textMuted, writingDirection: 'ltr', textAlign: 'left' }}>{phone}</Text>
									</View>
								) : null}
								{client.email ? (
									<View className='items-center gap-1.5' style={{ flexDirection: 'row', direction: 'ltr' }}>
										<Ionicons name='mail-outline' size={14} color={colors.textMuted} />
										<Text style={{ ...theme.typography.caption, fontSize: 11, color: colors.textMuted, writingDirection: 'ltr', textAlign: 'left' }}>{client.email}</Text>
									</View>
								) : null}
							</View>
						) : null}

						<View className='flex-row flex-wrap justify-center items-center gap-4 pt-3 w-full' style={{ borderTopColor: colors.divider, borderTopWidth: theme.borderWidths.subtle }}>
							{completedTripCount > 0 && client.avgRating != null ? (
								<Text style={{ ...theme.typography.caption, color: colors.rating }}>⭐ {Number(client.avgRating).toFixed(1)}</Text>
							) : completedTripCount > 0 ? (
								<View className='flex-row items-center gap-1.5 rounded-full px-2.5 py-1' style={{ backgroundColor: colors.surfaceElevated }}>
									<Ionicons name='star-outline' size={14} color={colors.textMuted} />
									<Text style={{ ...theme.typography.caption, color: colors.textMuted }}>لسه معملش تقييمات</Text>
								</View>
							) : null}
							<Text style={{ ...theme.typography.caption, color: colors.primary }}><Ionicons name='car-outline' size={14} color={colors.primary} /> {completedTripCount} رحلة مكتملة</Text>
						</View>

							<TourTarget tourId={TOUR_IDS.PROFILE} targetId='profileReputation' asChild>
								<Pressable onPress={() => setReputationDetailsVisible(true)} className='w-full gap-2.5 pt-3' style={{ borderTopColor: colors.divider, borderTopWidth: theme.borderWidths.subtle }}>
								<View className='flex-row items-center justify-between'>
									<View className='flex-row items-center gap-1.5'>
										<Ionicons name={reputationIcon} size={18} color={reputationColor} />
										<Text className='text-sm font-bold' style={{ color: reputationColor }}>{reputation.label}</Text>
									</View>
									<Text className='text-base font-bold' style={{ color: reputationColor }}>{reputation.score}%</Text>
								</View>
							<View className='h-2 w-full rounded-full overflow-hidden' style={{ backgroundColor: colors.surfaceElevated }}>
								<View className='h-full rounded-full' style={{ width: `${reputation.score ?? 0}%`, backgroundColor: reputationColor }} />
							</View>
							{!reputation.isNew ? <Text className='text-xs' style={{ color: colors.textMuted }}>{reputation.acceptedReports} بلاغ مقبول خلال آخر 30 يوم</Text> : null}
								</Pressable>
							</TourTarget>
						</View>
					</TourTarget>

					<TourTarget tourId={TOUR_IDS.PROFILE} targetId='profileTabs' asChild>
						<View className='w-full rounded-3xl p-4 mt-4 flex-1 flex-col gap-4 mb-4' style={{ backgroundColor: colors.surface, ...elevation.card }}>
						<View className='flex-row flex-wrap justify-center items-center gap-2 pb-3' style={{ borderBottomColor: colors.divider, borderBottomWidth: theme.borderWidths.subtle }}>
							{tabs.map((tab) => {
								const isActive = selectedSection === tab.id
								return (
									<Pressable
										key={tab.id}
										onPress={() => setSelectedSection(tab.id)}
										className='py-2 px-3 flex-row items-center gap-1.5'
										style={{
											backgroundColor: isActive ? colors.primary : colors.surfaceElevated,
											borderColor: isActive ? colors.primary : colors.border,
											borderWidth: theme.borderWidths.subtle,
											borderRadius: 20,
										}}
									>
										<Ionicons name={tab.icon} size={14} color={isActive ? colors.onPrimary : colors.textSecondary} />
										<Text style={{ ...theme.typography.caption, color: isActive ? colors.onPrimary : colors.textSecondary, fontWeight: isActive ? '700' : theme.typography.caption.fontWeight }}>
											{tab.label}
										</Text>
									</Pressable>
								)
							})}
						</View>

							<View>
								<ProfileSections selectedSection={selectedSection} />
							</View>
						</View>
					</TourTarget>

					<Text className='text-center text-xs mb-4' style={{ color: colors.textMuted }}>الإصدار {appVersion}</Text>
				</ScrollView>
				<ReputationDetailsModal visible={reputationDetailsVisible} onClose={() => setReputationDetailsVisible(false)} reputation={reputation} banReason={user.banReason} />
			</SafeAreaView>
		</View>
	)
}

export default ClientProfile
