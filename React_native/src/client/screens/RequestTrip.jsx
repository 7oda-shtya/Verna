import { useDispatch, useSelector } from 'react-redux'
import { useState, useEffect, useRef } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getRouteRequest } from '../../api/routing.api'
import { nearestPlaceRequest } from '../services/place.service'
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import TripRouteMap from '../components/map/TripRouteMap'
import TripPickerPanel from '../components/trip/TripPickerPanel'
import { requestTrip } from '../../redux/slices/client/tripSlice'
import { useTheme } from '../../theme/useTheme'
import { createSavedPlaceRequest, createSavedTripRequest } from '../../api/favorites.api'
import client from '../../api/client'
import TripBookingDetails from '../components/trip/TripBookingDetails'
import { updateSavedPlace, updateSavedTrip } from '../../redux/slices/client/librarySlice'
import { TOUR_IDS, TourTarget, useTour } from '../../tour'

export const TRIP_DRAFT_STORAGE_KEY = 'tripDraft'

const emptyDraft = { startPin: null, endPin: null, waypoints: [], route: null }
const FAVORITE_ICONS = ['home', 'briefcase', 'barbell', 'school', 'star', 'heart', 'location']

const RequestTrip = () => {
	const [activeWaypointIndex, setActiveWaypointIndex] = useState(null)
	const { theme } = useTheme()
	const { colors, shadows: elevation } = theme
	const insets = useSafeAreaInsets()
	const topBarOffset = insets.top + 12
	const bottomBarOffset = insets.bottom + 20

	const dispatch = useDispatch()
	const navigation = useNavigation()
	const route = useRoute()
	const editTripId = route.params?.editTripId || null
	const clientId = useSelector(state => state.auth.id)
	const isTemporarilyBanned = useSelector(state => Boolean(state.auth?.isBanned))
	const walletBalance = Number(useSelector(state => state.auth?.wallet) || 0)
	const [bookingStep, setBookingStep] = useState(1)
	const [tripDraft, setTripDraft] = useState(emptyDraft)
	const [pickTarget, setPickTarget] = useState('start')
	const [draftLoaded, setDraftLoaded] = useState(false)
	const [saveModalVisible, setSaveModalVisible] = useState(false)
	const [saveSelectionMade, setSaveSelectionMade] = useState(false)
	const [waypointToDelete, setWaypointToDelete] = useState(null)
	const [saveType, setSaveType] = useState('place')
	const [savePlaceTarget, setSavePlaceTarget] = useState('start')
	const [saveName, setSaveName] = useState('')
	const [saveIcon, setSaveIcon] = useState('star')
	const [saving, setSaving] = useState(false)
	const [toast, setToast] = useState('')
	const [timing, setTiming] = useState('now')
	const [scheduledTime, setScheduledTime] = useState(null)
	const [passengerCount, setPassengerCount] = useState(1)
	const [vehicleCategory, setVehicleCategory] = useState('economy')
	const [paymentMethod, setPaymentMethod] = useState('cash')
	const [driverNotes, setDriverNotes] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [bookingError, setBookingError] = useState('')
	const submissionLock = useRef(false)
	const { startTour, isTourSeen, ready: tourReady, activeTourId, currentStep } = useTour()

	useEffect(() => {
		if (!toast) return
		const timer = setTimeout(() => setToast(''), 2400)
		return () => clearTimeout(timer)
	}, [toast])

	useEffect(() => {
		AsyncStorage.getItem(TRIP_DRAFT_STORAGE_KEY).then(saved => {
			if (saved) {
				try {
					setTripDraft(JSON.parse(saved))
				} catch { }
			}
			setDraftLoaded(true)
		})
	}, [])

	useEffect(() => {
		if (!draftLoaded) return
		AsyncStorage.setItem(TRIP_DRAFT_STORAGE_KEY, JSON.stringify(tripDraft))
	}, [tripDraft, draftLoaded])

	useEffect(() => {
		if (!draftLoaded || !tourReady || activeTourId || isTourSeen(TOUR_IDS.TRIP_REQUEST)) return
		const timer = setTimeout(() => {
			startTour(TOUR_IDS.TRIP_REQUEST)
		}, 850)
		return () => clearTimeout(timer)
	}, [activeTourId, draftLoaded, isTourSeen, startTour, tourReady])

	// Removed: this used to force bookingStep to 2 (the details screen) any time the guided
	// tour's currentStep pointed at a details-screen target (timingNow/timingLater/
	// vehicleCategory/confirmTrip) — regardless of whether the user had actually pressed the
	// real "التالي" button. That's what caused two bugs: (1) the details screen could appear
	// immediately instead of the map, and (2) finishing the map portion of the tour auto-jumped
	// to the details screen on its own. Now bookingStep only ever changes via the explicit
	// "التالي"/"تعديل" buttons below. If the tour reaches a details-screen step while still on
	// the map, its target simply isn't mounted yet, so TourOverlay just waits (renders nothing)
	// until the user presses the real "التالي" button — at which point the details screen
	// mounts, the target registers, and the tour picks the explanation back up right there.

	const handleMapPress = (coord) => {
		const pin = { lat: coord.latitude, lng: coord.longitude, name: 'موقع محدد على الخريطة' }
		const target = pickTarget
		const wpIndex = activeWaypointIndex

		const applyPin = (p) => {
			if (target === 'start') return setTripDraft(prev => ({ ...prev, startPin: p }))
			if (target === 'end') return setTripDraft(prev => ({ ...prev, endPin: p }))
			if (wpIndex === null) return
			setTripDraft(prev => {
				const waypoints = [...prev.waypoints]
				waypoints[wpIndex] = p
				return { ...prev, waypoints }
			})
		}

		applyPin(pin)

		// لو فيه مكان معروف قريب من نقطة الضغطة، بدّل الاسم الافتراضي باسمه
		nearestPlaceRequest(coord.latitude, coord.longitude)
			.then(res => {
				const nearest = res.data?.data
				if (nearest?.name) applyPin({ ...pin, name: nearest.name })
			})
			.catch(() => { })
	}

	const handlePickWaypoint = (index) => {
		setPickTarget('waypoint')
		setActiveWaypointIndex(index)
	}

	const handleAddNewWaypoint = () => {
		if (tripDraft.waypoints.some(wp => !wp)) return
		setTripDraft(prev => {
			const waypoints = [...prev.waypoints, null]
			setActiveWaypointIndex(waypoints.length - 1)
			return { ...prev, waypoints }
		})
		setPickTarget('waypoint')
	}

	const handleDeleteWaypoint = (index) => {
		setWaypointToDelete(index)
	}

	const confirmDeleteWaypoint = () => {
		if (waypointToDelete === null) return
		const index = waypointToDelete
		setTripDraft(prev => ({ ...prev, waypoints: prev.waypoints.filter((_, i) => i !== index) }))
		setActiveWaypointIndex(prev => (prev === index ? null : prev > index ? prev - 1 : prev))
		setWaypointToDelete(null)
	}

	const handleSelectStart = (place) => {
		setTripDraft(prev => ({
			...prev,
			startPin: { lat: place.lat, lng: place.lng, name: place.name }
		}))
		setPickTarget('end')
	}

	const handleSelectEnd = (place) => {
		setTripDraft(prev => ({
			...prev,
			startPin: prev.startPin,
			endPin: { lat: place.lat, lng: place.lng, name: place.name }
		}))
		setPickTarget(null)
	}
	const handleSelectWaypoint = (index, place) => setTripDraft(prev => {
		const waypoints = [...prev.waypoints]
		waypoints[index] = { lat: place.lat, lng: place.lng, name: place.name }
		return { ...prev, waypoints }
	})

	useEffect(() => {
		if (!tripDraft.startPin || !tripDraft.endPin) return
		if (tripDraft.waypoints.some(wp => !wp)) return
		const points = [tripDraft.startPin, ...tripDraft.waypoints, tripDraft.endPin]
		getRouteRequest(points).then(res => {
			const route = res.data?.data ?? res.data
			setTripDraft(prev => ({ ...prev, route }))
		}).catch(err => {
			console.warn('getRouteRequest failed:', err?.response?.status, err?.response?.data || err.message)
		})
	}, [tripDraft.startPin, tripDraft.endPin, tripDraft.waypoints])

	const handleConfirm = async ({ estimatedPrice }) => {
		if (submissionLock.current) return
		if (isTemporarilyBanned && !editTripId) {
			setBookingError('حسابك موقوف مؤقتًا ولا يمكنك طلب رحلة جديدة حاليًا.')
			return
		}
		if (!tripDraft.route || !tripDraft.startPin || !tripDraft.endPin) {
			setBookingError('بيانات المسار غير مكتملة. ارجع وعدّل المسار أولًا.')
			return
		}
		let selectedScheduledDate = null
		if (timing === 'later') {
			const now = new Date()
			now.setSeconds(0, 0)
			const maximumTime = new Date(now.getTime() + 12 * 60 * 60 * 1000)
			selectedScheduledDate = scheduledTime instanceof Date ? scheduledTime : null
			if (!selectedScheduledDate || Number.isNaN(selectedScheduledDate.getTime()) || selectedScheduledDate < now || selectedScheduledDate > maximumTime) {
				setBookingError('اختار موعدًا من الوقت الحالي وحتى 12 ساعة قادمة.')
				return
			}
		}
		if (paymentMethod === 'wallet' && walletBalance < estimatedPrice) {
			setBookingError('رصيد المحفظة لا يكفي للسعر التقديري لهذه الفئة.')
			return
		}

		try {
			submissionLock.current = true
			setSubmitting(true)
			setBookingError('')
			const payload = {
				startLocation: tripDraft.startPin,
				endLocation: tripDraft.endPin,
				ridersCount: passengerCount,
				customerNote: driverNotes.trim() || null,
				scheduledTime: selectedScheduledDate?.toISOString() || null,
				waypoints: tripDraft.waypoints.filter(Boolean),
				route: tripDraft.route,
				paymentMethod,
				vehicleCategory,
			}
			const response = editTripId
				? await client.patch(`/client/trips/${editTripId}`, payload)
				: await client.post('/client/trips', payload)
			const serverTrip = response.data?.data
			dispatch(requestTrip({
				...tripDraft,
				clientId,
				serverTripId: serverTrip?.id,
				price: estimatedPrice,
				scheduledTime: payload.scheduledTime,
				customerNote: payload.customerNote,
				passengerCount,
				paymentMethod,
				vehicleCategory,
			}))
			await AsyncStorage.removeItem(TRIP_DRAFT_STORAGE_KEY)
			navigation.navigate('ClientTabs', {
				screen: 'Home',
				params: {
					tripSuccess: editTripId
						? 'تم تعديل الرحلة وإلغاء عروض السائقين القديمة'
						: 'تم طلب الرحلة بنجاح',
				},
			})
		} catch (error) {
			setBookingError(error.response?.data?.message || 'تعذر إرسال طلب الرحلة. حاول مرة أخرى.')
		} finally {
			submissionLock.current = false
			setSubmitting(false)
		}
	}

	const openSaveModal = () => {
		const canSaveTrip = Boolean(tripDraft.startPin && tripDraft.endPin)
		const defaultTarget = tripDraft.startPin ? 'start' : 'end'
		const place = defaultTarget === 'start' ? tripDraft.startPin : tripDraft.endPin
		setSaveType('place')
		setSavePlaceTarget(defaultTarget)
		setSaveName(place?.name || '')
		setSaveIcon(canSaveTrip ? 'star' : 'location')
		setSaveSelectionMade(false)
		setSaveModalVisible(true)
	}

	const handleSaveFavorite = async () => {
		const title = saveName.trim()
		if (!title) {
			setToast('اكتب اسمًا للمفضلة')
			return
		}
		try {
			setSaving(true)
			if (saveType === 'place') {
				const place = savePlaceTarget === 'start' ? tripDraft.startPin : tripDraft.endPin
				if (!place) throw new Error('حدد مكانًا أولًا')
				const response = await createSavedPlaceRequest({
					name: title,
					address: place.name,
					lat: place.lat,
					lng: place.lng,
					icon: saveIcon,
				})
				if (response.data?.data) dispatch(updateSavedPlace(response.data.data))
			} else {
				if (!tripDraft.startPin || !tripDraft.endPin) throw new Error('حدد نقطة البداية والوجهة أولًا')
				const response = await createSavedTripRequest({
					title,
					icon: saveIcon,
					fromLat: tripDraft.startPin.lat,
					fromLng: tripDraft.startPin.lng,
					fromName: tripDraft.startPin.name,
					toLat: tripDraft.endPin.lat,
					toLng: tripDraft.endPin.lng,
					toName: tripDraft.endPin.name,
				})
				if (response.data?.data) dispatch(updateSavedTrip(response.data.data))
			}
			setSaveModalVisible(false)
			setToast(saveType === 'place' ? 'تم حفظ المكان بنجاح' : 'تم حفظ الرحلة بنجاح')
		} catch (error) {
			setToast(error?.response?.data?.message || error.message || 'تعذر الحفظ، حاول مرة أخرى')
		} finally {
			setSaving(false)
		}
	}

	if (isTemporarilyBanned && !editTripId) {
		return (
			<SafeAreaView className='flex-1 items-center justify-center px-6' style={{ backgroundColor: colors.background }}>
				<View className='w-full rounded-3xl p-6 items-center gap-3' style={theme.components.card}>
					<Ionicons name='lock-closed-outline' size={36} color={colors.error} />
					<Text className='text-lg font-bold text-center' style={{ color: colors.textPrimary }}>طلب الرحلات متوقف مؤقتًا</Text>
					<Text className='text-sm text-center leading-6' style={{ color: colors.textSecondary }}>لا يمكنك طلب رحلة جديدة حتى انتهاء مدة الإيقاف الموضحة في الصفحة الرئيسية أو البروفايل.</Text>
					<Pressable onPress={() => navigation.goBack()} className='w-full items-center py-3.5 rounded-2xl mt-2' style={{ backgroundColor: colors.primary }}>
						<Text className='font-bold' style={{ color: colors.onPrimary }}>رجوع</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView style={{ flex: 1 }}>
			{bookingStep === 1 ? <>
			<TripRouteMap
				startPin={tripDraft.startPin} endPin={tripDraft.endPin} waypoints={tripDraft.waypoints}
				routeCoordinates={tripDraft.route?.coordinates || []}
				onMapPress={handleMapPress}
				tourId={TOUR_IDS.TRIP_REQUEST}
			/>

			<Pressable
				onPress={() => navigation.goBack()}
				hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
				className='w-12 h-12 rounded-full items-center justify-center z-10'
				style={{ position: 'absolute', top: topBarOffset, right: 12, backgroundColor: colors.overlay, ...elevation.floating }}
			>
				<Ionicons name='chevron-back' size={22} color={colors.textPrimary} />
			</Pressable>

			<TripPickerPanel
				startPin={tripDraft.startPin}
				endPin={tripDraft.endPin}
				waypointPins={tripDraft.waypoints}
				pickTarget={pickTarget}
				activeWaypointIndex={activeWaypointIndex}
				tourId={TOUR_IDS.TRIP_REQUEST}
				topOffset={topBarOffset}
				onPickStart={() => setPickTarget('start')}
				onPickEnd={() => setPickTarget('end')}
				onPickWaypoint={handlePickWaypoint}
				canAddWaypoint={!tripDraft.waypoints.some(wp => !wp)}
				onAddNewWaypoint={handleAddNewWaypoint}
				onDeleteWaypoint={handleDeleteWaypoint}
				onSelectStart={handleSelectStart}
				onSelectEnd={handleSelectEnd}
				onSelectWaypoint={handleSelectWaypoint}
			/>

			{toast ? (
				<View className='absolute top-28 self-center z-50 rounded-full px-5 py-3' style={{ backgroundColor: colors.surfaceElevated, ...elevation.floating }}>
					<Text style={{ ...theme.typography.body, fontWeight: '600', color: colors.textPrimary }}>{toast}</Text>
				</View>
			) : null}

			<View style={{ position: 'absolute', bottom: bottomBarOffset, left: 20, right: 20, gap: 9 }}>
				{tripDraft.route ? (
					<View className='flex-row-reverse items-center justify-between px-4 py-3' style={{ backgroundColor: colors.overlay, borderColor: colors.border, borderWidth: theme.borderWidths.subtle, borderRadius: 18, ...elevation.card }}>
						{[
							{ icon: 'map-outline', label: 'المسافة', value: tripDraft.route.distanceKm != null ? `${tripDraft.route.distanceKm} كم` : '—' },
							{ icon: 'time-outline', label: 'الوقت', value: tripDraft.route.durationMin != null ? `${tripDraft.route.durationMin} دقيقة` : '—' },
						].map(item => (
							<View key={item.label} className='flex-1 items-center gap-1'>
								<Ionicons name={item.icon} size={17} color={colors.primary} />
								<Text style={{ ...theme.typography.tiny, color: colors.textSecondary }}>{item.label}</Text>
								<Text style={{ ...theme.typography.caption, fontWeight: '700', color: colors.textPrimary }}>{item.value}</Text>
							</View>
						))}
					</View>
				) : (
					<Text className='text-center' style={{ ...theme.typography.caption, color: colors.textSecondary }}>حدد نقطة البداية ونقطة النهاية أولًا علشان تقدر تكمل.</Text>
				)}
				<View className='flex-row gap-3'>
				<TourTarget tourId={TOUR_IDS.TRIP_REQUEST} targetId='saveTrip' asChild>
					<Pressable
						onPress={openSaveModal}
						disabled={!tripDraft.startPin && !tripDraft.endPin}
						className='px-5 items-center justify-center'
						style={{
							backgroundColor: colors.surfaceElevated,
							borderColor: colors.border,
							borderWidth: theme.borderWidths.subtle,
							borderRadius: 20,
							opacity: tripDraft.startPin || tripDraft.endPin ? 1 : 0.5,
							...elevation.card,
						}}
					>
						<Ionicons name='bookmark-outline' size={20} color={colors.primary} />
						<Text className='mt-1' style={{ ...theme.typography.caption, fontWeight: '700', color: colors.primary }}>حفظ</Text>
					</Pressable>
				</TourTarget>
				<Pressable
					onPress={() => setBookingStep(2)}
					disabled={!tripDraft.route}
					className='flex-1'
					style={{
						backgroundColor: tripDraft.route ? colors.primary : colors.surfaceElevated,
						paddingVertical: 14,
						borderRadius: 20,
						alignItems: 'center',
					}}
				>
					<Text style={{ ...theme.typography.subtitle, color: tripDraft.route ? colors.onPrimary : colors.textDisabled, fontWeight: '700' }}>التالي</Text>
				</Pressable>
				</View>
			</View>
			</> : (
				<TripBookingDetails
					route={tripDraft.route}
					timing={timing}
					onTimingChange={value => {
						setTiming(value)
						if (value === 'now') setScheduledTime(null)
					}}
					scheduledTime={scheduledTime}
					onScheduledTimeChange={setScheduledTime}
					passengerCount={passengerCount}
					onPassengerCountChange={setPassengerCount}
					vehicleCategory={vehicleCategory}
					onVehicleCategoryChange={setVehicleCategory}
					paymentMethod={paymentMethod}
					onPaymentMethodChange={setPaymentMethod}
					tourId={TOUR_IDS.TRIP_REQUEST}
					driverNotes={driverNotes}
					onDriverNotesChange={setDriverNotes}
					submitting={submitting}
					error={bookingError}
					onConfirm={handleConfirm}
					onEditRoute={() => setBookingStep(1)}
				/>
			)}

			<Modal transparent visible={waypointToDelete !== null} animationType='fade' onRequestClose={() => setWaypointToDelete(null)}>
				<Pressable className='flex-1 items-center justify-center px-5' style={{ backgroundColor: colors.backdrop }} onPress={() => setWaypointToDelete(null)}>
					<Pressable className='w-full max-w-md p-5 gap-4' style={theme.components.modal} onPress={event => event.stopPropagation()}>
						<View className='w-14 h-14 self-center items-center justify-center rounded-full' style={{ backgroundColor: colors.errorMuted }}>
							<Ionicons name='trash-outline' size={25} color={colors.error} />
						</View>
						<View className='gap-2'>
							<Text className='text-center' style={{ ...theme.typography.title, color: colors.textPrimary }}>حذف المحطة الوسيطة؟</Text>
							<Text className='text-center leading-6' style={{ ...theme.typography.body, color: colors.textSecondary }}>المحطة هتتشال من المسار وهيتم حساب الرحلة من جديد.</Text>
						</View>
						<View className='flex-row-reverse gap-3'>
							<Pressable onPress={confirmDeleteWaypoint} className='flex-1 items-center justify-center py-3.5 rounded-2xl' style={{ backgroundColor: colors.error }}>
								<Text className='text-white' style={theme.typography.subtitle}>حذف المحطة</Text>
							</Pressable>
							<Pressable onPress={() => setWaypointToDelete(null)} className='flex-1 items-center justify-center py-3.5 rounded-2xl' style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}>
								<Text style={{ ...theme.typography.subtitle, color: colors.textPrimary }}>رجوع</Text>
							</Pressable>
						</View>
					</Pressable>
				</Pressable>
			</Modal>

			<Modal transparent visible={saveModalVisible} animationType='fade' onRequestClose={() => setSaveModalVisible(false)}>
				<Pressable className='flex-1 items-center justify-center px-5' style={{ backgroundColor: colors.backdrop }} onPress={() => setSaveModalVisible(false)}>
					<Pressable className='w-full p-5 gap-4' style={theme.components.modal} onPress={event => event.stopPropagation()}>
						<View className='flex-row items-center justify-between'>
							<Text style={{ ...theme.typography.title, color: colors.textPrimary }}>حفظ في المفضلة</Text>
							<Pressable onPress={() => setSaveModalVisible(false)}>
								<Ionicons name='close' size={24} color={colors.iconInactive} />
							</Pressable>
						</View>

						<View className='flex-row gap-2'>
							{[
								{ id: 'place', label: 'مكان محفوظ', disabled: !tripDraft.endPin && !tripDraft.startPin },
								{ id: 'trip', label: 'مسار رحلة كامل', disabled: !tripDraft.startPin || !tripDraft.endPin },
							].map(option => {
								const active = saveSelectionMade && saveType === option.id
								return (
									<Pressable
										key={option.id}
										disabled={option.disabled}
									onPress={() => {
											setSaveType(option.id)
											setSaveSelectionMade(true)
											const place = savePlaceTarget === 'start' ? tripDraft.startPin : tripDraft.endPin
											setSaveName(option.id === 'trip' ? `${tripDraft.startPin?.name || 'البداية'} ← ${tripDraft.endPin?.name || 'الوجهة'}` : place?.name || '')
										}}
										className='flex-1 items-center py-3'
										style={{
											backgroundColor: active ? colors.primaryMuted : colors.surface,
											borderColor: active ? colors.primary : colors.border,
											borderWidth: theme.borderWidths.subtle,
											borderRadius: 16,
											opacity: option.disabled ? 0.45 : 1,
										}}
									>
										<Text style={{ ...theme.typography.caption, fontWeight: '700', color: active ? colors.primary : colors.textSecondary }}>{option.label}</Text>
									</Pressable>
								)
							})}
						</View>

						{saveSelectionMade && saveType === 'place' ? (
							<View>
								<Text className='mb-2' style={{ ...theme.typography.caption, fontWeight: '600', color: colors.textSecondary }}>اختار النقطة اللي عايز تحفظها</Text>
								<View className='flex-row gap-2'>
									{[
										{ id: 'start', label: 'نقطة البداية', icon: 'radio-button-on', pin: tripDraft.startPin },
										{ id: 'end', label: 'نقطة النهاية', icon: 'location', pin: tripDraft.endPin },
									].map(option => {
										const active = savePlaceTarget === option.id
										return (
											<Pressable
												key={option.id}
												disabled={!option.pin}
												onPress={() => {
													setSavePlaceTarget(option.id)
													setSaveName(option.pin?.name || '')
												}}
												className='flex-1 flex-row items-center justify-center gap-2 py-3'
												style={{
													backgroundColor: active ? colors.primaryMuted : colors.surface,
													borderColor: active ? colors.primary : colors.border,
													borderWidth: theme.borderWidths.subtle,
													borderRadius: 14,
													opacity: option.pin ? 1 : 0.4,
												}}
											>
												<Ionicons name={option.icon} size={17} color={active ? colors.primary : colors.iconInactive} />
												<Text style={{ ...theme.typography.caption, fontWeight: '700', color: active ? colors.primary : colors.textSecondary }}>{option.label}</Text>
											</Pressable>
										)
									})}
								</View>
							</View>
						) : null}

						{saveSelectionMade ? <>
						<TextInput
							value={saveName}
							onChangeText={setSaveName}
							placeholder={saveType === 'place' ? 'اسم المكان، مثل البيت' : 'اسم الرحلة، مثل طريق الجامعة'}
							placeholderTextColor={colors.placeholder}
							style={{ ...theme.components.input, ...theme.typography.body }}
							className='py-3'
						/>

						<View>
							<Text className='mb-2' style={{ ...theme.typography.caption, fontWeight: '600', color: colors.textSecondary }}>اختار أيقونة</Text>
							<View className='flex-row flex-wrap gap-2'>
								{FAVORITE_ICONS.map(icon => {
									const active = saveIcon === icon
									return (
										<Pressable
											key={icon}
											onPress={() => setSaveIcon(icon)}
											className='w-11 h-11 items-center justify-center'
											style={{
												backgroundColor: active ? colors.primaryMuted : colors.surfaceElevated,
												borderColor: active ? colors.primary : colors.border,
												borderWidth: theme.borderWidths.subtle,
												borderRadius: 14,
											}}
										>
											<Ionicons name={icon} size={20} color={active ? colors.primary : colors.iconInactive} />
										</Pressable>
									)
								})}
							</View>
						</View>

						<Pressable disabled={saving} onPress={handleSaveFavorite} className='items-center py-4' style={{ backgroundColor: colors.primary, borderRadius: 16, opacity: saving ? 0.7 : 1 }}>
							{saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ ...theme.typography.subtitle, color: colors.onPrimary }}>حفظ</Text>}
						</Pressable>
						</> : (
							<Text className='text-center' style={{ ...theme.typography.caption, color: colors.textSecondary }}>اختار الأول إذا كنت عايز تحفظ مكان أو رحلة كاملة.</Text>
						)}
					</Pressable>
				</Pressable>
			</Modal>
		</SafeAreaView>
	)
}

export default RequestTrip