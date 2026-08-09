import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { ACTIVE_TRIP_STATUSES } from '../../redux/slices/client/tripSlice';

const TABS = [
  { name: 'Home', icon: 'home-outline', activeIcon: 'home', label: 'الرئيسية' },
  { name: 'History', icon: 'time-outline', activeIcon: 'time', label: 'رحلاتي' },
  { name: 'Favorites', icon: 'heart-outline', activeIcon: 'heart', label: 'المفضلة' },
  { name: 'Profile', icon: 'person-outline', activeIcon: 'person', label: 'حسابي' },
];

const PILL_H_PADDING = 6;
const SPRING_CONFIG = { damping: 18, stiffness: 220, mass: 0.7 };

// -------------------- Tab Button --------------------
const TabButton = ({
  route,
  index,
  isFocused,
  isPending,
  disabled,
  colors,
  theme,
  hasActiveTrip,
  onPress,
  onLayout,
}) => {
  const tab = TABS.find(t => t.name === route.name) ?? TABS[index];
  const focusProgress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    focusProgress.value = withSpring(isFocused ? 1 : 0, SPRING_CONFIG);
  }, [isFocused, focusProgress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + focusProgress.value * 0.14 }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      focusProgress.value,
      [0, 1],
      [colors.iconInactive, colors.iconActive],
    ),
  }));

  return (
    <Pressable
      disabled={disabled}
      accessibilityRole='tab'
      accessibilityState={{ selected: isFocused, disabled }}
      hitSlop={8}
      onPress={onPress}
      onLayout={onLayout}
      style={{ minHeight: 54, opacity: disabled && !isFocused ? 0.55 : 1 }}
      className='flex-1 items-center justify-center gap-0.5'>
      <Animated.View style={[{ overflow: 'visible' }, iconStyle]}>
        {isPending ? (
          <ActivityIndicator size='small' color={colors.iconActive} />
        ) : (
          <Ionicons
            name={isFocused ? tab.activeIcon : tab.icon}
            size={24}
            color={isFocused ? colors.iconActive : colors.iconInactive}
          />
        )}
        {route.name === 'Home' && hasActiveTrip ? (
          <View
            pointerEvents='none'
            style={{
              position: 'absolute',
              top: -3,
              right: -5,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.primary,
              borderColor: colors.overlay,
              borderWidth: 1.5,
            }}
          />
        ) : null}
      </Animated.View>
      <Animated.Text
        style={[
          { ...theme.typography.tiny, fontSize: 12 },
          labelStyle,
        ]}>
        {tab.label}
      </Animated.Text>
    </Pressable>
  );
};

// -------------------- Navigation --------------------
const Navigation = ({ state, navigation }) => {
  const { theme } = useTheme();
  const { colors, shadows: elevation } = theme;
  const insets = useSafeAreaInsets();
  const currentTripStatus = useSelector(state => state.trip?.currentTrip?.status);
  const hasActiveTrip = ACTIVE_TRIP_STATUSES.includes(String(currentTripStatus || '').toLowerCase());
  const tabLayouts = useRef([]);
  const transitionTimer = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [pendingIndex, setPendingIndex] = useState(null);

  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);

  useEffect(() => {
    const layout = tabLayouts.current[state.index];
    if (isReady && layout) {
      pillX.value = withSpring(layout.x + PILL_H_PADDING, SPRING_CONFIG);
      pillWidth.value = withSpring(layout.width - PILL_H_PADDING * 2, SPRING_CONFIG);
    }
  }, [state.index, isReady, pillX, pillWidth]);

  useEffect(() => {
    const clearPending = setTimeout(() => setPendingIndex(null), 0);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    return () => clearTimeout(clearPending);
  }, [state.index]);

  useEffect(() => () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
  }, []);

  const handleTabPress = (route, index) => {
    const isFocused = state.index === index;
    if (pendingIndex !== null) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });

    if (!isFocused && !event.defaultPrevented) {
      setPendingIndex(index);
      navigation.navigate(route.name);
      transitionTimer.current = setTimeout(() => setPendingIndex(null), 380);
    }
  };

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillWidth.value,
  }));

  // بنفرض LTR على الشريط نفسه بس عشان الـ transform/translateX يفضل متوقع (transform
  // مش بيتعكس تلقائي مع RTL زي left/right)، وبنعكس ترتيب العرض يدوياً عشان
  // الشكل النهائي يفضل RTL صح (الرئيسية على اليمين).
  const orderedRoutes = [...state.routes]
    .map((route, index) => ({ route, index }))
    .reverse();

  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: Math.max(insets.bottom + 10, 22),
        minHeight: 70,
        overflow: 'visible',
        backgroundColor: colors.overlay,
        direction: 'ltr',
        ...elevation.floating,
      }}
      className='flex-row rounded-full px-2 py-2'>
      <Animated.View
        pointerEvents='none'
        style={[
          {
            position: 'absolute',
            top: 6,
            bottom: 6,
            borderRadius: 20,
            backgroundColor: colors.primaryMuted,
            borderWidth: 1.5,
            borderColor: colors.borderFocused,
          },
          pillStyle,
        ]}
      />

      {orderedRoutes.map(({ route, index }) => {
        const isFocused = state.index === index;
        return (
          <TabButton
            key={route.key}
            route={route}
            index={index}
            isFocused={isFocused}
            isPending={pendingIndex === index}
            disabled={pendingIndex !== null}
            colors={colors}
            theme={theme}
            hasActiveTrip={hasActiveTrip}
            onPress={() => handleTabPress(route, index)}
            onLayout={e => {
              const { x, width } = e.nativeEvent.layout;
              tabLayouts.current[index] = { x, width };
              if (!isReady && tabLayouts.current.filter(Boolean).length === TABS.length) {
                setIsReady(true);
                const activeLayout = tabLayouts.current[state.index];
                if (activeLayout) {
                  pillX.value = activeLayout.x + PILL_H_PADDING;
                  pillWidth.value = activeLayout.width - PILL_H_PADDING * 2;
                }
              }
            }}
          />
        );
      })}
    </View>
  );
};

export default Navigation;