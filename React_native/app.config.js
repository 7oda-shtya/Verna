const APP_VARIANT = process.env.APP_VARIANT || 'client';
const isDriver = APP_VARIANT === 'driver';

if (!['client', 'driver'].includes(APP_VARIANT)) {
  throw new Error(`APP_VARIANT must be "client" or "driver". Received: ${APP_VARIANT}`);
}

const appIdentifier = isDriver ? 'com.shtya.verna.driver' : 'com.shtya.verna.client';
const googleServicesFile = isDriver ? './google-services.driver.json' : './google-services.client.json';

/** @type {import('@expo/config').ExpoConfig} */
module.exports = {
  name: isDriver ? 'Verna Driver' : 'Verna',
  slug: 'verna',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: isDriver ? 'verna-driver' : 'verna',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  android: {
    adaptiveIcon: { backgroundColor: '#E6F4FE' },
    predictiveBackGestureEnabled: false,
    package: appIdentifier,
    softwareKeyboardLayoutMode: 'pan',
    googleServicesFile,
  },
  ios: { bundleIdentifier: appIdentifier },
  web: { output: 'single' },
  plugins: [
    'expo-font',
    'expo-image',
    'expo-status-bar',
    ['expo-notifications', { icon: './assets/images/icon.png', color: '#FF6B00', defaultChannel: 'default' }],
    'expo-web-browser',
    'expo-background-task',
    [
      'expo-location',
      {
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
        locationWhenInUsePermission: 'بنستخدم موقعك عشان نحدد نقطة انطلاق رحلتك ونعرضها بشكل مباشر للسائق أو العميل أثناء الرحلة النشطة.',
        locationAlwaysAndWhenInUsePermission: 'بنحتاج نوصل لموقعك في الخلفية أثناء الرحلة النشطة فقط، عشان الطرف التاني (السائق أو العميل) يقدر يتابع مكانك لحظيًا حتى لو التطبيق مش مفتوح على الشاشة. المشاركة دي بتتوقف تلقائيًا بمجرد ما الرحلة تخلص.',
      },
    ],
    'expo-secure-store',
    '@maplibre/maplibre-react-native',
    ['expo-image-picker', { photosPermission: 'بنستخدم صورك عشان تقدر تغيّر صورة البروفايل بتاعتك.' }],
    '@react-native-community/datetimepicker',
    ['expo-splash-screen', { image: './assets/images/fake-splash.png', imageWidth: 220, backgroundColor: '#0B1E3F', resizeMode: 'contain', dark: { backgroundColor: '#0B1E3F' } }],
  ],
  experiments: { reactCompiler: true },
  extra: {
    appVariant: APP_VARIANT,
    eas: { projectId: 'ce4d462e-34b5-44d0-8eaa-9361455e2a87' },
  },
};
