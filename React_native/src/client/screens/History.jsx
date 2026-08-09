import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SafeAreaView } from 'react-native-safe-area-context'
import Header from '../components/Header'
import client from '../../api/client'
import { useTheme } from '../../theme/useTheme'
import { useDispatch, useSelector } from 'react-redux'
import { setTripHistory } from '../../redux/slices/client/librarySlice'
import { clearCurrentTrip, hydrateCurrentTrip } from '../../redux/slices/client/tripSlice'

const STATUS_MAP = {
	PENDING: { label: 'قيد الانتظار', colorKey: 'warning' },
	BOOKED: { label: 'تم قبول الرحلة', colorKey: 'info' },
	STARTED: { label: 'جارية الآن', colorKey: 'primary' },
	COMPLETED: { label: 'مكتملة', colorKey: 'success' },
	CANCELLED: { label: 'ملغاة', colorKey: 'error' },
}

const formatDateTime = trip => {
	const date = new Date(trip.scheduledTime || trip.createdAt)
	if (Number.isNaN(date.getTime())) return ''
	const day = date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
	const time = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
	return `${day} · ${time}`
}

const getTripDate = trip => new Date(trip.scheduledTime || trip.createdAt)

const FILTERS = {
	status: [
		{ value: 'ALL', label: 'الكل' },
		{ value: 'COMPLETED', label: 'تمت' },
		{ value: 'CANCELLED', label: 'ملغاة' },
	],
	period: [
		{ value: 'ALL', label: 'كل الرحلات' },
		{ value: 'LAST_WEEK', label: 'آخر أسبوع' },
	],
}

const FilterGroup = ({ label, options, value, onChange, colors, borderWidth }) => (
	<View className='flex-row items-center gap-3'>
		<Text className='text-xs font-bold w-12' style={{ color: colors.textSecondary }}>{label}</Text>
		<View className='flex-1 flex-row flex-wrap gap-1.5'>
			{options.map(option => {
				const selected = option.value === value
				return (
					<Pressable
						key={option.value}
						onPress={() => onChange(option.value)}
						accessibilityRole='button'
						accessibilityState={{ selected }}
						className='rounded-full px-3 py-1.5'
						style={{
							backgroundColor: selected ? colors.primary : colors.surface,
							borderColor: selected ? colors.primary : colors.divider,
							borderWidth,
						}}
					>
						<Text className='text-xs font-bold' style={{ color: selected ? colors.onPrimary : colors.textSecondary }}>
							{option.label}
						</Text>
					</Pressable>
				)
			})}
		</View>
	</View>
)

