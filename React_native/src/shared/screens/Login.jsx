import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Image, ImageBackground, Keyboard, Pressable, Text, TextInput, View, Platform, Animated, LayoutAnimation, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import NeonStreaks from '../components/NeonStreaks';
import { login, clearAuthError } from '../../redux/slices/client/authSlice';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Login({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState({ phone: '', password: '' });

  const errorTemplates = {
    phoneEmpty: 'ادخل رقم الهاتف',
    phoneLength: 'رقم الهاتف يجب أن يكون 10 أرقام',
    passwordEmpty: 'ادخل كلمة المرور',
    passwordLength: 'الباسورد يجب أن يكون 6 حروف على الأقل',
  };

  const shiftAnim = useRef(new Animated.Value(0)).current;

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
  }, []);

  const handleLogin = () => {
    let valid = true;
    let phoneErr = '';
    let passwordErr = '';

    let cleanedPhone = phone.trim();
    if (cleanedPhone.startsWith('0')) {
      cleanedPhone = cleanedPhone.substring(1);
    }

    if (!phone.trim()) {
      phoneErr = errorTemplates.phoneEmpty;
      valid = false;
    } else {
      const egPhoneRegex = /^(10|11|12|15)\d{8}$/;
      if (!egPhoneRegex.test(cleanedPhone)) {
        phoneErr = 'أدخل رقم هاتف مصري صحيح';
        valid = false;
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

    const fullPhone = `+20${cleanedPhone}`;
    dispatch(login({ phone: fullPhone, password }));
  };

  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  return (
    <SafeAreaView className='flex-1 bg-black'>
			<View className="absolute inset-0 w-full h-full bg-black/50 z-1"></View>
			
      <StatusBar style='light' />

      <Pressable className='absolute top-16 left-4 z-20 flex-row items-center gap-1 rounded-full bg-white/10 px-3 py-2 border border-white/15' onPress={() => {}}>
        <Ionicons name='headset-outline' size={16} color='#67e8f9' />
        <Text className='text-white text-lg'>الدعم</Text>
      </Pressable>

      <Pressable className='flex-1' onPress={Keyboard.dismiss}>
        <ImageBackground source={require('../../../assets/images/loginBg5.png')} resizeMode='cover' className='flex-1 w-full justify-center items-center px-6'>
          <Animated.View style={{ transform: [{ translateY: shiftAnim }] }} className='w-full max-w-md items-center'>
            <Image source={require('../../../assets/images/Logo.png')} resizeMode='contain' className='h-32 w-60 mb-8' />

            <View className='w-full bg-black/40 px-4 py-6 rounded-2xl shadow-2xl border border-white/5'>
              <Text className='text-center text-gray-400 text-3xl font-bold mb-6'>سجل دخولك الآن</Text>

              {error ? (
                <View className='mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2'>
                  <Text className='text-center text-red-400 text-sm'>{error}</Text>
                </View>
              ) : null}

              <View className='flex-row justify-between items-center mb-2 px-1'>
                <Text className='text-white/80 text-xl'>رقم الهاتف</Text>
                {fieldErrors.phone ? <Text className='text-red-400 text-sm font-semibold'>{fieldErrors.phone}</Text> : null}
              </View>

              <View className={`relative flex-row items-center overflow-visible rounded-2xl border ${fieldErrors.phone ? 'border-red-500' : 'border-cyan-300/30'} bg-zinc-900/80 px-3 py-3 mb-5`}>
                <View className='flex-row items-center gap-2 border-r border-white/10 pr-3 mr-3'>
                  <Text style={{ writingDirection: 'ltr' }} className='text-white text-base'>
                    +20
                  </Text>
                </View>
                <Ionicons name='call-outline' size={18} color={fieldErrors.phone ? '#f87171' : '#67e8f9'} />
                <TextInput
                  placeholder='ادخل رقم الهاتف'
                  placeholderTextColor='rgba(255,255,255,0.38)'
                  keyboardType='phone-pad'
                  textAlign='right'
                  value={phone}
                  onChangeText={text => {
                    setPhone(text);
                    if (fieldErrors.phone) {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setFieldErrors(prev => ({ ...prev, phone: '' }));
                    }
                    if (error) dispatch(clearAuthError());
                  }}
                  className='outline-none flex-1 text-white text-base mr-3'
                />
                {!fieldErrors.phone && <NeonStreaks width={100} height={100} color='#22D3EE' style={{ left: -60, top: -20 }} />}
              </View>

              <View className='flex-row justify-between items-center mb-2 px-1'>
                <Text className='text-left text-white/80 text-xl'>كلمة المرور</Text>
                {fieldErrors.password ? <Text className='text-red-400 text-sm font-semibold'>{fieldErrors.password}</Text> : null}
              </View>

              <View className={`flex-row items-center rounded-2xl border ${fieldErrors.password ? 'border-red-500' : 'border-white/10'} bg-zinc-900/80 px-3 py-3`}>
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
                  className='outline-none flex-1 text-white text-base mx-3'
                />
                <Pressable onPress={toggleSecureEntry}>
                  <Ionicons name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'} size={18} color='rgba(255,255,255,0.7)' />
                </Pressable>
              </View>

              <Pressable onPress={handleLogin} disabled={loading} className='relative mt-6 overflow-hidden rounded-2xl bg-lime-400 py-4' style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? <ActivityIndicator color='#000' /> : <Text className='text-center text-zinc-950 text-lg font-bold'>تسجيل الدخول</Text>}
              </Pressable>

              <Pressable className='mt-4' onPress={() => navigation.navigate('ForgotPassword')}>
                <Text className='text-center text-white/90 underline'>نسيت كلمة المرور؟</Text>
              </Pressable>
            </View>

            <View className='mt-6 flex-row items-center justify-center gap-2'>
              <Text className='text-red-700 text-xl'>ليس لديك حساب؟</Text>
              <Pressable onPress={() => navigation.navigate('SignUp')}>
                <Text className='text-white font-bold underline'>إنشاء حساب</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ImageBackground>
      </Pressable>
    </SafeAreaView>
  );
}
