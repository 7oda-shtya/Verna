import React, { useCallback, useEffect, useState } from 'react'
import {
	ActivityIndicator,
	Modal,
	Pressable,
	RefreshControl,
	SafeAreaView,
	ScrollView,
	Text,
	TextInput,
	View,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useDispatch, useSelector } from 'react-redux'
import Header from '../components/Header'
import { useTheme } from '../../theme/useTheme'
import { TRIP_DRAFT_STORAGE_KEY } from './RequestTrip'
import {
	deleteSavedPlaceRequest,
	deleteSavedTripRequest,
	updateSavedPlaceRequest,
	updateSavedTripRequest,
} from '../../api/favorites.api'
import {
	removeSavedPlaceFromStore,
	removeSavedTripFromStore,
	setFavorites,
	updateSavedPlace,
	updateSavedTrip,
} from '../../redux/slices/client/librarySlice'
import { useGetSavedPlacesQuery, useGetSavedTripsQuery } from '../../redux/services/libraryApi'

const FAVORITE_ICONS = ['home', 'briefcase', 'barbell', 'school', 'star', 'heart', 'location']
const normalizeIcon = icon => FAVORITE_ICONS.includes(icon) ? icon : 'location'

const EmptyState = ({ icon, title, theme }) => (
	<View className='items-center gap-3 py-14' style={theme.components.card}>
		<Ionicons name={icon} size={34} color={theme.colors.iconInactive} />
		<Text className='text-sm' style={{ color: theme.colors.textSecondary }}>{title}</Text>
		<Text className='text-xs text-center px-8' style={{ color: theme.colors.textMuted }}>احفظها من شاشة طلب الرحلة وهتظهر هنا.</Text>
	</View>
)

const FavoritesSkeleton = ({ theme }) => (
	<View className='gap-3'>
		{[0, 1, 2].map(item => <View key={item} className='p-4 gap-3' style={theme.components.card}><View style={{ width: '42%', height: 16, borderRadius: 8, backgroundColor: theme.colors.surfaceElevated }} /><View style={{ width: '72%', height: 12, borderRadius: 6, backgroundColor: theme.colors.surfaceElevated }} /><View style={{ width: '100%', height: 42, borderRadius: 12, backgroundColor: theme.colors.surfaceElevated }} /></View>)}
	</View>
)

