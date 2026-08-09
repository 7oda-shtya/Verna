import React, { useEffect } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useDispatch } from 'react-redux'
import { useTheme } from '../../theme/useTheme'
import { updateClientInfo } from '../../redux/slices/client/authSlice'
import { getMeRequest } from '../../api/auth.api'
import { KycDocumentsForm } from '../../driver/screens/KycUpload'

const DriverAccountPendingScreen = () => {
	const dispatch = useDispatch()
	const { theme } = useTheme()
	const { colors } = theme

	useEffect(() => {
		getMeRequest()
			.then(response => dispatch(updateClientInfo(response.data?.data?.user || {})))
			.catch(() => {})
	}, [dispatch])

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<StatusBar style={theme.statusBarStyle} />
			<ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
				<View style={{ alignItems: 'center', gap: 10, padding: 20, borderRadius: 20, backgroundColor: colors.overlay, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}>
					<Ionicons name='time-outline' size={44} color={colors.primary} />
					<Text style={{ ...theme.typography.title, color: colors.textPrimary, textAlign: 'center' }}>حسابك تحت المراجعة</Text>
					<Text style={{ ...theme.typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
						أكمل رفع المستندات المطلوبة تحت، وهنراجع حسابك ونفعّله بمجرد اكتمال المراجعة.
					</Text>
				</View>

				<KycDocumentsForm />
			</ScrollView>
		</SafeAreaView>
	)
}

export default DriverAccountPendingScreen
