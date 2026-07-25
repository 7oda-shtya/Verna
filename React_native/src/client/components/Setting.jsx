import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const Setting = ({ isOpen, onClose }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isVisible, setIsVisible] = useState(isOpen);
  const translateX = useRef(new Animated.Value(width)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      translateX.setValue(width);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
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
        if (finished) setIsVisible(false);
      });
    }
  }, [backdropOpacity, isOpen, translateX, width]);

  if (!isVisible) return null;

  return (
    <Modal transparent visible={isVisible} animationType='none' statusBarTranslucent onRequestClose={onClose}>
      <View className='flex-1 relative'>
        <Animated.View 
          className='absolute inset-0 bg-zinc-900/60' 
          style={{ opacity: backdropOpacity }}
        >
          <Pressable className='w-full h-full' onPress={onClose} />
        </Animated.View>

        <Animated.View
          className='absolute left-0 top-0 bottom-0 h-full w-[82%] bg-zinc-900 border-l border-zinc-800 px-6 rounded-l-2xl flex flex-col justify-between overflow-hidden z-10'
          style={[
            {
              paddingTop: insets.top + 24,
              paddingBottom: Math.max(insets.bottom, 24),
              transform: [{ translateX }],
            },
          ]}>
          <View>
            {/* الهيدر */}
            <View className='flex-row items-center justify-between mb-8'>
              <Text className='text-2xl font-bold text-white'>الإعدادات</Text>
              <Pressable 
                onPress={onClose} 
                className='bg-zinc-800/60 rounded-full w-10 h-10 flex items-center justify-center active:scale-95'
              >
                <FontAwesome name='times' size={14} color='#d4d4d8' />
              </Pressable>
            </View>

            {/* الخيارات */}
            <View className='flex flex-col gap-3'>
              <Pressable className='w-full p-4 bg-zinc-800/40 border border-zinc-800/30 rounded-xl flex-row justify-between items-center active:scale-[0.99]'>
                <Text className='font-medium text-white'>اللغة</Text>
                <Text className='text-zinc-500 text-sm'>العربية</Text>
              </Pressable>

              <Pressable className='w-full p-4 bg-zinc-800/40 border border-zinc-800/30 rounded-xl flex-row justify-between items-center active:scale-[0.99]'>
                <Text className='font-medium text-white'>الوضع الداكن</Text>
                <Text className='text-green-500 text-sm'>مفعل</Text>
              </Pressable>

              <Pressable className='w-full p-4 bg-zinc-800/40 border border-zinc-800/30 rounded-xl flex-row justify-between items-center active:scale-[0.99]'>
                <Text className='font-medium text-white'>التنبيهات</Text>
                <Text className='text-zinc-500'>›</Text>
              </Pressable>

              <Pressable className='w-full p-4 bg-zinc-800/40 border border-zinc-800/30 rounded-xl flex-row justify-between items-center active:scale-[0.99]'>
                <Text className='font-medium text-white'>تغيير كلمة المرور</Text>
                <Text className='text-zinc-500'>›</Text>
              </Pressable>

              <Pressable className='w-full p-4 bg-zinc-800/40 border border-zinc-800/30 rounded-xl flex-row justify-between items-center active:scale-[0.99]'>
                <Text className='font-medium text-white'>مساعدة ودعم</Text>
                <Text className='text-zinc-500'>›</Text>
              </Pressable>
            </View>
          </View>

          {/* الجزء السفلي */}
          <View className='flex flex-col gap-4 items-center w-full'>
            <View className='flex-row justify-between items-center w-full gap-4'>
              <Pressable className='flex-1 p-3 bg-zinc-800 border border-zinc-700 rounded-xl active:scale-95 items-center justify-center'>
                <Text className='text-red-500 font-medium text-center text-sm'>تسجيل الخروج</Text>
              </Pressable>

              <Pressable className='flex-1 p-3 bg-red-950/30 border border-red-900/40 rounded-xl active:scale-95 items-center justify-center'>
                <Text className='text-red-400 font-medium text-center text-xs'>حذف الحساب</Text>
              </Pressable>
            </View>

            <Text className='text-xs text-zinc-600 font-mono tracking-wider'>نسخة 1.0.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default Setting;