const Favorites = ({ navigation }) => {
	const { theme } = useTheme()
	const { colors } = theme
	const dispatch = useDispatch()
	const places = useSelector(state => state.library.savedPlaces)
	const trips = useSelector(state => state.library.savedTrips)
	const favoritesLoaded = useSelector(state => state.library.favoritesLoaded)
	const { data: placesResult, isFetching: placesFetching, error: placesQueryError, refetch: refetchPlaces } = useGetSavedPlacesQuery()
	const { data: tripsResult, isFetching: tripsFetching, error: tripsQueryError, refetch: refetchTrips } = useGetSavedTripsQuery()
	const [activeTab, setActiveTab] = useState('places')
	const [loading, setLoading] = useState(!favoritesLoaded)
	const [refreshing, setRefreshing] = useState(false)
	const [error, setError] = useState('')
	const [editItem, setEditItem] = useState(null)
	const [editName, setEditName] = useState('')
	const [editAddress, setEditAddress] = useState('')
	const [editIcon, setEditIcon] = useState('location')
	const [saving, setSaving] = useState(false)
	const [deleteItem, setDeleteItem] = useState(null)
	const [deleting, setDeleting] = useState(false)
	const [toast, setToast] = useState('')

	const loadFavorites = useCallback(async ({ silent = false } = {}) => {
		try {
			if (!silent) setLoading(true)
			setError('')
			await Promise.all([refetchPlaces(), refetchTrips()])
		} catch (requestError) {
			setError(requestError?.response?.data?.message || 'تعذر تحميل المفضلة حاليًا')
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}, [refetchPlaces, refetchTrips])

	useEffect(() => {
		if (!placesResult && !tripsResult) return
		const timer = setTimeout(() => {
			dispatch(setFavorites({ places: placesResult?.data || [], trips: tripsResult?.data || [] }))
			setLoading(false)
		}, 0)
		return () => clearTimeout(timer)
	}, [dispatch, placesResult, tripsResult])

	useEffect(() => {
		const queryError = placesQueryError || tripsQueryError
		if (!queryError) return
		const timer = setTimeout(() => setError(queryError?.data?.message || 'تعذر تحميل المفضلة حاليًا'), 0)
		return () => clearTimeout(timer)
	}, [placesQueryError, tripsQueryError])

	const showToast = message => {
		setToast(message)
		setTimeout(() => setToast(''), 2400)
	}

	const getCurrentPin = async () => {
		const permission = await Location.requestForegroundPermissionsAsync()
		if (permission.status !== 'granted') throw new Error('فعّل إذن الموقع لاستخدام موقعك الحالي')
		const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
		return {
			lat: position.coords.latitude,
			lng: position.coords.longitude,
			name: 'موقعي الحالي',
		}
	}

	const openTripDraft = async ({ startPin, endPin }) => {
		await AsyncStorage.setItem(TRIP_DRAFT_STORAGE_KEY, JSON.stringify({
			startPin,
			endPin,
			waypoints: [],
			route: null,
		}))
		navigation.navigate('RequestTrip')
	}

	const handlePlaceDestination = async place => {
		try {
			const currentPin = await getCurrentPin()
			await openTripDraft({
				startPin: currentPin,
				endPin: { lat: place.lat, lng: place.lng, name: place.address || place.name },
			})
		} catch (locationError) {
			showToast(locationError.message || 'تعذر تحديد موقعك الحالي')
		}
	}

	const requestSavedTrip = trip => openTripDraft({
		startPin: { lat: trip.fromLat, lng: trip.fromLng, name: trip.fromName || 'نقطة البداية' },
		endPin: { lat: trip.toLat, lng: trip.toLng, name: trip.toName || 'الوجهة' },
	})

	const reverseSavedTrip = trip => openTripDraft({
		startPin: { lat: trip.toLat, lng: trip.toLng, name: trip.toName || 'نقطة البداية' },
		endPin: { lat: trip.fromLat, lng: trip.fromLng, name: trip.fromName || 'الوجهة' },
	})

	const handleTripDestinationOnly = async trip => {
		try {
			const currentPin = await getCurrentPin()
			await openTripDraft({
				startPin: currentPin,
				endPin: { lat: trip.toLat, lng: trip.toLng, name: trip.toName || 'الوجهة' },
			})
		} catch (locationError) {
			showToast(locationError.message || 'تعذر تحديد موقعك الحالي')
		}
	}

	const openEdit = (item, type) => {
		setEditItem({ ...item, type })
		setEditName(type === 'place' ? item.name : item.title)
		setEditAddress(type === 'place' ? item.address || '' : '')
		setEditIcon(normalizeIcon(item.icon))
	}

	const saveEdit = async () => {
		if (!editName.trim()) {
			showToast('الاسم مطلوب')
			return
		}
		try {
			setSaving(true)
			if (editItem.type === 'place') {
				const response = await updateSavedPlaceRequest(editItem.id, {
					name: editName.trim(),
					address: editAddress.trim() || null,
					icon: editIcon,
				})
				dispatch(updateSavedPlace(response.data.data))
			} else {
				const response = await updateSavedTripRequest(editItem.id, {
					title: editName.trim(),
					icon: editIcon,
				})
				dispatch(updateSavedTrip(response.data.data))
			}
			setEditItem(null)
			showToast('تم حفظ التعديلات')
		} catch (requestError) {
			showToast(requestError?.response?.data?.message || 'تعذر حفظ التعديلات')
		} finally {
			setSaving(false)
		}
	}

	const confirmDelete = (item, type) => {
		setDeleteItem({ ...item, type })
	}

	const deleteFavorite = async () => {
		if (!deleteItem) return
		try {
			setDeleting(true)
			if (deleteItem.type === 'place') {
				await deleteSavedPlaceRequest(deleteItem.id)
				dispatch(removeSavedPlaceFromStore(deleteItem.id))
			} else {
				await deleteSavedTripRequest(deleteItem.id)
				dispatch(removeSavedTripFromStore(deleteItem.id))
			}
			setDeleteItem(null)
			showToast('تم الحذف')
		} catch (requestError) {
			showToast(requestError?.response?.data?.message || 'تعذر الحذف')
		} finally {
			setDeleting(false)
		}
	}

	const refresh = () => {
		setRefreshing(true)
		loadFavorites({ silent: true })
	}

	return (
		<SafeAreaView className='flex-1' style={{ backgroundColor: colors.background }} dir='rtl'>
			<Header />

			{toast ? (
				<View className='absolute top-24 self-center z-50 rounded-full px-5 py-3' style={{ backgroundColor: colors.surfaceElevated, ...theme.shadows.floating }}>
					<Text className='text-sm font-semibold' style={{ color: colors.textPrimary }}>{toast}</Text>
				</View>
			) : null}

			<ScrollView
				contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 120 }}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
			>
				<Text className='text-2xl font-bold mb-4' style={{ color: colors.textPrimary }}>المفضلة</Text>

				<View className='flex-row p-1 mb-5' style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: theme.borderWidths.subtle, borderRadius: 18 }}>
					{[
						{ id: 'places', label: 'الأماكن المحفوظة', icon: 'location' },
						{ id: 'trips', label: 'الرحلات المحفوظة', icon: 'git-compare' },
					].map(tab => {
						const active = activeTab === tab.id
						return (
							<Pressable
								key={tab.id}
								onPress={() => setActiveTab(tab.id)}
								className='flex-1 flex-row gap-2 items-center justify-center py-3'
								style={{ backgroundColor: active ? colors.primary : 'transparent', borderRadius: 14 }}
							>
								<Ionicons name={tab.icon} size={16} color={active ? colors.onPrimary : colors.iconInactive} />
								<Text className='text-xs font-bold' style={{ color: active ? colors.onPrimary : colors.textSecondary }}>{tab.label}</Text>
							</Pressable>
						)
					})}
				</View>

				{loading || (placesFetching && tripsFetching && !favoritesLoaded) ? (
					<FavoritesSkeleton theme={theme} />
				) : error ? (
					<View className='items-center gap-3 py-14' style={theme.components.card}>
						<Ionicons name='cloud-offline-outline' size={34} color={colors.error} />
						<Text className='text-sm text-center' style={{ color: colors.textSecondary }}>{error}</Text>
						<Pressable onPress={() => loadFavorites()} className='px-5 py-2.5' style={{ backgroundColor: colors.primaryMuted, borderRadius: 14 }}>
							<Text className='font-bold text-xs' style={{ color: colors.primary }}>إعادة المحاولة</Text>
						</Pressable>
					</View>
				) : activeTab === 'places' ? (
					<View className='gap-3'>
						{places.length === 0 ? <EmptyState icon='location-outline' title='لا توجد أماكن محفوظة' theme={theme} /> : places.map(place => (
							<Pressable key={place.id} onPress={() => handlePlaceDestination(place)} className='p-4 gap-3' style={theme.components.card}>
								<View className='flex-row items-center gap-3'>
									<View className='w-12 h-12 rounded-2xl items-center justify-center' style={{ backgroundColor: colors.primaryMuted }}>
										<Ionicons name={normalizeIcon(place.icon)} size={23} color={colors.primary} />
									</View>
									<View className='flex-1'>
										<Text className='font-bold text-base' style={{ color: colors.textPrimary }}>{place.name}</Text>
										<Text className='text-xs mt-1' numberOfLines={2} style={{ color: colors.textSecondary }}>{place.address || 'مكان محفوظ على الخريطة'}</Text>
									</View>
									<Ionicons name='navigate-circle' size={25} color={colors.primary} />
								</View>
								<View className='flex-row gap-2 pt-3' style={{ borderTopColor: colors.divider, borderTopWidth: theme.borderWidths.subtle }}>
									<Pressable onPress={event => { event.stopPropagation(); openEdit(place, 'place') }} className='flex-1 flex-row items-center justify-center gap-2 py-2'>
										<Ionicons name='create-outline' size={16} color={colors.primary} />
										<Text className='text-xs font-semibold' style={{ color: colors.primary }}>تعديل</Text>
									</Pressable>
									<Pressable onPress={event => { event.stopPropagation(); confirmDelete(place, 'place') }} className='flex-1 flex-row items-center justify-center gap-2 py-2'>
										<Ionicons name='trash-outline' size={16} color={colors.error} />
										<Text className='text-xs font-semibold' style={{ color: colors.error }}>حذف</Text>
									</Pressable>
								</View>
							</Pressable>
						))}
						
					</View>
				) : (
					<View className='gap-3'>
						{trips.length === 0 ? <EmptyState icon='git-compare-outline' title='لا توجد رحلات محفوظة' theme={theme} /> : trips.map(trip => (
							<View key={trip.id} className='p-4 gap-3' style={theme.components.card}>
								<View className='flex-row items-center gap-3'>
									<View className='w-12 h-12 rounded-2xl items-center justify-center' style={{ backgroundColor: colors.primaryMuted }}>
										<Ionicons name={normalizeIcon(trip.icon)} size={23} color={colors.primary} />
									</View>
									<Text className='flex-1 font-bold text-base' style={{ color: colors.textPrimary }}>{trip.title}</Text>
									<View className='flex-row gap-3'>
										<Pressable onPress={() => openEdit(trip, 'trip')}><Ionicons name='create-outline' size={20} color={colors.iconInactive} /></Pressable>
										<Pressable onPress={() => confirmDelete(trip, 'trip')}><Ionicons name='trash-outline' size={20} color={colors.error} /></Pressable>
									</View>
								</View>

								<View className='gap-2 py-3' style={{ borderTopColor: colors.divider, borderTopWidth: theme.borderWidths.subtle, borderBottomColor: colors.divider, borderBottomWidth: theme.borderWidths.subtle }}>
									<View className='flex-row items-center gap-2'>
										<View className='w-2 h-2 rounded-full' style={{ backgroundColor: colors.success }} />
										<Text className='text-xs flex-1' style={{ color: colors.textSecondary }}>من: {trip.fromName || 'نقطة البداية'}</Text>
									</View>
									<View className='flex-row items-center gap-2'>
										<View className='w-2 h-2 rounded-full' style={{ backgroundColor: colors.error }} />
										<Text className='text-xs flex-1' style={{ color: colors.textSecondary }}>إلى: {trip.toName || 'الوجهة'}</Text>
									</View>
								</View>

								<Pressable onPress={() => requestSavedTrip(trip)} className='items-center py-3' style={{ backgroundColor: colors.primary, borderRadius: 14 }}>
									<Text className='text-sm font-bold' style={{ color: colors.onPrimary }}>طلب الرحلة</Text>
								</Pressable>
								<View className='flex-row gap-2'>
									<Pressable onPress={() => reverseSavedTrip(trip)} className='flex-1 items-center py-3' style={{ backgroundColor: colors.primaryMuted, borderColor: colors.primary, borderWidth: theme.borderWidths.subtle, borderRadius: 14 }}>
										<Text className='text-xs font-bold' style={{ color: colors.primary }}>عكس الاتجاه 🔁</Text>
									</Pressable>
									<Pressable onPress={() => handleTripDestinationOnly(trip)} className='flex-1 items-center py-3' style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: theme.borderWidths.subtle, borderRadius: 14 }}>
										<Text className='text-xs font-bold' style={{ color: colors.textSecondary }}>الوجهة فقط 📍</Text>
									</Pressable>
								</View>
							</View>
						))}
					</View>
				)}
			</ScrollView>

			<Modal transparent visible={Boolean(deleteItem)} animationType='fade' onRequestClose={() => !deleting && setDeleteItem(null)}>
				<Pressable className='flex-1 items-center justify-center px-5' style={{ backgroundColor: colors.backdrop }} onPress={() => !deleting && setDeleteItem(null)}>
					<Pressable className='w-full max-w-md p-5 gap-4' style={theme.components.modal} onPress={event => event.stopPropagation()}>
						<View className='w-14 h-14 self-center items-center justify-center rounded-full' style={{ backgroundColor: colors.errorMuted }}>
							<Ionicons name='trash-outline' size={25} color={colors.error} />
						</View>
						<View className='gap-2'>
							<Text className='text-xl font-bold text-center' style={{ color: colors.textPrimary }}>
								{deleteItem?.type === 'place' ? 'حذف المكان المحفوظ؟' : 'حذف الرحلة المحفوظة؟'}
							</Text>
							<Text className='text-sm text-center leading-6' style={{ color: colors.textSecondary }}>
								{deleteItem?.type === 'place'
									? `هيتم حذف «${deleteItem?.name || ''}» من الأماكن المحفوظة.`
									: `هيتم حذف «${deleteItem?.title || ''}» من الرحلات المحفوظة.`}
							</Text>
						</View>
						<View className='flex-row-reverse gap-3'>
							<Pressable disabled={deleting} onPress={deleteFavorite} className='flex-1 items-center justify-center py-3.5 rounded-2xl' style={{ backgroundColor: colors.error, opacity: deleting ? 0.65 : 1 }}>
								{deleting ? <ActivityIndicator color='#FFFFFF' /> : <Text className='font-bold text-white'>تأكيد الحذف</Text>}
							</Pressable>
							<Pressable disabled={deleting} onPress={() => setDeleteItem(null)} className='flex-1 items-center justify-center py-3.5 rounded-2xl' style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}>
								<Text className='font-bold' style={{ color: colors.textPrimary }}>رجوع</Text>
							</Pressable>
						</View>
					</Pressable>
				</Pressable>
			</Modal>

			<Modal transparent visible={Boolean(editItem)} animationType='fade' onRequestClose={() => setEditItem(null)}>
				<Pressable className='flex-1 items-center justify-center px-5' style={{ backgroundColor: colors.backdrop }} onPress={() => setEditItem(null)}>
					<Pressable className='w-full p-5 gap-4' style={theme.components.modal} onPress={event => event.stopPropagation()}>
						<View className='flex-row justify-between items-center'>
							<Text className='text-lg font-bold' style={{ color: colors.textPrimary }}>تعديل المفضلة</Text>
							<Pressable onPress={() => setEditItem(null)}><Ionicons name='close' size={24} color={colors.iconInactive} /></Pressable>
						</View>
						<TextInput
							value={editName}
							onChangeText={setEditName}
							placeholder='الاسم'
							placeholderTextColor={colors.placeholder}
							className='py-3 text-sm'
							style={theme.components.inputFocused}
						/>
						{editItem?.type === 'place' ? (
							<TextInput
								value={editAddress}
								onChangeText={setEditAddress}
								placeholder='العنوان'
								placeholderTextColor={colors.placeholder}
								className='py-3 text-sm'
								style={theme.components.input}
							/>
						) : null}
						<View className='flex-row flex-wrap gap-2'>
							{FAVORITE_ICONS.map(icon => {
								const active = editIcon === icon
								return (
									<Pressable
										key={icon}
										onPress={() => setEditIcon(icon)}
										className='w-11 h-11 items-center justify-center'
										style={{ backgroundColor: active ? colors.primaryMuted : colors.surfaceElevated, borderColor: active ? colors.primary : colors.border, borderWidth: theme.borderWidths.subtle, borderRadius: 14 }}
									>
										<Ionicons name={icon} size={20} color={active ? colors.primary : colors.iconInactive} />
									</Pressable>
								)
							})}
						</View>
						<Pressable disabled={saving} onPress={saveEdit} className='items-center py-4' style={{ backgroundColor: colors.primary, borderRadius: 16, opacity: saving ? 0.7 : 1 }}>
							{saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text className='font-bold' style={{ color: colors.onPrimary }}>حفظ التعديلات</Text>}
						</Pressable>
					</Pressable>
				</Pressable>
			</Modal>
		</SafeAreaView>
	)
}

export default Favorites
