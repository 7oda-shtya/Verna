import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { changePasswordRequest } from '../../api/auth.api';
import { useTheme } from '../../theme/useTheme';

const PasswordField = ({ value, onChangeText, placeholder }) => {
	const { theme } = useTheme();
	const [secure, setSecure] = useState(true);
	return (
		<View style={{ ...theme.components.input, height: 54, flexDirection: 'row', alignItems: 'center' }}>
			<TextInput value={value} onChangeText={onChangeText} secureTextEntry={secure} placeholder={placeholder} placeholderTextColor={theme.colors.placeholder} style={{ flex: 1, color: theme.colors.textPrimary, textAlign: 'right' }} />
			<Pressable onPress={() => setSecure(current => !current)}>
				<Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={20} color={theme.colors.textSecondary} />
			</Pressable>
		</View>
	);
};

export default function ChangePassword({ navigation }) {
	const { theme } = useTheme();
	const { colors } = theme;
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [message, setMessage] = useState('');

	const submit = async () => {
		if (!currentPassword) return setError('اكتب كلمة السر الحالية');
		if (newPassword.length < 8) return setError('كلمة السر الجديدة لازم تكون 8 أحرف على الأقل');
		if (newPassword !== confirmPassword) return setError('كلمتا السر الجديدتان غير متطابقتين');
		setLoading(true);
		setError('');
		setMessage('');
		try {
			await changePasswordRequest(currentPassword, newPassword);
			setCurrentPassword('');
			setNewPassword('');
      setConfirmPassword('');
      setMessage('تم تغيير كلمة السر بنجاح');
      navigation.navigate('ClientTabs', { screen: 'Home' });
		} catch (requestError) {
			setError(requestError.response?.data?.message || 'تعذر تغيير كلمة السر');
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<KeyboardAvoidingView style={{ flex: 1, padding: 20 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 }}>
					<Pressable onPress={() => navigation.goBack()}><Ionicons name='arrow-back' size={25} color={colors.textPrimary} /></Pressable>
					<Text style={{ color: colors.textPrimary, fontSize: 23, fontWeight: '800' }}>تغيير كلمة السر</Text>
				</View>
				<View style={{ ...theme.components.card, padding: 20, gap: 14 }}>
					<Text style={{ color: colors.textSecondary, lineHeight: 22 }}>لأمان حسابك، اكتب كلمة السر الحالية ثم اختر كلمة سر جديدة.</Text>
					<PasswordField value={currentPassword} onChangeText={setCurrentPassword} placeholder='كلمة السر الحالية' />
					<PasswordField value={newPassword} onChangeText={setNewPassword} placeholder='كلمة السر الجديدة' />
					<PasswordField value={confirmPassword} onChangeText={setConfirmPassword} placeholder='تأكيد كلمة السر الجديدة' />
					{error ? <Text style={{ color: colors.error, textAlign: 'center' }}>{error}</Text> : null}
					{message ? <Text style={{ color: colors.success, textAlign: 'center' }}>{message}</Text> : null}
					<Pressable disabled={loading} onPress={submit} style={{ ...theme.components.primaryButton, padding: 15, opacity: loading ? 0.65 : 1 }}>
						{loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ ...theme.components.primaryButtonText, textAlign: 'center' }}>حفظ كلمة السر الجديدة</Text>}
					</Pressable>
					<Pressable onPress={() => navigation.navigate('AccountPasswordReset')}>
						<Text style={{ color: colors.primary, textAlign: 'center', fontWeight: '700' }}>نسيت كلمة السر الحالية؟</Text>
					</Pressable>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
