import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getWalletRequests, submitRechargeRequest } from '../../api/wallet.api';
import { useTheme } from '../../theme/useTheme';
import { addRechargeRequest, setRechargeRequests } from '../../redux/slices/client/authSlice';

const statusLabels = { PENDING: 'قيد المراجعة', APPROVED: 'مقبول', REJECTED: 'مرفوض' };

export default function WalletRequests({ navigation }) {
  const { theme } = useTheme();
  const { colors } = theme;
  const dispatch = useDispatch();
  const wallet = useSelector(state => state.auth.wallet);
  const requests = useSelector(state => state.auth.rechargeRequests);
  const requestsLoaded = useSelector(state => state.auth.rechargeRequestsLoaded);
  const [amount, setAmount] = useState('');
  const [proof, setProof] = useState('');
  const [initialLoading, setInitialLoading] = useState(!requestsLoaded);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadRequests = useCallback(async () => {
    setError('');
    try {
      const { data: response } = await getWalletRequests();
      dispatch(setRechargeRequests(response.data.recharges));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'تعذر تحميل طلبات المحفظة');
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (requestsLoaded) return undefined;
    const timer = setTimeout(loadRequests, 0);
    return () => clearTimeout(timer);
  }, [loadRequests, requestsLoaded]);

  const refreshRequests = useCallback(() => {
    setRefreshing(true);
    loadRequests();
  }, [loadRequests]);

  const sortedRequests = useMemo(
    () => [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [requests],
  );

  const submit = async () => {
    const numericAmount = Number(amount);
    if (!Number.isInteger(numericAmount) || numericAmount <= 0) return setError('اكتب مبلغًا صحيحًا أكبر من صفر');
    if (!proof.trim()) return setError('مرجع التحويل أو إثبات العملية مطلوب');

    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await submitRechargeRequest(numericAmount, proof.trim());
      dispatch(addRechargeRequest(response.data.data));
      setAmount('');
      setProof('');
      setMessage('تم إرسال طلب الشحن');
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'تعذر إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <Pressable onPress={() => navigation.goBack()}><Ionicons name='arrow-back' size={25} color={colors.textPrimary} /></Pressable>
        <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '800' }}>إدارة المحفظة</Text>
      </View>
      <FlatList
        data={sortedRequests}
        keyExtractor={item => item.id}
        refreshing={refreshing}
        onRefresh={refreshRequests}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        ListHeaderComponent={(
          <View style={{ gap: 14, marginBottom: 18 }}>
            <View style={{ ...theme.components.card, padding: 18 }}>
              <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>الرصيد الحالي</Text>
              <Text style={{ color: colors.warning, textAlign: 'center', fontSize: 28, fontWeight: '800', marginTop: 6 }}>{wallet} جنيه</Text>
            </View>
            <TextInput value={amount} onChangeText={value => setAmount(value.replace(/\D/g, ''))} keyboardType='number-pad' placeholder='المبلغ' placeholderTextColor={colors.placeholder} style={{ ...theme.components.input, color: colors.textPrimary, height: 54, textAlign: 'right' }} />
            <TextInput value={proof} onChangeText={setProof} placeholder='رقم مرجع Vodafone Cash أو التحويل البنكي' placeholderTextColor={colors.placeholder} style={{ ...theme.components.input, color: colors.textPrimary, minHeight: 54, textAlign: 'right' }} />
            {error ? <Text style={{ color: colors.error, textAlign: 'center' }}>{error}</Text> : null}
            {message ? <Text style={{ color: colors.success, textAlign: 'center' }}>{message}</Text> : null}
            <Pressable disabled={submitting} onPress={submit} style={{ ...theme.components.primaryButton, padding: 14, opacity: submitting ? 0.65 : 1 }}>
              {submitting ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={{ ...theme.components.primaryButtonText, textAlign: 'center' }}>إرسال طلب الشحن</Text>}
            </Pressable>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 8 }}>سجل طلبات الشحن</Text>
          </View>
        )}
        ListEmptyComponent={
          initialLoading
            ? <ActivityIndicator color={colors.primary} />
            : <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>لا توجد طلبات شحن سابقة</Text>
        }
        renderItem={({ item }) => {
          const statusColor = item.status === 'APPROVED' ? colors.success : item.status === 'REJECTED' ? colors.error : colors.warning;
          return (
            <View style={{ ...theme.components.card, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>طلب شحن — {item.amount} جنيه</Text>
                <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{item.proof}</Text>
              </View>
              <Text style={{ color: statusColor, fontWeight: '700' }}>{statusLabels[item.status] || item.status}</Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}
