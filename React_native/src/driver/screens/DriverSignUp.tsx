import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../../redux/slices/client/authSlice';
import { useTheme } from '../../theme/useTheme';

const fields = [
  ['name', 'الاسم بالكامل'], ['username', 'اسم المستخدم'], ['phone', 'رقم الهاتف'],
  ['email', 'البريد الإلكتروني (اختياري)'], ['referralCode', 'كود الدعوة (اختياري)'],
  ['model', 'موديل السيارة'], ['plateNumber', 'رقم اللوحة'],
] as const;

export default function DriverSignUp({ navigation }: any) {
  const dispatch = useDispatch<any>();
  const { theme } = useTheme();
  const loading = useSelector((state: any) => state.auth.loading);
  const serverError = useSelector((state: any) => state.auth.error);
  const [values, setValues] = useState<Record<string, string>>({});
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const submit = async () => {
    const required = ['name', 'username', 'phone', 'model', 'plateNumber'];
    if (required.some(key => !values[key]?.trim()) || !password) return setError('من فضلك أكمل كل الحقول المطلوبة.');
    if (password !== confirmation) return setError('كلمتا المرور غير متطابقتين.');
    const digits = values.phone.replace(/\s+/g, '').replace(/^0/, '');
    if (!/^(10|11|12|15)\d{8}$/.test(digits)) return setError('أدخل رقم هاتف مصري صحيح.');
    setError('');
    try { await (dispatch as any)((register as any)({ ...values, phone: `+20${digits}`, password })).unwrap(); }
    catch (requestError: any) { setError(requestError?.message || 'تعذر إنشاء الحساب.'); }
  };
  const inputStyle = { color: theme.colors.textPrimary, backgroundColor: theme.colors.surfaceElevated, borderRadius: 12, padding: 13, textAlign: 'right' as const };
  return <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12 }} keyboardShouldPersistTaps='handled'>
    <Text style={{ ...theme.typography.display, color: theme.colors.textPrimary, textAlign: 'center' }}>إنشاء حساب سائق</Text>
    <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 8 }}>سيبقى الحساب قيد المراجعة حتى تفعيله.</Text>
    {(error || serverError) ? <Text style={{ color: theme.colors.error, textAlign: 'center' }}>{error || serverError}</Text> : null}
    {fields.map(([key, label]) => <TextInput key={key} value={values[key] || ''} onChangeText={value => setValues(current => ({ ...current, [key]: value }))} placeholder={label} placeholderTextColor={theme.colors.placeholder} keyboardType={key === 'phone' ? 'phone-pad' : key === 'email' ? 'email-address' : 'default'} autoCapitalize={key === 'email' || key === 'username' ? 'none' : key === 'referralCode' ? 'characters' : 'words'} style={inputStyle} />)}
    <TextInput value={password} onChangeText={setPassword} placeholder='كلمة المرور' placeholderTextColor={theme.colors.placeholder} secureTextEntry style={inputStyle} />
    <TextInput value={confirmation} onChangeText={setConfirmation} placeholder='تأكيد كلمة المرور' placeholderTextColor={theme.colors.placeholder} secureTextEntry style={inputStyle} />
    <Pressable onPress={submit} disabled={loading} style={{ alignItems: 'center', padding: 15, borderRadius: 12, backgroundColor: theme.colors.primary, opacity: loading ? .6 : 1 }}>{loading ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={{ color: theme.colors.onPrimary, fontWeight: '800' }}>إنشاء الحساب</Text>}</Pressable>
    <Pressable onPress={() => navigation.navigate('Login')}><Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>لديك حساب بالفعل؟ سجل الدخول</Text></Pressable>
  </ScrollView>;
}
