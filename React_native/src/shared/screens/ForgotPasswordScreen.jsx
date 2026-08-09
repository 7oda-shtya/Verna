import React, { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { requestOtpRequest } from '../../api/auth.api'
import { useTheme } from '../../theme/useTheme'
import { useSelector } from 'react-redux'
import AuthBackdrop from '../components/AuthBackdrop'

function normalizeEgyptianPhone(value) {
	const digits = value.replace(/\D/g, '')
	const local = digits.startsWith('20') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits
	return /^(10|11|12|15)\d{8}$/.test(local) ? `+20${local}` : null
}

export default function ForgotPasswordScreen({ navigation, route }) {
	const { theme } = useTheme()
	const accountPhone = useSelector(state => state.auth.phone)
	const accountMode = Boolean(route?.params?.accountMode)
	const { colors } = theme
	const [phoneInput, setPhoneInput] = useState(accountMode ? accountPhone || '' : '')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const requestCode = async () => {
		const phone = normalizeEgyptianPhone(phoneInput)
		if (!phone) {
			setError('أدخل رقم هاتف مصري صحيح')
			return
		}
		setLoading(true)
		setError('')
		try {
			await requestOtpRequest(phone, 'PASSWORD_RESET')
			navigation.navigate('OtpVerification', { phone, accountMode })
		} catch (requestError) {
			setError(requestError.response?.data?.message || 'تعذر إرسال رمز استعادة كلمة السر')
		} finally {
			setLoading(false)
		}
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<AuthBackdrop>
				<KeyboardAvoidingView style={{ flex: 1, justifyContent: 'center', padding: 24 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
					<View style={{ ...theme.components.card, width: '100%', maxWidth: 448, alignSelf: 'center', padding: 22, gap: 16, backgroundColor: colors.overlay, borderRadius: 20 }}>
						<Pressable onPress={() => navigation.goBack()} style={{ alignSelf: 'flex-start' }}>
							<Ionicons name='arrow-back' size={24} color={colors.textPrimary} />
						</Pressable>
						<Text style={{ color: colors.textPrimary, fontSize: 25, fontWeight: '800', textAlign: 'center' }}>استعادة كلمة السر</Text>
						<Text style={{ color: colors.textSecondary, textAlign: 'center' }}>اكتب رقم الهاتف المسجل بحسابك</Text>
						{error ? <Text style={{ color: colors.error, textAlign: 'center' }}>{error}</Text> : null}
						<TextInput
							value={phoneInput}
							onChangeText={value => { setPhoneInput(value); if (error) setError('') }}
							keyboardType='phone-pad'
							placeholder='01xxxxxxxxx'
							placeholderTextColor={colors.placeholder}
							style={{ ...theme.components.input, color: colors.textPrimary, height: 54, textAlign: 'right', writingDirection: 'ltr' }}
						/>
						<Pressable disabled={loading} onPress={requestCode} style={{ ...theme.components.primaryButton, padding: 16, opacity: loading ? 0.65 : 1 }}>
							{loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ ...theme.components.primaryButtonText, textAlign: 'center' }}>إرسال رمز الاستعادة</Text>}
						</Pressable>
					</View>
				</KeyboardAvoidingView>
			</AuthBackdrop>
		</SafeAreaView>
	)
}
