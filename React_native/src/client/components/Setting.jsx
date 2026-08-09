import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { THEME_LIST } from '../../theme/themes';
import { useTheme } from '../../theme/useTheme';
import { logout } from '../../redux/slices/client/authSlice';
import { deleteAccountRequest } from '../../api/auth.api';

const ConfirmationModal = ({ visible, title, description, confirmLabel, danger = false, passwordRequired = false, loading, error, onCancel, onConfirm }) => {
  const { theme } = useTheme();
  const [password, setPassword] = useState('');

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onCancel}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: theme.colors.backdrop }}>
        <View style={{ ...theme.components.modal, padding: 20, gap: 14 }}>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 21, fontWeight: '800', textAlign: 'center' }}>{title}</Text>
          <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 21 }}>{description}</Text>
          {passwordRequired ? (
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder='كلمة السر'
              placeholderTextColor={theme.colors.placeholder}
              style={{ ...theme.components.input, color: theme.colors.textPrimary, height: 52, textAlign: 'right' }}
            />
          ) : null}
          {error ? <Text style={{ color: theme.colors.error, textAlign: 'center' }}>{error}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable disabled={loading} onPress={onCancel} style={{ ...theme.components.secondaryButton, padding: 14, flex: 1 }}>
              <Text style={{ ...theme.components.secondaryButtonText, textAlign: 'center' }}>إلغاء</Text>
            </Pressable>
            <Pressable disabled={loading || (passwordRequired && !password)} onPress={() => onConfirm(password)} style={{ padding: 14, flex: 1, borderRadius: theme.radius.lg, backgroundColor: danger ? theme.colors.error : theme.colors.primary, opacity: loading ? 0.65 : 1 }}>
              {loading ? <ActivityIndicator color='#fff' /> : <Text style={{ color: danger ? '#fff' : theme.colors.onPrimary, textAlign: 'center', fontWeight: '800' }}>{confirmLabel}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const Setting = ({ isOpen, onClose }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { theme, themeId, setTheme } = useTheme();
  const [themesOpen, setThemesOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [translateX] = useState(() => new Animated.Value(width));
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [themeExpandProgress] = useState(() => new Animated.Value(0));

  const runCloseAnimation = callback => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: width,
        duration: 280,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onClose();
        callback?.();
      }
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    translateX.setValue(width);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, isOpen, translateX, width]);

  const toggleThemes = () => {
    const next = !themesOpen;
    setThemesOpen(next);
    Animated.timing(themeExpandProgress, {
      toValue: next ? 1 : 0,
      duration: next ? 440 : 320,
      easing: next ? Easing.bezier(0.22, 1, 0.36, 1) : Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  };

  const selectTheme = id => {
    setTheme(id);
    setThemesOpen(false);
    Animated.timing(themeExpandProgress, {
      toValue: 0,
      duration: 320,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  };

  const arrowRotation = themeExpandProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const themeListMaxHeight = themeExpandProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 340],
  });
  const themeListTranslateY = themeExpandProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const openScreen = screen => {
    runCloseAnimation(() => navigation.navigate(screen));
  };

  const confirmLogout = async () => {
    setLoading(true);
    await dispatch(logout());
    setLoading(false);
    setConfirmation(null);
    onClose();
  };

  const confirmDelete = async password => {
    setLoading(true);
    setError('');
    try {
      await deleteAccountRequest(password);
      await dispatch(logout());
      setConfirmation(null);
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'تعذر حذف الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal transparent visible={isOpen} animationType='none' statusBarTranslucent onRequestClose={() => runCloseAnimation()}>
        <View style={{ flex: 1, direction: 'ltr' }}>
          {toast ? (
            <View style={{ position: 'absolute', top: insets.top + 10, alignSelf: 'center', zIndex: 30, backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.warning, borderWidth: 1, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 11 }}>
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>{toast}</Text>
            </View>
          ) : null}
          <Animated.View style={{ position: 'absolute', inset: 0, opacity: backdropOpacity, backgroundColor: theme.colors.backdrop }}>
            <Pressable style={{ flex: 1 }} onPress={() => runCloseAnimation()} />
          </Animated.View>
          <Animated.View style={{ position: 'absolute', right: 0, left: 'auto', top: 0, bottom: 0, width: '84%', direction: 'rtl', backgroundColor: theme.colors.surface, paddingHorizontal: 22, paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 24), justifyContent: 'space-between', transform: [{ translateX }] }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
                <Text style={{ color: theme.colors.textPrimary, fontSize: 25, fontWeight: '800' }}>الإعدادات</Text>
                <Pressable onPress={() => runCloseAnimation()} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceElevated }}>
                  <FontAwesome name='times' size={15} color={theme.colors.iconInactive} />
                </Pressable>
              </View>

              <View style={{ gap: 10 }}>
                <Pressable onPress={() => setToast('غير متوفر حاليًا')} style={{ ...theme.components.cardElevated, padding: 15, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.colors.textDisabled }}>اللغة</Text>
                  <Text style={{ color: theme.colors.textDisabled }}>العربية 🔒</Text>
                </Pressable>

                <View style={{ ...theme.components.cardElevated, overflow: 'hidden' }}>
                  <Pressable onPress={toggleThemes} style={{ padding: 15, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.colors.textPrimary }}>الثيم</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: theme.colors.primary }}>{theme.label}</Text>
                      <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
                        <FontAwesome name='chevron-down' size={11} color={theme.colors.iconInactive} />
                      </Animated.View>
                    </View>
                  </Pressable>
                  <Animated.View pointerEvents={themesOpen ? 'auto' : 'none'} style={{ maxHeight: themeListMaxHeight, opacity: themeExpandProgress, overflow: 'hidden', transform: [{ translateY: themeListTranslateY }] }}>
                    <View style={{ padding: 10, gap: 7 }}>
                      {THEME_LIST.map(item => (
                        <Pressable key={item.id} onPress={() => selectTheme(item.id)} style={{ backgroundColor: item.colors.surface, borderColor: item.id === themeId ? item.colors.primary : item.colors.border, borderWidth: 1, padding: 11, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: item.colors.textPrimary }}>{item.label}</Text>
                          {item.id === themeId ? <FontAwesome name='check-circle' size={17} color={item.colors.primary} /> : null}
                        </Pressable>
                      ))}
                    </View>
                  </Animated.View>
                </View>

                <View style={{ ...theme.components.cardElevated, padding: 15, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.colors.textPrimary }}>التنبيهات</Text>
                  <Text style={{ color: theme.colors.textSecondary }}>›</Text>
                </View>

                <Pressable onPress={() => openScreen('ChangePassword')} style={{ ...theme.components.cardElevated, padding: 15, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.colors.textPrimary }}>تغيير كلمة السر</Text>
                  <Text style={{ color: theme.colors.textSecondary }}>›</Text>
                </Pressable>

                <Pressable onPress={() => openScreen('Support')} style={{ ...theme.components.cardElevated, padding: 15, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.colors.textPrimary }}>مساعدة ودعم</Text>
                  <Text style={{ color: theme.colors.textSecondary }}>›</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => { setError(''); setConfirmation('logout'); }} style={{ ...theme.components.cardElevated, padding: 13, flex: 1 }}>
                  <Text style={{ color: theme.colors.error, textAlign: 'center', fontWeight: '700' }}>تسجيل الخروج</Text>
                </Pressable>
                <Pressable onPress={() => { setError(''); setConfirmation('delete'); }} style={{ padding: 13, flex: 1, borderRadius: theme.radius.lg, backgroundColor: theme.colors.errorMuted, borderColor: theme.colors.error, borderWidth: 1 }}>
                  <Text style={{ color: theme.colors.error, textAlign: 'center', fontWeight: '700' }}>حذف الحساب</Text>
                </Pressable>
              </View>
              <Text style={{ color: theme.colors.textMuted, textAlign: 'center', fontSize: 12 }}>نسخة 1.0.0</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {confirmation === 'logout' ? <ConfirmationModal visible title='تسجيل الخروج' description='هل أنت متأكد إنك عايز تسجل خروج؟' confirmLabel='تسجيل الخروج' loading={loading} error={error} onCancel={() => setConfirmation(null)} onConfirm={confirmLogout} /> : null}
      {confirmation === 'delete' ? <ConfirmationModal visible title='حذف الحساب' description='سيتم تعطيل الحساب وإزالة بياناته الشخصية. اكتب كلمة السر للتأكيد.' confirmLabel='حذف نهائي' danger passwordRequired loading={loading} error={error} onCancel={() => setConfirmation(null)} onConfirm={confirmDelete} /> : null}
    </>
  );
};

export default Setting;
