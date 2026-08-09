import React from 'react'
import { Pressable, Text, View, Linking } from 'react-native'
import Tag from './Tag'
import { useTheme } from '../../theme/useTheme'

export const SentRates = ({ rates }) => {
  const { theme } = useTheme()
  const { colors } = theme
  if (!rates || rates.length === 0) {
    return <Text className='text-sm text-center py-8 font-light' style={{ color: colors.textMuted }}>لا توجد تقييمات مرسلة حتى الآن</Text>
  }

  return (
    <View className='space-y-3.5 w-full'>
      {rates.map((rate, index) => {
        const stars = Math.min(5, Math.max(1, Number(rate.value || 5)))
        return (
          <View key={rate.id || index} className='w-full p-4 rounded-2xl flex-col gap-2.5 shadow-sm' style={theme.components.cardElevated}>
            <View className='flex-row justify-between items-center pb-2.5' style={{ borderBottomColor: colors.divider, borderBottomWidth: theme.borderWidths.subtle }}>
              <Tag color='blue'>تقييم مرسل</Tag>
              <View className='flex-row gap-0.5 px-2 py-1 rounded-lg items-center' style={{ backgroundColor: colors.warningMuted }}>
                {[...Array(stars)].map((_, i) => (
                  <Text key={i} className='text-xs' style={{ color: colors.rating }}>★</Text>
                ))}
              </View>
            </View>

            <View className='flex-row justify-between items-center mt-1'>
              <Text className='text-xs' style={{ color: colors.textMuted }}>👤 <Text className='font-medium' style={{ color: colors.textPrimary }}>السائق:</Text> {rate.driverName || rate.driverId || '-'}</Text>
              <Text className='text-xs' style={{ color: colors.textMuted }}># <Text className='font-medium' style={{ color: colors.textPrimary }}>الرحلة:</Text> {rate.tripId || '-'}</Text>
            </View>

            {rate.comment && (
              <Text className='text-xs p-3 rounded-xl mt-1 text-right font-light leading-relaxed' style={{ color: colors.textSecondary, backgroundColor: colors.inputBackground, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}>
                {rate.comment}
              </Text>
            )}
          </View>
        )
      })}
    </View>
  )
}

export const ReceivedRates = ({ rates }) => {
  const { theme } = useTheme()
  const { colors } = theme
  if (!rates || rates.length === 0) {
    return <Text className='text-sm text-center py-8 font-light' style={{ color: colors.textMuted }}>لا توجد تقييمات مستلمة حتى الآن</Text>
  }

  return (
    <View className='space-y-3.5 w-full'>
      {rates.map((rate, index) => {
        const stars = Math.min(5, Math.max(1, Number(rate.value || 5)))
        return (
          <View key={rate.id || index} className='w-full p-4 rounded-2xl flex-col gap-2.5 shadow-sm' style={theme.components.cardElevated}>
            <View className='flex-row justify-between items-center pb-2.5' style={{ borderBottomColor: colors.divider, borderBottomWidth: theme.borderWidths.subtle }}>
              <Tag color='green'>تقييم مستلم</Tag>
              <View className='flex-row gap-0.5 px-2 py-1 rounded-lg items-center' style={{ backgroundColor: colors.warningMuted }}>
                {[...Array(stars)].map((_, i) => (
                  <Text key={i} className='text-xs' style={{ color: colors.rating }}>★</Text>
                ))}
              </View>
            </View>

            <View className='flex-row justify-between items-center mt-1'>
              <Text className='text-xs' style={{ color: colors.textMuted }}>👤 <Text className='font-medium' style={{ color: colors.textPrimary }}>الكابتن:</Text> {rate.driverName || rate.driverId || '-'}</Text>
              <Text className='text-xs' style={{ color: colors.textMuted }}># <Text className='font-medium' style={{ color: colors.textPrimary }}>الرحلة:</Text> {rate.tripId || '-'}</Text>
            </View>

            {rate.comment && (
              <Text className='text-xs p-3 rounded-xl mt-1 text-right font-light leading-relaxed' style={{ color: colors.textSecondary, backgroundColor: colors.inputBackground, borderColor: colors.border, borderWidth: theme.borderWidths.subtle }}>
                {rate.comment}
              </Text>
            )}
          </View>
        )
      })}
    </View>
  )
}

export const SentReports = ({ reports }) => {
  const { theme } = useTheme()
  const { colors } = theme
  if (!reports || reports.length === 0) {
    return <Text className='text-sm text-center py-8 font-light' style={{ color: colors.textMuted }}>لا توجد بلاغات مرسلة حتى الآن</Text>
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
      case 'resolved':
        return <Tag color='green'>تم الحل</Tag>
      case 'rejected':
        return <Tag color='red'>مرفوض</Tag>
      default:
        return <Tag color='blue' pulse>قيد المراجعة</Tag>
    }
  }

  return (
    <View className='space-y-3.5 w-full'>
      {reports.map((report, index) => (
        <View key={report.id || index} className='w-full p-4 rounded-2xl flex-col gap-2.5 shadow-sm' style={theme.components.cardElevated}>
          <View className='flex-row justify-between items-center pb-2.5' style={{ borderBottomColor: colors.divider, borderBottomWidth: theme.borderWidths.subtle }}>
            <Tag color='amber'>بلاغ مرسل منك</Tag>
            {getStatusBadge(report.status)}
          </View>

          <Text className='text-sm font-semibold mt-1 text-right' style={{ color: colors.textPrimary }}>
            السبب: <Text className='font-normal' style={{ color: colors.textSecondary }}>{report.reason}</Text>
          </Text>

          <View className='flex-row justify-between items-center pt-2.5 mt-1' style={{ borderTopColor: colors.divider, borderTopWidth: theme.borderWidths.subtle }}>
            <Text className='text-xs' style={{ color: colors.textMuted }}>👤 ضد السائق: {report.driverName || report.driverId || '-'}</Text>
            <Text className='text-xs' style={{ color: colors.textMuted }}># الرحلة: {report.tripId || '-'}</Text>
          </View>

          <View className='flex-row justify-between items-center mt-1'>
            <Text className='text-xs' style={{ color: colors.textMuted }}>{report.time || '-'}</Text>
            {report.attachment && (
              <Pressable onPress={() => Linking.openURL(report.attachment)}>
                <Text className='font-medium text-xs' style={{ color: colors.info }}>🔗 عرض المرفق</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
    </View>
  )
}

export const ReceivedReports = ({ reports }) => {
  const { theme } = useTheme()
  const { colors } = theme
  if (!reports || reports.length === 0) {
    return <Text className='text-sm text-center py-8 font-light' style={{ color: colors.textMuted }}>لا توجد بلاغات مستلمة حتى الآن</Text>
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
      case 'resolved':
        return <Tag color='green'>تم الفصل فيه</Tag>
      case 'rejected':
        return <Tag color='red'>ملغي / مرفوض</Tag>
      default:
        return <Tag color='blue' pulse>تحت التحقيق</Tag>
    }
  }

  return (
    <View className='space-y-3.5 w-full'>
      {reports.map((report, index) => (
        <View key={report.id || index} className='w-full p-4 rounded-2xl flex-col gap-2.5 shadow-sm' style={theme.components.cardElevated}>
          <View className='flex-row justify-between items-center pb-2.5' style={{ borderBottomColor: colors.divider, borderBottomWidth: theme.borderWidths.subtle }}>
            <Tag color='red'>شكوى مقدمة ضدك</Tag>
            {getStatusBadge(report.status)}
          </View>

          <Text className='text-sm font-semibold mt-1 text-right' style={{ color: colors.textPrimary }}>
            موضوع الشكوى: <Text className='font-normal' style={{ color: colors.textSecondary }}>{report.reason}</Text>
          </Text>

          <View className='flex-row justify-between items-center pt-2.5 mt-1' style={{ borderTopColor: colors.divider, borderTopWidth: theme.borderWidths.subtle }}>
            <Text className='text-xs' style={{ color: colors.textMuted }}>👤 صاحب البلاغ: {report.senderName || report.sender || 'سائق'}</Text>
            <Text className='text-xs' style={{ color: colors.textMuted }}># الرحلة: {report.tripId || '-'}</Text>
          </View>

          <View className='flex-row justify-between items-center mt-1'>
            <Text className='text-xs' style={{ color: colors.textMuted }}>{report.time || '-'}</Text>
            {report.attachment && (
              <Pressable onPress={() => Linking.openURL(report.attachment)}>
                <Text className='font-medium text-xs' style={{ color: colors.info }}>🔗 المستندات المرفقة</Text>
              </Pressable>
            )}
          </View>
        </View>
      ))}
    </View>
  )
}
