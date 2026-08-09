import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/useTheme';
import { logout } from '../../redux/slices/driver/authSlice';
import { getDriverEarningsRequest, getDriverHistoryRequest } from '../../api/driver.api';
import { getStoredReputation } from '../../utils/reputation';
import { ReputationDetailsModal, TemporaryBanBanner } from '../../client/components/ReputationStatus';

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function DriverProfile({ navigation }: any) {
  const dispatch = useDispatch<any>();
  const { theme } = useTheme();
  const { colors } = theme;
  const user = useSelector((state: any) => state.auth);
  const reputation = getStoredReputation(user);

  const [reputationDetailsVisible, setReputationDetailsVisible] = useState(false);
  const [earnings, setEarnings] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [earningsResponse, historyResponse] = await Promise.all([getDriverEarningsRequest(), getDriverHistoryRequest()]);
      setEarnings(earningsResponse.data?.data || null);
      setHistory(historyResponse.data?.data || []);
    } catch {
      setError('تعذر تحميل بيانات الأرباح والرحلات حاليًا');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load({ silent: true }); }, [load]));

  const refresh = () => {
    setRefreshing(true);
    load({ silent: true });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 18, gap: 14 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <TemporaryBanBanner user={user} onShowDetails={() => setReputationDetailsVisible(true)} />

      <View style={{ alignItems: 'center', gap: 10, padding: 20, borderRadius: 18, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}>
        <Image
          style={theme.components.avatar}
          source={user.avatar ? { uri: user.avatar } : require('../../../assets/images/user-icon.png')}
        />
        <Text style={{ ...theme.typography.title, color: colors.textPrimary }}>{user.name}</Text>
        {user.phone ? <Text style={{ color: colors.textSecondary, writingDirection: 'ltr' }}>{user.phone}</Text> : null}

        <Pressable onPress={() => setReputationDetailsVisible(true)} style={{ width: '100%', gap: 8, paddingTop: 12, marginTop: 4, borderTopColor: colors.divider, borderTopWidth: theme.borderWidths.subtle }}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors[reputation.colorKey], fontWeight: '800' }}>{reputation.label}</Text>
            <Text style={{ color: colors[reputation.colorKey], fontWeight: '800' }}>{reputation.score}%</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceElevated, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${reputation.score}%`, backgroundColor: colors[reputation.colorKey] }} />
          </View>
        </Pressable>
      </View>

      <View style={{ padding: 16, gap: 12, borderRadius: 18, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}>
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ ...theme.typography.subtitle, color: colors.textPrimary }}>بيانات السيارة</Text>
          <Pressable onPress={() => navigation.navigate('KycUpload')} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>تعديل المستندات</Text>
            <Ionicons name='chevron-back' size={14} color={colors.primary} />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12 }}>
          <Image
            source={user.car?.picture ? { uri: user.car.picture } : require('../../../assets/images/user-icon.png')}
            style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: colors.surfaceElevated }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '700', textAlign: 'right' }}>{user.car?.model || 'موديل غير محدد'}</Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'right', marginTop: 3 }}>{user.car?.plateNumber || 'رقم لوحة غير محدد'}</Text>
          </View>
        </View>
      </View>

      {error ? <Text style={{ color: colors.error, textAlign: 'right' }}>{error}</Text> : null}

      <View style={{ padding: 16, gap: 12, borderRadius: 18, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}>
        <Text style={{ ...theme.typography.subtitle, color: colors.textPrimary, textAlign: 'right' }}>الأرباح</Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : earnings ? (
          <>
            <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 12 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'right' }}>اليوم — نقدي</Text>
                <Text style={{ color: colors.textPrimary, fontWeight: '800', textAlign: 'right', marginTop: 3 }}>{earnings.daily?.cash ?? 0} ج.م</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 12 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'right' }}>اليوم — رقمي</Text>
                <Text style={{ color: colors.textPrimary, fontWeight: '800', textAlign: 'right', marginTop: 3 }}>{earnings.daily?.digital ?? 0} ج.م</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 12 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'right' }}>الأسبوع — نقدي</Text>
                <Text style={{ color: colors.textPrimary, fontWeight: '800', textAlign: 'right', marginTop: 3 }}>{earnings.weekly?.cash ?? 0} ج.م</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: 14, padding: 12 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'right' }}>الأسبوع — رقمي</Text>
                <Text style={{ color: colors.textPrimary, fontWeight: '800', textAlign: 'right', marginTop: 3 }}>{earnings.weekly?.digital ?? 0} ج.م</Text>
              </View>
            </View>
            <Pressable onPress={() => navigation.navigate('WalletRequests')} style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primaryMuted, borderRadius: 14, padding: 12 }}>
              <Text style={{ color: colors.primary, fontWeight: '800' }}>رصيد المحفظة: {earnings.digitalWalletBalance ?? 0} ج.م</Text>
              <Ionicons name='chevron-back' size={16} color={colors.primary} />
            </Pressable>
          </>
        ) : null}
      </View>

      <View style={{ padding: 16, gap: 10, borderRadius: 18, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}>
        <Text style={{ ...theme.typography.subtitle, color: colors.textPrimary, textAlign: 'right' }}>آخر الرحلات</Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : !history.length ? (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: 12 }}>لا توجد رحلات مكتملة بعد.</Text>
        ) : history.slice(0, 10).map((trip: any) => (
          <View key={trip.id} style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopColor: colors.divider, borderTopWidth: theme.borderWidths.subtle }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', textAlign: 'right' }}>{trip.client?.name || 'عميل'}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'right', marginTop: 2 }}>{formatDate(trip.completedAt)}</Text>
            </View>
            <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{trip.price} ج.م</Text>
          </View>
        ))}
      </View>

      <Pressable onPress={() => dispatch(logout())} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.errorMuted }}>
        <Text style={{ color: colors.error, fontWeight: '800' }}>تسجيل الخروج</Text>
      </Pressable>

      <ReputationDetailsModal visible={reputationDetailsVisible} onClose={() => setReputationDetailsVisible(false)} reputation={reputation} banReason={user.banReason} />
    </ScrollView>
  );
}
