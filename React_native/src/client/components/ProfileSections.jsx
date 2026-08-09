import React, { useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { SentRates, ReceivedRates, SentReports, ReceivedReports } from './Sections'
import { useTheme } from '../../theme/useTheme'
import { Ionicons } from '@expo/vector-icons'
import { requireOptionalNativeModule } from 'expo-modules-core'

const NativeClipboard = requireOptionalNativeModule('ExpoClipboard')

const ProfileSections = ({ selectedSection }) => {
	const client = useSelector((state) => state.auth?.user || state.auth || {})
	const { theme } = useTheme()
	const { colors } = theme
	const segmentStyle = active => ({
		backgroundColor: active ? colors.primaryMuted : 'transparent',
		borderRadius: 13,
	})
	const segmentTextStyle = active => ({
		...theme.typography.caption,
		color: active ? colors.primary : colors.textSecondary,
	})
	const {
		rates = { sent: [], received: [] },
		reports = { sent: [], received: [] },
		coupons = [],
		referrals = []
	} = client

	const [ratesDirection, setRatesDirection] = useState('sent')
	const [reportsDirection, setReportsDirection] = useState('sent')
	const [copied, setCopied] = useState(false)

	const sentRates = rates?.sent || []
	const receivedRates = rates?.received || []
	const sentReports = reports?.sent || []
	const receivedReports = reports?.received || []
	const referralCode = client.referralCode?.trim() || null

	const copyReferralCode = async () => {
		if (!referralCode) return
		if (!NativeClipboard?.setStringAsync) {
			Alert.alert('تعذر النسخ', 'نسخة التطبيق الحالية لا تحتوي وحدة النسخ. ثبّت أحدث APK ثم حاول مرة أخرى.')
			return
		}
		try {
			await NativeClipboard.setStringAsync(referralCode, {})
			setCopied(true)
			setTimeout(() => setCopied(false), 1600)
		} catch {
			Alert.alert('تعذر النسخ', 'لم نتمكن من نسخ الكود. حاول مرة أخرى.')
		}
	}

	return (
		<View className='w-full py-2'>
			{selectedSection === 'rates' ? (
				<View className='w-full space-y-4'>
					<View className='flex-row p-1 mb-2' style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: theme.borderWidths.subtle, borderRadius: 17 }}>
						<Pressable
							onPress={() => setRatesDirection('sent')}
							className='flex-1 px-2 py-2 items-center'
							style={segmentStyle(ratesDirection === 'sent')}
						>
							<Text style={segmentTextStyle(ratesDirection === 'sent')}>
								التقييمات المرسلة ({sentRates.length})
							</Text>
						</Pressable>
						<Pressable
							onPress={() => setRatesDirection('received')}
							className='flex-1 px-2 py-2 items-center'
							style={segmentStyle(ratesDirection === 'received')}
						>
							<Text style={segmentTextStyle(ratesDirection === 'received')}>
								التقييمات المستلمة ({receivedRates.length})
							</Text>
						</Pressable>
					</View>

					{ratesDirection === 'sent' ? (
						<SentRates rates={sentRates} />
					) : (
						<ReceivedRates rates={receivedRates} />
					)}
				</View>
			) : selectedSection === 'reports' ? (
				<View className='w-full space-y-4'>
					<View className='flex-row p-1 mb-2' style={{ backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: theme.borderWidths.subtle, borderRadius: 17 }}>
						<Pressable
							onPress={() => setReportsDirection('sent')}
							className='flex-1 px-2 py-2 items-center'
							style={segmentStyle(reportsDirection === 'sent')}
						>
							<Text style={segmentTextStyle(reportsDirection === 'sent')}>
								البلاغات المرسلة ({sentReports.length})
							</Text>
						</Pressable>
						<Pressable
							onPress={() => setReportsDirection('received')}
							className='flex-1 px-2 py-2 items-center'
							style={segmentStyle(reportsDirection === 'received')}
						>
							<Text style={segmentTextStyle(reportsDirection === 'received')}>
								البلاغات المستلمة ({receivedReports.length})
							</Text>
						</Pressable>
					</View>

					{reportsDirection === 'sent' ? (
						<SentReports reports={sentReports} />
					) : (
						<ReceivedReports reports={receivedReports} />
					)}
				</View>
			) : selectedSection === 'coupons' ? (
				<View className='w-full py-4 items-center'>
					{coupons.length === 0 ? (
						<Text className='py-6 text-center' style={{ ...theme.typography.body, color: colors.textMuted }}>لا توجد كوبونات خصم متاحة حالياً</Text>
					) : (
						coupons.map((coupon, index) => (
							<View key={coupon.id || index} className='w-full p-4 rounded-2xl mb-3 flex-row justify-between items-center' style={theme.components.cardElevated}>
								<Text className='font-medium' style={{ color: colors.textPrimary }}>{coupon.code || coupon.name || `كوبون خصم #${index + 1}`}</Text>
								<Text style={{ ...theme.typography.caption, fontWeight: '700', color: colors.warning }}>{coupon.discount || 'خصم 10%'}</Text>
							</View>
						))
					)}
				</View>
			) : (
				<View className='w-full py-4 items-center'>
					<View className='w-full p-5 rounded-2xl items-center gap-2' style={theme.components.cardElevated}>
						<Text style={{ ...theme.typography.subtitle, color: colors.textSecondary }}>كود الدعوة الخاص بك</Text>
						{referralCode ? <View className='flex-row items-center gap-2'>
							<Text className='tracking-widest px-4 py-2 rounded-xl' style={{ ...theme.typography.title, color: colors.warning, backgroundColor: colors.inputBackground, borderColor: colors.warning, borderWidth: theme.borderWidths.subtle, writingDirection: 'ltr' }}>
								{referralCode}
							</Text>
							<Pressable onPress={copyReferralCode} hitSlop={6} accessibilityLabel='نسخ كود الدعوة' className='w-11 h-11 rounded-xl items-center justify-center' style={{ backgroundColor: copied ? colors.successMuted : colors.primaryMuted, borderColor: copied ? colors.success : colors.primary, borderWidth: theme.borderWidths.subtle }}>
								<Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={copied ? colors.success : colors.primary} />
							</Pressable>
						</View> : <Text className='text-sm py-3' style={{ color: colors.textMuted }}>جاري تحميل الكود...</Text>}
						{copied ? <Text className='text-xs font-bold' style={{ color: colors.success }}>تم نسخ الكود</Text> : null}
						{referrals.length === 0 ? (
							<Text className='text-center mt-1' style={{ ...theme.typography.caption, color: colors.textMuted }}>
								لسه محدش استخدم كودك — شاركه مع أصدقائك
							</Text>
						) : (
							<Text className='text-center mt-1' style={{ ...theme.typography.caption, color: colors.textMuted }}>
								شارك الكود مع أصدقائك للحصول على خصومات للرحلات القادمة!
							</Text>
						)}
					</View>

					{referrals.length > 0 ? (
						<View className='w-full mt-3'>
							{referrals.map((referral, index) => (
								<View key={referral.id || index} className='w-full p-4 rounded-2xl mb-3' style={theme.components.cardElevated}>
									<Text style={{ ...theme.typography.caption, color: colors.textPrimary }}>{referral.name || `مستخدم دعوته #${index + 1}`}</Text>
								</View>
							))}
						</View>
					) : null}
				</View>
			)}
		</View>
	)
}

export default ProfileSections
