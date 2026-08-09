import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, InteractionManager, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { requestOtpRequest, verifyOtpRequest } from '../../api/auth.api'
import { useTheme } from '../../theme/useTheme'
import AuthBackdrop from '../components/AuthBackdrop'

const CODE_LENGTH = 6
const PHONE_VERIFICATION = 'PHONE_VERIFICATION'

export default function OtpVerificationScreen({ navigation, route, phone: phoneProp, purpose: purposeProp, onVerified }) {
	const { theme } = useTheme()
	const { colors } = theme
	const phone = phoneProp || route?.params?.phone
	const purpose = purposeProp || PHONE_VERIFICATION === route?.params?.purpose ? PHONE_VERIFICATION : 'PASSWORD_RESET'
	const accountMode = Boolean(route?.params?.accountMode)
	const shouldRequestOnMount = purpose === PHONE_VERIFICATION
	const inputRef = useRef(null)
	const requestedOnMount = useRef(false)
	const verifying = useRef(false)
	const [code, setCode] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [notice, setNotice] = useState('')
	const [cooldown, setCooldown] = useState(shouldRequestOnMount ? 0 : 30)

	const focusInput = () => {
		if (!loading) inputRef.current?.focus()
	}

	const requestCode = async () => {
		if (!phone || loading || cooldown > 0) return
		setLoading(true)
		setError('')
		try {
			await requestOtpRequest(phone, purpose)
			setNotice('تم إرسال رمز تحقق جديد إلى رقم هاتفك')
			setCooldown(45)
			requestAnimationFrame(focusInput)
		} catch (requestError) {
			setError(requestError.response?.data?.message || 'تعذر إرسال رمز التحقق')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		const interaction = InteractionManager.runAfterInteractions(focusInput)
		return () => interaction.cancel()
	}, [])

	useEffect(() => {
		if (!shouldRequestOnMount || requestedOnMount.current) return
		requestedOnMount.current = true
		requestCode()
	}, [shouldRequestOnMount])

	useEffect(() => {
		if (!cooldown) return undefined
		const timer = setInterval(() => setCooldown(value => Math.max(0, value - 1)), 1000)
		return () => clearInterval(timer)
	}, [cooldown])

	const verifyCode = async value => {
		if (verifying.current || value.length !== CODE_LENGTH) return
		verifying.current = true
		setLoading(true)
		setError('')
		try {
			await verifyOtpRequest(phone, value, purpose)
			if (onVerified) {
				onVerified(value)
				return
			}
			navigation?.replace('NewPassword', { phone, code: value, accountMode })
		} catch (verifyError) {
			setCode('')
			setError(verifyError.response?.data?.message || 'رمز التحقق غير صحيح أو منتهي')
			requestAnimationFrame(focusInput)
		} finally {
			verifying.current = false
			setLoading(false)
		}
	}

	const handleCodeChange = value => {
		if (loading) return
		const nextCode = value.replace(/\D/g, '').slice(0, CODE_LENGTH)
		setCode(nextCode)
		setError('')
		setNotice('')
		if (nextCode.length === CODE_LENGTH) verifyCode(nextCode)
	}

	const isPhoneVerification = purpose === PHONE_VERIFICATION

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#050506' }}>
			<AuthBackdrop>
				<KeyboardAvoidingView style={styles.keyboardAvoidingView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
					<View style={styles.header}>
						<Text style={styles.headerTitle}>OTP Verification</Text>
						<Text style={styles.headerAccent}>V2</Text>
					</View>

					<View style={[styles.card, { borderColor: colors.border, backgroundColor: '#151518' }]}>
						{navigation?.canGoBack?.() && !isPhoneVerification ? (
							<Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
								<Ionicons name='arrow-back' size={25} color={colors.textPrimary} />
							</Pressable>
						) : null}
						<View style={styles.handle} />
						<Text style={[styles.title, { color: colors.textPrimary }]}>{isPhoneVerification ? 'تأكيد رقم الهاتف' : 'تأكيد الرمز'}</Text>
						<Text style={[styles.description, { color: colors.textSecondary }]}>أدخل رمز التحقق المكون من 6 أرقام المرسل إلى</Text>
						<Text style={[styles.phone, { color: colors.textPrimary }]}>{phone || 'رقم هاتفك'}</Text>

						<View style={styles.codeArea}>
							<TextInput
								ref={inputRef}
								value={code}
								onChangeText={handleCodeChange}
								keyboardType='number-pad'
								autoComplete='sms-otp'
								textContentType='oneTimeCode'
								maxLength={CODE_LENGTH}
								caretHidden
								showSoftInputOnFocus
								style={styles.inputOverlay}
							/>
							<View pointerEvents='none' style={styles.codeRow}>
								{Array.from({ length: CODE_LENGTH }, (_, index) => {
									const filled = Boolean(code[index])
									const active = code.length === index && !loading
									return (
										<View key={index} style={[styles.codeBox, { borderColor: error ? colors.error : active ? '#ff6b4a' : colors.border, backgroundColor: filled ? '#211d20' : '#1a1a1d' }]}>
											<Text style={[styles.codeText, { color: colors.textPrimary }]}>{code[index] || ''}</Text>
										</View>
									)
								})}
							</View>
						</View>

						{loading ? <View style={styles.status}><ActivityIndicator color='#ff6b4a' /><Text style={[styles.statusText, { color: colors.textSecondary }]}>جاري التحقق من الرمز...</Text></View> : null}
						{error ? <Text style={[styles.message, { color: colors.error }]}>{error}</Text> : null}
						{notice ? <Text style={[styles.message, { color: colors.success }]}>{notice}</Text> : null}

						<Pressable disabled={loading || cooldown > 0} onPress={requestCode} style={styles.resendButton}>
							<Text style={{ color: cooldown > 0 ? colors.textDisabled : '#ff704d', fontWeight: '700' }}>
								{cooldown > 0 ? `إعادة إرسال الرمز خلال ${cooldown} ثانية` : 'لم يصلك الرمز؟ إعادة الإرسال'}
							</Text>
						</Pressable>
					</View>
				</KeyboardAvoidingView>
			</AuthBackdrop>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	keyboardAvoidingView: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
	header: { alignItems: 'center', marginBottom: 34 },
	headerTitle: { color: '#f5f5f5', fontSize: 38, fontWeight: '800', letterSpacing: -1 },
	headerAccent: { color: '#ff6b1a', fontSize: 45, fontWeight: '900', lineHeight: 49 },
	card: { width: '100%', maxWidth: 460, alignSelf: 'center', borderRadius: 30, borderWidth: 1, paddingHorizontal: 24, paddingVertical: 31, shadowColor: '#000', shadowOpacity: 0.32, shadowRadius: 20, elevation: 8 },
	handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 999, backgroundColor: '#5c5c62', marginBottom: 30 },
	backButton: { position: 'absolute', top: 20, left: 20, zIndex: 4, padding: 6 },
	title: { fontSize: 27, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
	description: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
	phone: { fontSize: 15, textAlign: 'center', fontWeight: '700', writingDirection: 'ltr', marginTop: 3 },
	codeArea: { marginTop: 31, minHeight: 62, justifyContent: 'center' },
	inputOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 3, opacity: 0.02, color: 'transparent' },
	codeRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 9 },
	codeBox: { flex: 1, height: 58, borderWidth: 1.5, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
	codeText: { fontSize: 25, fontWeight: '800' },
	status: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 },
	statusText: { fontSize: 14 },
	message: { textAlign: 'center', marginTop: 18, lineHeight: 21 },
	resendButton: { alignSelf: 'center', marginTop: 24, paddingVertical: 5 },
})