const History = () => {
	const { theme } = useTheme()
	const { colors, shadows: elevation } = theme
	const dispatch = useDispatch()
	const trips = useSelector(state => state.library.tripHistory)
	const historyLoaded = useSelector(state => state.library.historyLoaded)
	const [loading, setLoading] = useState(!historyLoaded)
	const [refreshing, setRefreshing] = useState(false)
	const [error, setError] = useState('')
	const [filtersVisible, setFiltersVisible] = useState(false)
	const [statusFilter, setStatusFilter] = useState('ALL')
	const [periodFilter, setPeriodFilter] = useState('ALL')
	const [filterReferenceTime, setFilterReferenceTime] = useState(0)

	const filteredTrips = useMemo(() => {
		const weekInMilliseconds = 7 * 24 * 60 * 60 * 1000

		return trips.filter(trip => {
			if (statusFilter !== 'ALL' && trip.status !== statusFilter) return false

			const tripDate = getTripDate(trip)
			if (Number.isNaN(tripDate.getTime())) return periodFilter !== 'LAST_WEEK'
			if (periodFilter === 'LAST_WEEK' && (filterReferenceTime - tripDate.getTime() < 0 || filterReferenceTime - tripDate.getTime() > weekInMilliseconds)) return false

			return true
		})
	}, [filterReferenceTime, periodFilter, statusFilter, trips])

	const handlePeriodFilterChange = value => {
		setPeriodFilter(value)
		if (value === 'LAST_WEEK') setFilterReferenceTime(Date.now())
	}

	const loadTrips = useCallback(async ({ silent } = {}) => {
		try {
			if (!silent) setLoading(true)
			setError('')
			const response = await client.get('/client/trips')
			const allTrips = response.data?.data ?? []
			const latestTrip = allTrips[0]
			if (latestTrip && ['PENDING', 'BOOKED', 'STARTED'].includes(latestTrip.status)) dispatch(hydrateCurrentTrip(latestTrip))
			else dispatch(clearCurrentTrip())
			dispatch(setTripHistory(allTrips.filter(trip => ['COMPLETED', 'CANCELLED'].includes(trip.status))))
		} catch {
			setError('تعذر تحميل رحلاتك السابقة حالياً')
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}, [dispatch])

	useEffect(() => {
		if (historyLoaded) return
		const timer = setTimeout(loadTrips, 0)
		return () => clearTimeout(timer)
	}, [historyLoaded, loadTrips])

	const handleRefresh = () => {
		setRefreshing(true)
		loadTrips({ silent: true })
	}

	const renderTrip = ({ item: trip }) => {
		const status = STATUS_MAP[trip.status] ?? { label: trip.status, colorKey: 'textMuted' }
		const showPrice = Number(trip.price) > 0 && trip.status === 'COMPLETED'
		return (
			<View className='rounded-2xl p-4 gap-3 mb-3.5' style={{ backgroundColor: colors.surface, ...elevation.card }}>
				<View className='flex-row justify-between items-center'>
					<Text className='text-xs' style={{ color: colors.textSecondary }}>{formatDateTime(trip)}</Text>
					<Text className='text-xs font-bold' style={{ color: colors[status.colorKey] }}>{status.label}</Text>
				</View>
				<View className='gap-1.5'>
					<Text className='text-sm' style={{ color: colors.textPrimary }}>من: {trip.startName || '—'}</Text>
					<Text className='text-sm' style={{ color: colors.textPrimary }}>إلى: {trip.endName || '—'}</Text>
				</View>
				<View className='flex-row justify-between items-center pt-2.5' style={{ borderTopColor: colors.divider, borderTopWidth: theme.borderWidths.subtle }}>
					<Text className='text-xs' style={{ color: colors.textSecondary }}>{trip.driver ? `${trip.driver.name}${trip.driver.car ? ` · ${trip.driver.car.model}` : ''}` : 'لسه معندناش سائق'}</Text>
					{showPrice ? <Text className='font-bold text-sm' style={{ color: colors.textPrimary }}>{trip.price} ج.م</Text> : <View />}
				</View>
			</View>
		)
	}

	return (
		<View className='flex-1 z-0' style={{ backgroundColor: colors.background }}>
			<Header />
			<SafeAreaView className='flex-1 z-10' edges={['bottom']} dir='rtl'>
				<FlatList
					data={loading || error ? [] : filteredTrips}
					renderItem={renderTrip}
					keyExtractor={trip => String(trip.id)}
					contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 110, flexGrow: 1 }}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
					ListHeaderComponent={(
					<View className='flex-row items-center justify-between mb-5'>
						<View>
							<Text className='text-2xl font-bold' style={{ color: colors.textPrimary }}>رحلاتي السابقة</Text>
							<Text className='text-xs mt-1' style={{ color: colors.textSecondary }}>{trips.length} رحلة إجماليًا</Text>
						</View>
						<Pressable onPress={() => setFiltersVisible(true)} hitSlop={6} className='flex-row items-center justify-center gap-2 px-5 py-3 rounded-full' style={{ minHeight: 48, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}>
							<Ionicons name='options-outline' size={20} color={colors.primary} />
							<Text className='text-sm font-bold' style={{ color: colors.textPrimary }}>فلترة</Text>
							{statusFilter !== 'ALL' || periodFilter !== 'ALL' ? <View className='w-2 h-2 rounded-full' style={{ backgroundColor: colors.primary }} /> : null}
						</Pressable>
					</View>
					)}
					ListEmptyComponent={loading ? (
						<View className='rounded-2xl p-4 items-center justify-center py-12' style={theme.components.card}>
							<ActivityIndicator color={colors.primary} />
						</View>
					) : error ? (
						<View className='items-center justify-center py-16'>
							<Text className='text-sm' style={{ color: colors.textSecondary }}>{error}</Text>
						</View>
					) : (
						<View className='rounded-2xl p-4 items-center justify-center py-12' style={{ backgroundColor: colors.surface, ...elevation.card }}>
							<Text className='text-sm' style={{ color: colors.textSecondary }}>
								{trips.length === 0 ? 'لا توجد رحلات حتى الآن' : 'لا توجد رحلات تطابق الفلاتر المختارة'}
							</Text>
						</View>
					)}
				/>

				<Modal transparent visible={filtersVisible} animationType='slide' onRequestClose={() => setFiltersVisible(false)}>
					<Pressable className='flex-1 justify-end' style={{ backgroundColor: colors.backdrop }} onPress={() => setFiltersVisible(false)}>
						<Pressable className='rounded-t-3xl p-5 gap-5 pb-8' style={{ backgroundColor: colors.surface, ...elevation.floating }} onPress={event => event.stopPropagation()}>
							<View className='flex-row items-center justify-between'>
								<Text className='text-lg font-bold' style={{ color: colors.textPrimary }}>فلترة الرحلات</Text>
								<Pressable onPress={() => setFiltersVisible(false)} hitSlop={8}><Ionicons name='close' size={23} color={colors.iconInactive} /></Pressable>
							</View>
							<FilterGroup label='الحالة' options={FILTERS.status} value={statusFilter} onChange={setStatusFilter} colors={colors} borderWidth={theme.borderWidths.subtle} />
							<FilterGroup label='الفترة' options={FILTERS.period} value={periodFilter} onChange={handlePeriodFilterChange} colors={colors} borderWidth={theme.borderWidths.subtle} />
							<Pressable onPress={() => setFiltersVisible(false)} className='items-center py-3.5 rounded-2xl' style={{ backgroundColor: colors.primary }}>
								<Text className='font-bold' style={{ color: colors.onPrimary }}>عرض النتائج ({filteredTrips.length})</Text>
							</Pressable>
						</Pressable>
					</Pressable>
				</Modal>
			</SafeAreaView>
		</View>
	)
}

export default History
