import React from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../theme/useTheme'
import { getBanReasonText } from '../../utils/reputation'

export const ReputationDetailsModal = ({ visible, onClose, reputation, banReason }) => {
	const { theme } = useTheme()
	const { colors } = theme
	const color = colors[reputation.colorKey] ?? colors.textMuted
	const cancellationDiscount = reputation.cancelledTrips * 2
	const reportsDiscount = reputation.acceptedReports * 10
	const hasDiscounts = cancellationDiscount > 0 || reportsDiscount > 0

	return (
		<Modal transparent visible={visible} animationType='slide' onRequestClose={onClose}>
			<Pressable className='flex-1 justify-end' style={{ backgroundColor: colors.backdrop }} onPress={onClose}>
				<Pressable className='rounded-t-3xl p-5 pb-8 gap-4' style={theme.components.modal} onPress={event => event.stopPropagation()}>
					<View className='flex-row items-center justify-between'>
						<Text className='text-lg font-bold' style={{ color: colors.textPrimary }}>تفاصيل السمعة</Text>
						<Pressable onPress={onClose} hitSlop={8}><Ionicons name='close' size={24} color={colors.iconInactive} /></Pressable>
					</View>

					{reputation.isNew ? (
						<View className='rounded-2xl p-4 flex-row items-center gap-2' style={{ backgroundColor: colors.surfaceElevated }}>
							<Ionicons name='information-circle-outline' size={22} color={colors.textMuted} />
							<Text className='flex-1 text-sm' style={{ color: colors.textSecondary }}>السمعة بتتحدد بعد أول 3 رحلات.</Text>
						</View>
					) : (
						<View className='gap-3'>
							<Text className='text-sm font-bold' style={{ color: colors.textPrimary }}>نقطة البداية: 100%</Text>
							{reputation.cancelledTrips > 0 ? <DetailRow label={`رحلات ملغاة آخر 30 يوم (${reputation.cancelledTrips})`} value={`-${cancellationDiscount}%`} colors={colors} /> : null}
							{reputation.acceptedReports > 0 ? <DetailRow label={`بلاغات مقبولة (${reputation.acceptedReports})`} value={`-${reportsDiscount}%`} colors={colors} /> : null}
							{!hasDiscounts ? <Text className='text-sm text-center py-3' style={{ color: colors.success }}>مفيش أي خصومات عليك، استمر كده!</Text> : null}
							<View className='rounded-2xl p-4 flex-row items-center justify-between' style={{ backgroundColor: colors.surfaceElevated }}>
								<Text className='text-sm font-bold' style={{ color }}>السمعة الحالية: {reputation.score}% — {reputation.label}</Text>
							</View>
						</View>
					)}

					{banReason === 'REPUTATION_AND_RAPID_CANCELLATION' ? <Text className='text-xs' style={{ color: colors.error }}>سببَا الإيقاف فعالان: {getBanReasonText(banReason)}.</Text> : null}
				</Pressable>
			</Pressable>
		</Modal>
	)
}

const DetailRow = ({ label, value, colors }) => (
	<View className='flex-row items-center justify-between rounded-2xl px-4 py-3' style={{ backgroundColor: colors.surfaceElevated }}>
		<Text className='text-sm' style={{ color: colors.textSecondary }}>{label}</Text>
		<Text className='text-sm font-bold' style={{ color: colors.error }}>{value}</Text>
	</View>
)

export const TemporaryBanBanner = ({ user, onShowDetails }) => {
	const { theme } = useTheme()
	const { colors } = theme
	if (!user?.isBanned || !user?.banEndAt) return null
	const rapidOnly = user.banReason === 'RAPID_CANCELLATION'
	const message = rapidOnly
		? 'تم إيقاف حسابك مؤقتًا بسبب إلغاء عدد كبير من الرحلات خلال فترة قصيرة'
		: 'حسابك موقوف مؤقتًا بسبب انخفاض تقييم السمعة'
	const endDate = new Date(user.banEndAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })

	return (
		<View className='rounded-2xl p-4 gap-2' style={{ backgroundColor: colors.errorMuted, borderColor: colors.error, borderWidth: theme.borderWidths.subtle }}>
			<View className='flex-row items-start gap-2'>
				<Ionicons name='ban-outline' size={21} color={colors.error} />
				<Text className='flex-1 text-sm font-bold' style={{ color: colors.error }}>{message}</Text>
			</View>
			<Text className='text-xs' style={{ color: colors.textSecondary }}>هيتم رفع الإيقاف يوم {endDate}</Text>
			<Pressable onPress={onShowDetails} hitSlop={6} className='self-start py-1'>
				<Text className='text-xs font-bold' style={{ color: colors.error }}>ليه حصل الإيقاف؟</Text>
			</Pressable>
		</View>
	)
}
