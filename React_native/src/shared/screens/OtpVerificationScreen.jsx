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
	const purpose = purposeProp || route?.params?.purpose || PHONE_VERIFICATION
	const accountMode = Boolean(route?.params?.accountMode)
	const shouldRequestOnMount = purpose === PHONE_VERIFICATION
	// Third rewrite of the OTP input: the previous approach used one invisible TextInput
	// layered behind/beside visible "boxes", relying on it to catch focus/typing while the
	// boxes were purely decorative. That's the pattern that kept breaking (keyboard not
	// opening, typed digits not showing up) across Android/Fabric. This version drops that
	// entirely: each box IS its own real, visible TextInput. Tapping a box focuses that exact
	// input natively (no touch-routing tricks needed), and typing a digit updates that same
	// box directly, so there's no separate state to get out of sync with what's on screen.
	const inputRefs = useRef([])
	const requestedOnMount = useRef(false)
	const verifying = useRef(false)
	const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''))
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [notice, setNotice] = useState('')
	const [cooldown, setCooldown] = useState(shouldRequestOnMount ? 0 : 30)

	const focusIndex = index => inputRefs.current[index]?.focus()

	const requestCode = async () => {
		if (!phone || loading || cooldown > 0) return
		setLoading(true)
		setError('')
		try {
			await requestOtpRequest(phone, purpose)
			setNotice('تم إرسال رمز تحقق جديد إلى رقم هاتفك')
			setCooldown(45)
			requestAnimationFrame(() => focusIndex(0))
		} catch (requestError) {
			setError(requestError.response?.data?.message || 'تعذر إرسال رمز التحقق')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		const interaction = InteractionManager.runAfterInteractions(() => focusIndex(0))
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
			setDigits(Array(CODE_LENGTH).fill(''))
			setError(verifyError.response?.data?.message || 'رمز التحقق غير صحيح أو منتهي')
			requestAnimationFrame(() => focusIndex(0))
		} finally {
			verifying.current = false
			setLoading(false)
		}
	}

	// Handles both normal typing AND autofill/paste, since SMS autofill on Android/iOS
	// commonly drops the whole code into whichever box is currently focused rather than
	// typing it digit by digit.
	const handleChangeAt = (index, value) => {
		if (loading) return
		const digitsOnly = value.replace(/\D/g, '')
		if (!digitsOnly) {
			setDigits(prev => {
				const next = [...prev]
				next[index] = ''
				return next
			})
			return
		}

		setDigits(prev => {
			const next = [...prev]
			if (digitsOnly.length > 1) {
				// Autofill/paste: spread the incoming digits starting at this box.
				for (let i = 0; i < digitsOnly.length && index + i < CODE_LENGTH; i++) {
					next[index + i] = digitsOnly[i]
				}
			} else {
				next[index] = digitsOnly
			}
			const joined = next.join('')
			setError('')
			setNotice('')
			if (joined.length === CODE_LENGTH && next.every(Boolean)) {
				requestAnimationFrame(() => verifyCode(joined))
			} else {
				const nextEmptyIndex = next.findIndex((d, i) => i > index && !d)
				const target = digitsOnly.length > 1
					? Math.min(index + digitsOnly.length, CODE_LENGTH - 1)
					: index + 1
				if (target < CODE_LENGTH) requestAnimationFrame(() => focusIndex(nextEmptyIndex !== -1 ? nextEmptyIndex : target))
			}
			return next
		})
	}

	const handleKeyPressAt = (index, key) => {
		if (key === 'Backspace' && !digits[index] && index > 0) {
			requestAnimationFrame(() => focusIndex(index - 1))
		}
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

						<View style={styles.codeRow}>
							{digits.map((digit, index) => {
								const active = digit === '' && digits.slice(0, index).every(Boolean)
								return (
									<TextInput
										key={index}
										ref={ref => { inputRefs.current[index] = ref }}
										value={digit}
										onChangeText={value => handleChangeAt(index, value)}
										onKeyPress={({ nativeEvent }) => handleKeyPressAt(index, nativeEvent.key)}
										keyboardType='number-pad'
										autoComplete={index === 0 ? 'sms-otp' : 'off'}
										textContentType={index === 0 ? 'oneTimeCode' : 'none'}
										maxLength={CODE_LENGTH}
										editable={!loading}
										selectTextOnFocus
										style={[
											styles.codeBox,
											{
												color: colors.textPrimary,
												borderColor: error ? colors.error : active ? '#ff6b4a' : colors.border,
												backgroundColor: digit ? '#211d20' : '#1a1a1d',
											},
										]}
									/>
								)
							})}
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
	codeRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 9, marginTop: 31 },
	codeBox: { flex: 1, height: 58, borderWidth: 1.5, borderRadius: 15, textAlign: 'center', fontSize: 25, fontWeight: '800', padding: 0 },
	status: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 },
	statusText: { fontSize: 14 },
	message: { textAlign: 'center', marginTop: 18, lineHeight: 21 },
	resendButton: { alignSelf: 'center', marginTop: 24, paddingVertical: 5 },
})