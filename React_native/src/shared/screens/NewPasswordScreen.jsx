import React, { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useDispatch } from 'react-redux'
import { resetPasswordRequest } from '../../api/auth.api'
import { logout } from '../../redux/slices/client/authSlice'
import { useTheme } from '../../theme/useTheme'
import AuthBackdrop from '../components/AuthBackdrop'

const PasswordField = ({ label, value, onChangeText, secure, onToggle, colors, theme }) => (
	<View style={{ gap: 7 }}>
		<Text style={{ color: colors.textSecondary, textAlign: 'right' }}>{label}</Text>
		<View style={{ ...theme.components.input, height: 54, flexDirection: 'row', alignItems: 'center' }}>
			<TextInput value={value} onChangeText={onChangeText} secureTextEntry={secure} placeholder={label} placeholderTextColor={colors.placeholder} autoCapitalize='none' style={{ flex: 1, color: colors.textPrimary, textAlign: 'right' }} />
			<Pressable onPress={onToggle} hitSlop={8}><Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textSecondary} /></Pressable>
		</View>
	</View>
)

export default function NewPasswordScreen({ navigation, route }) {
	const { theme } = useTheme()
	const { colors } = theme
	const dispatch = useDispatch()
	const { phone, code, accountMode } = route?.params || {}
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [securePassword, setSecurePassword] = useState(true)
	const [secureConfirm, setSecureConfirm] = useState(true)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const handleBack = () => {
		if (navigation.canGoBack()) {
			navigation.goBack()
			return
		}

		navigation.reset({
			index: 0,
			routes: [{ name: accountMode ? 'ClientTabs' : 'Login' }],
		})
	}

	const submit = async () => {
		if (newPassword.length < 8) {
			setError('كلمة السر الجديدة لازم تكون 8 أحرف على الأقل')
			return
		}
		if (newPassword !== confirmPassword) {
			setError('كلمتا السر الجديدتان غير متطابقتين')
			return
		}
		setLoading(true)
		setError('')
		try {
			await resetPasswordRequest(phone, code, newPassword)
			if (accountMode) await dispatch(logout()).unwrap()
			else navigation.replace('Login', { confirmation: 'تم تغيير كلمة السر بنجاح. يمكنك تسجيل الدخول الآن.' })
		} catch (resetError) {
			setError(resetError.response?.data?.message || 'تعذر تغيير كلمة السر')
		} finally {
			setLoading(false)
		}
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<AuthBackdrop>
				<KeyboardAvoidingView style={{ flex: 1, justifyContent: 'center', padding: 24 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
					<View style={{ ...theme.components.card, width: '100%', maxWidth: 448, alignSelf: 'center', padding: 22, gap: 16, backgroundColor: colors.overlay, borderRadius: 20 }}>
						<Pressable disabled={loading} onPress={handleBack} style={{ alignSelf: 'flex-start' }}><Ionicons name='arrow-back' size={24} color={colors.textPrimary} /></Pressable>
						<Text style={{ color: colors.textPrimary, fontSize: 25, fontWeight: '800', textAlign: 'center' }}>كلمة السر الجديدة</Text>
						<Text style={{ color: colors.textSecondary, textAlign: 'center' }}>اختر كلمة سر قوية لحسابك</Text>
						<PasswordField label='كلمة السر الجديدة' value={newPassword} onChangeText={value => { setNewPassword(value); if (error) setError('') }} secure={securePassword} onToggle={() => setSecurePassword(value => !value)} colors={colors} theme={theme} />
						<PasswordField label='تأكيد كلمة السر الجديدة' value={confirmPassword} onChangeText={value => { setConfirmPassword(value); if (error) setError('') }} secure={secureConfirm} onToggle={() => setSecureConfirm(value => !value)} colors={colors} theme={theme} />
						{error ? <Text style={{ color: colors.error, textAlign: 'center' }}>{error}</Text> : null}
						<Pressable disabled={loading} onPress={submit} style={{ ...theme.components.primaryButton, padding: 16, opacity: loading ? 0.65 : 1 }}>
							{loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ ...theme.components.primaryButtonText, textAlign: 'center' }}>تعيين كلمة السر الجديدة</Text>}
						</Pressable>
					</View>
				</KeyboardAvoidingView>
			</AuthBackdrop>
		</SafeAreaView>
	)
}
