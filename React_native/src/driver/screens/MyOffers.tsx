import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../theme/useTheme';
import { cancelOffer } from '../../redux/slices/driver/tripSlice';
import Tag from '../../client/components/Tag';

const STATUS_TAGS: Record<string, { label: string; color: 'amber' | 'green' | 'red' | 'blue' }> = {
  PENDING: { label: 'بانتظار الرد', color: 'amber' },
  ACCEPTED: { label: 'مقبول', color: 'green' },
  REJECTED: { label: 'مرفوض', color: 'red' },
  CANCELLED: { label: 'ملغي', color: 'red' },
};

export default function MyOffers() {
  const dispatch = useDispatch<any>();
  const { theme } = useTheme();
  const { colors } = theme;
  // There's no GET /driver/offers endpoint, so this list only reflects offers made this app
  // session (populated by makeOffer.fulfilled in tripSlice) and won't survive an app restart.
  // Nothing to pull-to-refresh against — intentionally no RefreshControl here.
  const offers = useSelector((state: any) => state.trip.offers);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const cancel = async (offerId: string) => {
    setCancellingId(offerId);
    try { await dispatch(cancelOffer(offerId)).unwrap(); }
    finally { setCancellingId(null); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 18, gap: 14 }}>
      <Text style={{ ...theme.typography.display, color: colors.textPrimary }}>عروضي</Text>

      {!offers.length ? (
        <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 60 }}>لا توجد عروض مرسلة الآن.</Text>
      ) : null}

      {offers.map((offer: any) => {
        const trip = offer.trip;
        const statusTag = STATUS_TAGS[offer.status] || STATUS_TAGS.PENDING;
        return (
          <View key={offer.id} style={{ padding: 16, gap: 10, borderRadius: 18, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <Text style={{ flex: 1, color: colors.textPrimary, fontWeight: '800', textAlign: 'right' }}>
                {trip ? `${trip.startName || 'نقطة البداية'} ← ${trip.endName || 'الوجهة'}` : 'تفاصيل الرحلة غير متاحة'}
              </Text>
              <Tag color={statusTag.color}>{statusTag.label}</Tag>
            </View>
            <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
              <Text style={{ color: colors.textSecondary }}>السعر: {offer.price} ج.م</Text>
              {offer.timeToReach ? <Text style={{ color: colors.textSecondary }}>الوصول خلال {offer.timeToReach}</Text> : null}
            </View>
            {offer.status === 'PENDING' ? (
              <Pressable disabled={cancellingId === offer.id} onPress={() => cancel(offer.id)} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.errorMuted, opacity: cancellingId === offer.id ? 0.65 : 1 }}>
                {cancellingId === offer.id ? <ActivityIndicator color={colors.error} /> : <Text style={{ color: colors.error, fontWeight: '800' }}>إلغاء العرض</Text>}
              </Pressable>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}
