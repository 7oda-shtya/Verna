import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import * as ImagePicker from 'expo-image-picker'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { Ionicons } from '@expo/vector-icons'
import { updateProfile } from '../../redux/slices/client/authSlice'
import { useTheme } from '../../theme/useTheme'

const EditProfile = ({ navigation }) => {
	const dispatch = useDispatch()
	const user = useSelector(state => state.auth)
	const { theme } = useTheme()
	const { colors } = theme

	const initialForm = useMemo(
		() => ({
			name: user?.name || '',
			username: user?.username || '',
			phone: user?.phone || '',
			email: user?.email || '',
			homeAddress: user?.homeAddress || '',
			officeAddress: user?.officeAddress || '',
			old: user?.old ? String(user.old) : '',
		}),
		[user]
	)

	const [form, setForm] = useState(initialForm)
	const [avatarUri, setAvatarUri] = useState(null)
	const [fieldErrors, setFieldErrors] = useState({ username: '', phone: '', email: '', old: '' })
	const [generalError, setGeneralError] = useState('')
	const [loading, setLoading] = useState(false)
	const [exitModalVisible, setExitModalVisible] = useState(false)
	const [focusedField, setFocusedField] = useState(null)

	const getInputStyle = field => [
		focusedField === field ? theme.components.inputFocused : theme.components.input,
		fieldErrors[field] ? { borderColor: colors.error } : null,
	]

	const hasChanges = useMemo(
		() => avatarUri !== null || Object.keys(initialForm).some(key => form[key] !== initialForm[key]),
		[form, initialForm, avatarUri]
	)

	const hasChangesRef = useRef(hasChanges)
	useEffect(() => {
		hasChangesRef.current = hasChanges
	}, [hasChanges])

	const pendingAction = useRef(null)

	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', e => {
			if (!hasChangesRef.current) return
			e.preventDefault()
			pendingAction.current = e.data.action
			setExitModalVisible(true)
		})
		return unsubscribe
	}, [navigation])

	const updateField = (key, value) => {
		setForm(prev => ({ ...prev, [key]: value }))
		if (fieldErrors[key]) setFieldErrors(prev => ({ ...prev, [key]: '' }))
		if (generalError) setGeneralError('')
	}

	const pickAvatar = async () => {
		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
		if (!permission.granted) {
			Alert.alert('محتاجين إذن', 'محتاجين إذن الوصول للصور عشان تقدر تغيّر صورة البروفايل')
			return
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 1,
		})

		if (result.canceled) return

		try {
			const context = ImageManipulator.manipulate(result.assets[0].uri)
			context.resize({ width: 512, height: 512 })
			const rendered = await context.renderAsync()
			const saved = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG })
			setAvatarUri(saved.uri)
		} catch {
			setAvatarUri(result.assets[0].uri)
		}
	}

	const validate = () => {
		if (!form.name.trim()) {
			setGeneralError('الاسم مطلوب')
			return false
		}
		if (!form.username.trim()) {
			setFieldErrors(prev => ({ ...prev, username: 'اسم المستخدم مطلوب' }))
			return false
		}
		const compactPhone = form.phone.trim().replace(/\s+/g, '')
		const localPhone = compactPhone.startsWith('+20')
			? compactPhone.slice(3)
			: compactPhone.startsWith('20')
				? compactPhone.slice(2)
				: compactPhone.startsWith('0') ? compactPhone.slice(1) : compactPhone
		if (!/^(10|11|12|15)\d{8}$/.test(localPhone)) {
			setFieldErrors(prev => ({ ...prev, phone: 'أدخل رقم هاتف مصري صحيح' }))
			return false
		}
		if (form.old.trim()) {
			const age = Number(form.old)
			if (!Number.isInteger(age) || age < 12 || age > 100) {
				setFieldErrors(prev => ({ ...prev, old: 'العمر لازم يكون رقم صحيح بين 12 و 100' }))
				return false
			}
		}
		return true
	}

	const persist = async () => {
		setGeneralError('')
		if (!validate()) return false

		const formData = new FormData()
		formData.append('name', form.name.trim())
		formData.append('username', form.username.trim())
		const compactPhone = form.phone.trim().replace(/\s+/g, '')
		const localPhone = compactPhone.startsWith('+20')
			? compactPhone.slice(3)
			: compactPhone.startsWith('20')
				? compactPhone.slice(2)
				: compactPhone.startsWith('0') ? compactPhone.slice(1) : compactPhone
		formData.append('phone', `+20${localPhone}`)
		formData.append('email', form.email.trim())
		formData.append('homeAddress', form.homeAddress.trim())
		formData.append('officeAddress', form.officeAddress.trim())
		formData.append('old', form.old.trim())
		if (avatarUri) {
			formData.append('avatar', {
				uri: avatarUri,
				name: 'avatar.jpg',
				type: 'image/jpeg',
			})
		}

		setLoading(true)
		try {
			await dispatch(updateProfile(formData)).unwrap()
			return true
		} catch (err) {
			if (err?.field && err.field in fieldErrors) {
				setFieldErrors(prev => ({ ...prev, [err.field]: err.message }))
			} else {
				setGeneralError(err?.message || 'حصل خطأ، حاول تاني')
			}
			return false
		} finally {
			setLoading(false)
		}
	}

	const leave = () => {
		if (pendingAction.current) {
			navigation.dispatch(pendingAction.current)
		} else {
			navigation.goBack()
		}
	}

	const handleSave = async () => {
		const ok = await persist()
		if (ok) leave()
	}

	const handleBackPress = () => {
		if (hasChanges) {
			setExitModalVisible(true)
		} else {
			navigation.goBack()
		}
	}

	const handleDiscard = () => {
		setExitModalVisible(false)
		leave()
	}

	const handleSaveAndExit = async () => {
		const ok = await persist()
		setExitModalVisible(false)
		if (ok) leave()
	}

	return (
		<SafeAreaView className='flex-1' style={{ backgroundColor: colors.background }} dir='rtl'>
			<View className='flex-row items-center justify-between px-4 pt-2 pb-3' style={{ borderBottomColor: colors.divider, borderBottomWidth: theme.borderWidths.subtle }}>
				<Pressable
					onPress={handleSave}
					disabled={loading || !hasChanges}
					className='rounded-full w-10 h-10 items-center justify-center active:scale-90'
					style={{
						backgroundColor: hasChanges ? colors.primary : colors.surfaceElevated,
						borderColor: hasChanges ? colors.primary : colors.border,
						borderWidth: theme.borderWidths.subtle,
						opacity: loading ? 0.7 : 1,
					}}
				>
					{loading ? <ActivityIndicator color={colors.onPrimary} size='small' /> : <Ionicons name='checkmark' size={22} color={hasChanges ? colors.onPrimary : colors.iconInactive} />}
				</Pressable>
				<Text className='text-base font-bold' style={{ color: colors.textPrimary }}>تعديل الملف الشخصي</Text>
				<Pressable onPress={handleBackPress} className='rounded-full w-10 h-10 items-center justify-center active:scale-90' style={{ backgroundColor: colors.surfaceElevated }}>
					<Ionicons name='chevron-back' size={20} color={colors.textPrimary} />
				</Pressable>


			</View>

			<ScrollView contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: 40 }} keyboardShouldPersistTaps='handled'>
				{generalError ? (
					<View className='mb-4 rounded-xl px-3 py-2' style={{ backgroundColor: colors.errorMuted, borderColor: colors.error, borderWidth: theme.borderWidths.subtle }}>
						<Text className='text-center text-sm' style={{ color: colors.error }}>{generalError}</Text>
					</View>
				) : null}

				<View className='flex flex-col items-center gap-3 mb-6'>
					<Pressable onPress={pickAvatar} className='relative active:scale-95'>
						<Image
							className='w-28 h-28 rounded-full'
							style={theme.components.avatar}
							source={avatarUri ? { uri: avatarUri } : user?.avatar ? { uri: user.avatar } : require('../../../assets/images/user-icon.png')}
						/>
						<View className='absolute bottom-0 right-0 rounded-full w-9 h-9 items-center justify-center' style={{ backgroundColor: colors.primary, borderColor: colors.background, borderWidth: 2 }}>
							<Ionicons name='camera' size={16} color={colors.onPrimary} />
						</View>
					</Pressable>
					<Text className='text-xs' style={{ color: colors.textSecondary }}>اضغط على الصورة عشان تغيّرها وتقصّ الجزء اللي عايزه</Text>
				</View>

				<View className='flex flex-col gap-4'>
					<View>
						<Text className='text-xs mb-1.5 mr-1' style={{ color: colors.textSecondary }}>الاسم</Text>
						<TextInput
							value={form.name}
							onChangeText={value => updateField('name', value)}
							onFocus={() => setFocusedField('name')}
							onBlur={() => setFocusedField(null)}
							className='w-full rounded-xl px-4 py-3 text-sm'
							style={getInputStyle('name')}
							placeholder='الاسم'
							placeholderTextColor={colors.placeholder}
						/>
					</View>

					<View>
						<Text className='text-xs mb-1.5 mr-1' style={{ color: colors.textSecondary }}>اسم المستخدم</Text>
						<TextInput
							value={form.username}
							onChangeText={value => updateField('username', value)}
							onFocus={() => setFocusedField('username')}
							onBlur={() => setFocusedField(null)}
							autoCapitalize='none'
							autoCorrect={false}
							className='w-full rounded-xl px-4 py-3 text-sm'
							style={getInputStyle('username')}
							placeholder='اسم المستخدم'
							placeholderTextColor={colors.placeholder}
						/>
						{fieldErrors.username ? <Text className='text-xs mt-1 text-right' style={{ color: colors.error }}>{fieldErrors.username}</Text> : null}
					</View>

					<View>
						<Text className='text-xs mb-1.5 mr-1' style={{ color: colors.textSecondary }}>البريد الإلكتروني</Text>
						<TextInput
							value={form.email}
							onChangeText={value => updateField('email', value)}
							onFocus={() => setFocusedField('email')}
							onBlur={() => setFocusedField(null)}
							keyboardType='email-address'
							autoCapitalize='none'
							className='w-full rounded-xl px-4 py-3 text-sm'
							style={getInputStyle('email')}
							placeholder='البريد الإلكتروني'
							placeholderTextColor={colors.placeholder}
						/>
						{fieldErrors.email ? <Text className='text-xs mt-1 text-right' style={{ color: colors.error }}>{fieldErrors.email}</Text> : null}
					</View>

					<View>
						<Text className='text-xs mb-1.5 mr-1' style={{ color: colors.textSecondary }}>رقم الهاتف</Text>
						<TextInput
							value={form.phone}
							onChangeText={value => updateField('phone', value)}
							onFocus={() => setFocusedField('phone')}
							onBlur={() => setFocusedField(null)}
							keyboardType='phone-pad'
							className='w-full rounded-xl px-4 py-3 text-sm'
							style={[...getInputStyle('phone'), { writingDirection: 'ltr', textAlign: 'left' }]}
							placeholder='+201xxxxxxxxx'
							placeholderTextColor={colors.placeholder}
						/>
						{fieldErrors.phone ? <Text className='text-xs mt-1 text-right' style={{ color: colors.error }}>{fieldErrors.phone}</Text> : null}
					</View>

					<View>
						<Text className='text-xs mb-1.5 mr-1' style={{ color: colors.textSecondary }}>العمر</Text>
						<TextInput
							value={form.old}
							onChangeText={value => updateField('old', value.replace(/[^0-9]/g, ''))}
							onFocus={() => setFocusedField('old')}
							onBlur={() => setFocusedField(null)}
							keyboardType='number-pad'
							maxLength={3}
							className='w-full rounded-xl px-4 py-3 text-sm'
							style={getInputStyle('old')}
							placeholder='العمر'
							placeholderTextColor={colors.placeholder}
						/>
						{fieldErrors.old ? <Text className='text-xs mt-1 text-right' style={{ color: colors.error }}>{fieldErrors.old}</Text> : null}
					</View>

					<View>
						<Text className='text-xs mb-1.5 mr-1' style={{ color: colors.textSecondary }}>العنوان (المنزل)</Text>
						<TextInput
							value={form.homeAddress}
							onChangeText={value => updateField('homeAddress', value)}
							onFocus={() => setFocusedField('homeAddress')}
							onBlur={() => setFocusedField(null)}
							className='w-full rounded-xl px-4 py-3 text-sm'
							style={getInputStyle('homeAddress')}
							placeholder='العنوان (المنزل)'
							placeholderTextColor={colors.placeholder}
						/>
					</View>

					<View>
						<Text className='text-xs mb-1.5 mr-1' style={{ color: colors.textSecondary }}>العنوان (العمل)</Text>
						<TextInput
							value={form.officeAddress}
							onChangeText={value => updateField('officeAddress', value)}
							onFocus={() => setFocusedField('officeAddress')}
							onBlur={() => setFocusedField(null)}
							className='w-full rounded-xl px-4 py-3 text-sm'
							style={getInputStyle('officeAddress')}
							placeholder='العنوان (العمل)'
							placeholderTextColor={colors.placeholder}
						/>
					</View>

					<Pressable
						onPress={handleSave}
						disabled={loading || !hasChanges}
						className='mt-2 w-full rounded-xl py-3.5 active:scale-[0.99]'
						style={{
							backgroundColor: hasChanges ? colors.primary : colors.surfaceElevated,
							borderColor: hasChanges ? colors.primary : colors.border,
							borderWidth: theme.borderWidths.subtle,
							opacity: loading ? 0.7 : 1,
						}}
					>
						{loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text className='text-center font-bold' style={{ color: hasChanges ? colors.onPrimary : colors.textDisabled }}>حفظ التعديلات</Text>}
					</Pressable>
				</View>
			</ScrollView>

			<Modal transparent visible={exitModalVisible} animationType='fade' onRequestClose={() => setExitModalVisible(false)}>
				<View className='flex-1 items-center justify-center px-6' style={{ backgroundColor: colors.backdrop }}>
					<View className='w-full rounded-3xl p-5 gap-5' style={theme.components.modal}>
						<View className='items-center gap-2'>
							<View className='rounded-full w-14 h-14 items-center justify-center' style={{ backgroundColor: colors.warningMuted }}>
								<Ionicons name='alert-circle' size={28} color={colors.warning} />
							</View>
							<Text className='font-bold text-base text-center' style={{ color: colors.textPrimary }}>عندك تعديلات لسه ما اتحفظتش</Text>
							<Text className='text-xs text-center leading-5' style={{ color: colors.textSecondary }}>عايز تحفظ التعديلات دي قبل ما تخرج، ولا تتجاهلها؟</Text>
						</View>

						<View className='gap-2.5'>
							<Pressable onPress={handleSaveAndExit} disabled={loading} className='rounded-xl py-3.5 flex-row items-center justify-center gap-2 active:scale-[0.99]' style={{ backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }}>
								{loading ? (
									<ActivityIndicator color={colors.onPrimary} size='small' />
								) : (
									<>
										<Ionicons name='checkmark-circle' size={18} color={colors.onPrimary} />
										<Text className='font-bold text-sm' style={{ color: colors.onPrimary }}>حفظ والخروج</Text>
									</>
								)}
							</Pressable>
							<Pressable onPress={handleDiscard} disabled={loading} className='rounded-xl py-3.5 items-center active:scale-[0.99]' style={{ backgroundColor: colors.errorMuted, borderColor: colors.error, borderWidth: theme.borderWidths.subtle }}>
								<Text className='font-bold text-sm' style={{ color: colors.error }}>تجاهل التعديلات</Text>
							</Pressable>
							<Pressable onPress={() => setExitModalVisible(false)} disabled={loading} className='items-center py-1.5'>
								<Text className='text-xs' style={{ color: colors.textMuted }}>رجوع للتعديل</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	)
}

export default EditProfile
