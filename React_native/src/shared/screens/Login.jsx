import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Image, Keyboard, Pressable, Text, TextInput, View, Platform, Animated, LayoutAnimation, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import NeonStreaks from '../components/NeonStreaks';
import AuthBackdrop from '../components/AuthBackdrop';
import { login, clearAuthError } from '../../redux/slices/client/authSlice';
import { useTheme } from '../../theme/useTheme';
import { useFocusEffect } from '@react-navigation/native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Login({ navigation, route }) {
	const dispatch = useDispatch();
	const { loading, error } = useSelector(state => state.auth);
	const { theme } = useTheme();

	const [identifier, setIdentifier] = useState('');
	const [password, setPassword] = useState('');

	const [fieldErrors, setFieldErrors] = useState({ phone: '', password: '' });

	useFocusEffect(
		useCallback(() => {
			const timer = setTimeout(() => {
				dispatch(clearAuthError());
				setFieldErrors({ phone: '', password: '' });
			}, 0);
			return () => clearTimeout(timer);
		}, [dispatch]),
	);

	const errorTemplates = {
		phoneEmpty: 'ادخل رقم الهاتف أو اسم المستخدم',
		phoneLength: 'رقم الهاتف يجب أن يكون 10 أرقام',
		passwordEmpty: 'ادخل كلمة المرور',
		passwordLength: 'الباسورد يجب أن يكون 6 حروف على الأقل',
	};

	const [shiftAnim] = useState(() => new Animated.Value(0));

	useEffect(() => {
		const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
		const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

		const showSubscription = Keyboard.addListener(showEvent, () => {
			Animated.timing(shiftAnim, { toValue: -120, duration: 250, useNativeDriver: true }).start();
		});
		const hideSubscription = Keyboard.addListener(hideEvent, () => {
			Animated.timing(shiftAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
		});

		return () => {
			showSubscription.remove();
			hideSubscription.remove();
		};
	}, [shiftAnim]);

	const handleLogin = () => {
		let valid = true;
		let phoneErr = '';
		let passwordErr = '';

		const trimmedIdentifier = identifier.trim();
		const compactIdentifier = trimmedIdentifier.replace(/\s+/g, '');
		const isPhoneIdentifier = /^\d+$/.test(compactIdentifier);
		let normalizedIdentifier = trimmedIdentifier;

		if (!trimmedIdentifier) {
			phoneErr = errorTemplates.phoneEmpty;
			valid = false;
		} else if (isPhoneIdentifier) {
			let cleanedPhone = compactIdentifier;
			if (cleanedPhone.startsWith('0')) {
				cleanedPhone = cleanedPhone.substring(1);
			}
			const egPhoneRegex = /^(10|11|12|15)\d{8}$/;
			if (!egPhoneRegex.test(cleanedPhone)) {
				phoneErr = 'أدخل رقم هاتف مصري صحيح';
				valid = false;
			} else {
				normalizedIdentifier = `+20${cleanedPhone}`;
			}
		}

		if (!password) {
			passwordErr = errorTemplates.passwordEmpty;
			valid = false;
		} else if (password.length < 6) {
			passwordErr = errorTemplates.passwordLength;
			valid = false;
		}

		LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
		setFieldErrors({ phone: phoneErr, password: passwordErr });

		if (!valid) return;

		dispatch(login({ identifier: normalizedIdentifier, password }));
	};

	const [secureTextEntry, setSecureTextEntry] = useState(true);
	const toggleSecureEntry = () => {
		setSecureTextEntry(!secureTextEntry);
	};

	return (

		<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<StatusBar style={theme.statusBarStyle} />

			<Pressable className='absolute top-16 left-4 z-20 flex-row items-center gap-1 rounded-full bg-white/10 px-3 py-2' style={{ borderColor: theme.colors.border, borderWidth: theme.borderWidths.subtle }} onPress={() => navigation.navigate('Support')}>
				<Ionicons name='headset-outline' size={16} color='#67e8f9' />
				<Text style={{ ...theme.typography.subtitle, color: theme.colors.textPrimary }}>الدعم</Text>
			</Pressable>

			<AuthBackdrop>
				<Pressable className='flex-1 justify-center items-center' onPress={Keyboard.dismiss}>
					<Animated.View style={{ transform: [{ translateY: shiftAnim }] }} className='w-full max-w-md items-center px-6'>
						<Image source={require('../../../assets/images/Logo.png')} resizeMode='contain' className='h-28 w-60 mb-8' />

						<View className='w-full px-4 py-6 rounded-2xl shadow-2xl' style={{ backgroundColor: theme.colors.overlay, borderColor: theme.colors.border, borderWidth: theme.borderWidths.subtle }}>
							<Text className='text-center mb-6' style={{ ...theme.typography.display, color: theme.colors.textPrimary }}>سجل دخولك الآن</Text>

							{error ? (
								<View className='mb-4 rounded-xl bg-red-500/10 px-3 py-2' style={{ borderColor: theme.colors.error, borderWidth: theme.borderWidths.subtle }}>
									<Text className='text-center text-red-400' style={theme.typography.caption}>{error}</Text>
								</View>
							) : null}
							{route?.params?.confirmation ? (
								<View className='mb-4 rounded-xl px-3 py-2' style={{ backgroundColor: theme.colors.primaryMuted }}>
									<Text className='text-center' style={{ ...theme.typography.caption, color: theme.colors.success }}>{route.params.confirmation}</Text>
								</View>
							) : null}

							<View className='flex-row justify-between items-center mb-2 px-1'>
								<Text className='text-white/80' style={theme.typography.subtitle}>رقم الهاتف أو اسم المستخدم</Text>
								{fieldErrors.phone ? <Text className='text-red-400' style={theme.typography.caption}>{fieldErrors.phone}</Text> : null}
							</View>

							<View className='relative flex-row items-center overflow-visible rounded-2xl bg-zinc-900/80 px-3 py-3 mb-5' style={{ borderColor: fieldErrors.phone ? theme.colors.error : theme.colors.borderFocused, borderWidth: theme.borderWidths.subtle }}>
								<Ionicons name='person-outline' size={18} color={fieldErrors.phone ? '#f87171' : '#67e8f9'} />
								<TextInput
									placeholder='ادخل رقم الهاتف أو اسم المستخدم'
									placeholderTextColor='rgba(255,255,255,0.38)'
									keyboardType='default'
									autoCapitalize='none'
									autoCorrect={false}
									textAlign='right'
									value={identifier}
									onChangeText={text => {
										setIdentifier(text);
										if (fieldErrors.phone) {
											LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
											setFieldErrors(prev => ({ ...prev, phone: '' }));
										}
										if (error) dispatch(clearAuthError());
									}}
									style={theme.typography.body}
									className='outline-none flex-1 text-white mr-3'
								/>
								{!fieldErrors.phone && <NeonStreaks width={100} height={100} color='#22D3EE' style={{ left: -60, top: -20 }} />}
							</View>

							<View className='flex-row justify-between items-center mb-2 px-1'>
								<Text className='text-left text-white/80' style={theme.typography.subtitle}>كلمة المرور</Text>
								{fieldErrors.password ? <Text className='text-red-400' style={theme.typography.caption}>{fieldErrors.password}</Text> : null}
							</View>

							<View className='flex-row items-center rounded-2xl bg-zinc-900/80 px-3 py-3' style={{ borderColor: fieldErrors.password ? theme.colors.error : theme.colors.border, borderWidth: theme.borderWidths.subtle }}>
								<Ionicons name='lock-closed-outline' size={18} color={fieldErrors.password ? '#f87171' : 'rgba(255,255,255,0.7)'} />
								<TextInput
									placeholder='••••••••'
									placeholderTextColor='rgba(255,255,255,0.38)'
									secureTextEntry={secureTextEntry}
									textAlign='right'
									value={password}
									onChangeText={text => {
										setPassword(text);
										if (fieldErrors.password) {
											LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
											setFieldErrors(prev => ({ ...prev, password: '' }));
										}
										if (error) dispatch(clearAuthError());
									}}
									style={theme.typography.body}
									className='outline-none flex-1 text-white mx-3'
								/>
								<Pressable onPress={toggleSecureEntry}>
									<Ionicons name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'} size={18} color='rgba(255,255,255,0.7)' />
								</Pressable>
							</View>

							<Pressable onPress={handleLogin} disabled={loading} className='relative mt-6 overflow-hidden rounded-2xl bg-lime-400 py-4' style={{ opacity: loading ? 0.7 : 1 }}>
								{loading ? <ActivityIndicator color='#000' /> : <Text className='text-center text-zinc-950' style={theme.typography.subtitle}>تسجيل الدخول</Text>}
							</Pressable>

							<Pressable className='mt-4' onPress={() => navigation.navigate('ForgotPassword')}>
								<Text className='text-center text-white/90 underline'>نسيت كلمة المرور؟</Text>
							</Pressable>
						</View>

						<View className='mt-6 flex-row items-center justify-center gap-2'>
							<Text style={{ ...theme.typography.subtitle, color: theme.colors.textSecondary }}>ليس لديك حساب؟</Text>
							<Pressable onPress={() => navigation.navigate('SignUp')}>
								<Text className='text-white font-bold underline'>إنشاء حساب</Text>
							</Pressable>
						</View>
					</Animated.View>
				</Pressable>
			</AuthBackdrop>
		</SafeAreaView>
	);
}
