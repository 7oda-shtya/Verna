import { useState, useEffect } from 'react'
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { searchPlaceRequest } from '../../services/place.service'
import { useTheme } from '../../../theme/useTheme'
import { TourTarget } from '../../../tour'

const SearchBox = ({ active, onSelect }) => {
	const [query, setQuery] = useState('')
	const [results, setResults] = useState([])
	const [loading, setLoading] = useState(false)
	const { theme } = useTheme()
	const { colors } = theme

	useEffect(() => {
		if (!active || query.trim().length < 2) {
			// Reset derived search state immediately when the search is unavailable.
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setResults([])
			setLoading(false)
			return
		}

		setLoading(true)
		const timer = setTimeout(() => {
			// إرسال طلب البحث مع حد 10 نتائج
			searchPlaceRequest(query, 10)
				.then(res => {
					const data = res.data?.data || res.data || []
					// التأكد من أخذ أول 10 نتائج فقط
					setResults(data.slice(0, 10))
				})
				.catch(() => setResults([]))
				.finally(() => setLoading(false))
		}, 400)

		return () => clearTimeout(timer)
	}, [query, active])

	useEffect(() => {
		if (!active) {
			// Clear the transient query whenever this search box becomes inactive.
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setQuery('')
			setResults([])
			setLoading(false)
		}
	}, [active])

	if (!active) return null

	return (
		<View className='px-3 py-2' style={{ backgroundColor: colors.surface, borderTopColor: colors.divider, borderTopWidth: theme.borderWidths.subtle }}>
			<View className='relative justify-center'>
				<TextInput
					value={query}
					onChangeText={setQuery}
					placeholder='اكتب اسم المكان، أو حدد من الخريطة مباشرة'
					placeholderTextColor={colors.placeholder}
					className='rounded-lg px-3 py-2 pl-9'
					style={{ ...theme.components.input, ...theme.typography.body }}
				/>
				{loading && (
					<ActivityIndicator size='small' color={colors.primary} className='absolute left-3' />
				)}
			</View>

			{results.map(place => (
				<Pressable
					key={place.id || place._id}
					onPress={() => onSelect(place)}
					className='py-2.5 flex-row items-center gap-2'
					style={{ borderBottomColor: colors.divider, borderBottomWidth: theme.borderWidths.subtle }}
				>
					<Ionicons name='location-outline' size={16} color={colors.iconInactive} />
					<Text className='flex-1' style={{ ...theme.typography.caption, color: colors.textPrimary }}>{place.name}</Text>
				</Pressable>
			))}
		</View>
	)
}

const PickerRow = ({ dotColor, placeholder, name, isActive, onPick, onSelect, onDelete, onDotLayout, tourId, targetId }) => {
	const { theme } = useTheme()
	const { colors } = theme
	const row = (
		<Pressable onPress={onPick} className='flex-1 flex-row items-center gap-3 p-3'>
			<View
				className='w-2 h-2 rounded-full'
				style={{ backgroundColor: dotColor }}
				onLayout={onDotLayout ? e => onDotLayout(e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2) : undefined}
			/>
			<Text numberOfLines={1} style={{ ...theme.typography.subtitle, color: colors.textPrimary }}>{name || placeholder}</Text>
		</Pressable>
	)
	return (
	<View style={isActive ? { backgroundColor: colors.primaryMuted } : undefined}>
		<View className='flex-row items-center gap-2' style={{ borderBottomColor: colors.divider, borderBottomWidth: theme.borderWidths.subtle }}>
			{tourId && targetId ? <TourTarget tourId={tourId} targetId={targetId} asChild>{row}</TourTarget> : row}
			{onDelete && (
				<Pressable onPress={onDelete} className='w-7 h-7 items-center justify-center'>
					<Ionicons name='trash-outline' size={16} color={colors.error} />
				</Pressable>
			)}
		</View>
		<SearchBox active={isActive} onSelect={onSelect} />
	</View>
	)
}

const TripPickerPanel = ({
	startPin, endPin, waypointPins, pickTarget, activeWaypointIndex, tourId,
	onPickStart, onPickEnd, onPickWaypoint, onAddNewWaypoint, onDeleteWaypoint,
	onSelectStart, onSelectEnd, onSelectWaypoint, canAddWaypoint = true,
}) => {
	// نستخدم هذا لرسم خط منقط يربط بصرياً بين نقطة الانطلاق ونقطة الوصول
	const [startDotY, setStartDotY] = useState(null)
	const [endDotY, setEndDotY] = useState(null)
	const { theme } = useTheme()
	const { colors } = theme

	const showConnector = startDotY != null && endDotY != null

	return (
		<View className='absolute top-16 left-24 right-24 rounded-2xl overflow-hidden shadow-lg z-10' style={theme.components.cardElevated}>
			<View className='relative'>
				{showConnector && (
					<View
						pointerEvents='none'
						style={{
							position: 'absolute',
							left: 12 + 4 - 1,
							top: startDotY,
							height: Math.max(endDotY - startDotY, 0),
							width: 0,
							borderLeftWidth: 2,
							borderStyle: 'dashed',
							borderColor: colors.borderFocused,
						}}
					/>
				)}

				<PickerRow
					dotColor='#34d399' placeholder='منين؟' name={startPin?.name}
					isActive={pickTarget === 'start'}
					onPick={onPickStart}
					onSelect={onSelectStart}
					tourId={tourId}
					targetId='startPin'
					onDotLayout={y => setStartDotY(y)}
				/>

				{waypointPins.map((wp, i) => (
					<PickerRow
						key={i}
						dotColor='#60a5fa' placeholder={`محطة ${i + 1}`} name={wp?.name}
						isActive={pickTarget === 'waypoint' && activeWaypointIndex === i}
						onPick={() => onPickWaypoint(i)}
						onSelect={place => onSelectWaypoint(i, place)}
						onDelete={() => onDeleteWaypoint(i)}
					/>
				))}

				<PickerRow
					dotColor='#f87171' placeholder='رايح فين؟' name={endPin?.name}
					isActive={pickTarget === 'end'}
					onPick={onPickEnd}
					onSelect={onSelectEnd}
					tourId={tourId}
					targetId='endPin'
					onDotLayout={y => setEndDotY(y)}
				/>
			</View>

			{tourId ? <TourTarget tourId={tourId} targetId='addWaypoint' asChild>{
				<Pressable
					onPress={onAddNewWaypoint}
					disabled={!canAddWaypoint}
					className='flex-row items-center justify-center gap-2 py-3'
					style={{ opacity: canAddWaypoint ? 1 : 0.4, borderTopColor: colors.divider, borderTopWidth: theme.borderWidths.subtle }}
				>
					<Ionicons name='add-circle-outline' size={18} color={colors.info} />
					<Text style={{ ...theme.typography.body, color: colors.info }}>إضافة نقطة وسيطة</Text>
				</Pressable>
			}</TourTarget> : (
				<Pressable
					onPress={onAddNewWaypoint}
					disabled={!canAddWaypoint}
					className='flex-row items-center justify-center gap-2 py-3'
					style={{ opacity: canAddWaypoint ? 1 : 0.4, borderTopColor: colors.divider, borderTopWidth: theme.borderWidths.subtle }}
				>
					<Ionicons name='add-circle-outline' size={18} color={colors.info} />
					<Text style={{ ...theme.typography.body, color: colors.info }}>إضافة نقطة وسيطة</Text>
				</Pressable>
			)}
		</View>
	)
}

export default TripPickerPanel
