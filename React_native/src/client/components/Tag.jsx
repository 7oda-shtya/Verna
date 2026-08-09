import React from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '../../theme/useTheme'

const Tag = ({ children, color = 'blue', pulse = false, className = '' }) => {
  const { theme } = useTheme()
  const { colors } = theme
  const variants = {
    blue: { foreground: colors.info, background: colors.primaryMuted },
    green: { foreground: colors.success, background: colors.primaryMuted },
    red: { foreground: colors.error, background: colors.errorMuted },
    amber: { foreground: colors.warning, background: colors.warningMuted },
  }
  const variant = variants[color] || variants.blue

  return (
    <View
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${pulse ? 'animate-pulse' : ''} ${className}`}
      style={{
        backgroundColor: variant.background,
        borderColor: variant.foreground,
        borderWidth: theme.borderWidths.subtle,
      }}
    >
      <View className='flex-row items-center gap-1.5'>
        <Text className='text-[11px] font-bold leading-none' style={{ color: variant.foreground }}>
          {children}
        </Text>
      </View>
    </View>
  )
}

export default Tag
