import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useFocusEffect, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import client from '../../api/client'
import { useTheme } from '../../theme/useTheme'
import { hydrateCurrentTrip } from '../../redux/slices/client/tripSlice'
import { on } from '../services/socket.service'
import useTrackParty from '../hooks/useTrackParty'
import useLiveLocation from '../hooks/useLiveLocation'
import TripRouteMap from '../components/map/TripRouteMap'

const Offers = () => {
	const navigation = useNavigation()
	const route = useRoute()
	const dispatch = useDispatch()
	const insets = useSafeAreaInsets()
	const isFocused = useIsFocused()
	const { theme } = useTheme()
	const { colors } = theme
	const tripId = route.params?.tripId
	const trip = useSelector(state => state.trip?.currentTrip)

	const [offers, setOffers] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [acceptingId, setAcceptingId] = useState(null)
	const [walletIssue, setWalletIssue] = useState(null)
	const trackingActive = Boolean(isFocused && tripId && offers.length)
	const { partyLocation } = useTrackParty(tripId, trackingActive)
	const { location } = useLiveLocation(tripId, trackingActive, false)

	const loadOffers = useCallback(() => {
		setLoading(true)
		setError('')
		client.get(`/client/trips/${tripId}/offers`)
			.then(response => setOffers(response.data?.data || []))
			.catch(() => setError('تعذر تحميل العروض حاليًا'))
			.finally(() => setLoading(false))
	}, [tripId])

	useFocusEffect(useCallback(() => { loadOffers() }, [loadOffers]))

	// Driver offers arrive at any time while this trip is PENDING; without this the list only
	// ever updates on manual pull-to-refresh or re-focusing the screen.
	useEffect(() => {
		if (!isFocused || !tripId) return undefined
		let unsubscribe
		let cancelled = false
		on('offer:new', payload => { if (payload?.tripId === tripId) loadOffers() })
			.then(fn => { if (cancelled) fn(); else unsubscribe = fn })
		return () => { cancelled = true; unsubscribe?.() }
	}, [isFocused, tripId, loadOffers])

	const acceptOffer = async (offerId, paymentResolution) => {
		try {
			setAcceptingId(offerId)
			setError('')
			const response = await client.patch(`/client/offers/${offerId}/accept`, paymentResolution ? { paymentResolution } : {})
			dispatch(hydrateCurrentTrip(response.data.data))
			setWalletIssue(null)
			navigation.replace('TripTracking', { trip: response.data.data })
		} catch (requestError) {
			if (requestError.response?.data?.field === 'INSUFFICIENT_WALLET_BALANCE') {
				setWalletIssue({ offerId, ...(requestError.response.data.details || {}) })
			} else {
				setError(requestError.response?.data?.message || 'تعذر قبول العرض حاليًا')
			}
		} finally {
			setAcceptingId(null)
		}
	}

	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			<View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12 }}>
				<Pressable onPress={() => navigation.goBack()} hitSlop={10} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated }}>
					<Ionicons name='chevron-forward' size={20} color={colors.textPrimary} />
				</Pressable>
				<Text style={{ ...theme.typography.title, color: colors.textPrimary }}>عروض السائقين</Text>
			</View>

			{loading && !offers.length ? (
				<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>
			) : (
				<ScrollView
					contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
					refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOffers} tintColor={colors.primary} />}
				>
					{trackingActive && trip?.startPin && trip?.endPin ? (
						<View style={{ height: 220, overflow: 'hidden', borderRadius: 18 }}>
							<TripRouteMap
								startPin={trip.startPin}
								endPin={trip.endPin}
								waypoints={trip.waypoints || []}
								routeCoordinates={trip.route?.coordinates || []}
								userLocation={location?.coords && { lat: location.coords.latitude, lng: location.coords.longitude }}
								partyLocation={partyLocation}
							/>
						</View>
					) : null}
					{error ? <Text style={{ color: colors.error, textAlign: 'right' }}>{error}</Text> : null}
					{!loading && !offers.length ? (
						<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 60 }}>
							<Ionicons name='hourglass-outline' size={30} color={colors.textSecondary} />
							<Text style={{ color: colors.textSecondary, textAlign: 'center' }}>لا توجد عروض حتى الآن، السائقون يشوفوا طلبك الآن.</Text>
						</View>
					) : null}
					{offers.map(offer => (
						<View key={offer.id} style={{ padding: 16, gap: 10, ...theme.components.card }}>
							<View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start' }}>
								<View style={{ flex: 1, alignItems: 'flex-end' }}>
									<Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16 }}>{offer.driver?.name || 'سائق'}</Text>
									<Text style={{ color: colors.textSecondary, marginTop: 3 }}>
										{offer.driver?.avgRating != null ? `★ ${Number(offer.driver.avgRating).toFixed(1)} — ` : ''}
										{offer.driver?.car?.model || 'سيارة'} {offer.driver?.car?.plateNumber ? `— ${offer.driver.car.plateNumber}` : ''}
									</Text>
								</View>
								<View style={{ backgroundColor: colors.primaryMuted, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 }}>
									<Text style={{ color: colors.primary, fontWeight: '800' }}>{offer.price} ج.م</Text>
								</View>
							</View>
							{offer.timeToReach ? <Text style={{ color: colors.textSecondary, textAlign: 'right' }}>الوصول خلال {offer.timeToReach}</Text> : null}
							{offer.note ? <Text style={{ color: colors.textSecondary, textAlign: 'right' }}>{offer.note}</Text> : null}

							{walletIssue?.offerId === offer.id ? (
								<View style={{ gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.errorMuted, borderColor: colors.error, borderWidth: 1 }}>
									<Text style={{ color: colors.error, textAlign: 'right', fontSize: 13, lineHeight: 19 }}>
										رصيدك في المحفظة غير كافٍ ({walletIssue.walletBalance ?? 0} من {walletIssue.price ?? offer.price}).
									</Text>
									<Pressable disabled={acceptingId === offer.id} onPress={() => acceptOffer(offer.id, 'CASH')} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.error, opacity: acceptingId === offer.id ? 0.65 : 1 }}>
										{acceptingId === offer.id ? <ActivityIndicator color='#FFFFFF' /> : <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>ادفع نقدًا بدلًا من ذلك</Text>}
									</Pressable>
									<Pressable disabled={acceptingId === offer.id} onPress={() => setWalletIssue(null)}><Text style={{ color: colors.textMuted, textAlign: 'center' }}>رجوع</Text></Pressable>
								</View>
							) : (
								<Pressable disabled={acceptingId === offer.id} onPress={() => acceptOffer(offer.id)} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary, opacity: acceptingId === offer.id ? 0.55 : 1 }}>
									{acceptingId === offer.id ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ color: colors.onPrimary, fontWeight: '800' }}>قبول العرض</Text>}
								</Pressable>
							)}
						</View>
					))}
				</ScrollView>
			)}
		</View>
	)
}

export default Offers
