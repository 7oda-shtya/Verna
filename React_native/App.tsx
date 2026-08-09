import './src/global.css';
import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './src/redux/store';
import RootNavigator from './src/navigation/RootNavigator';
import { restoreSession } from './src/redux/slices/client/authSlice';
import { loadTheme } from './src/redux/slices/client/themeSlice';
import usePushNotifications from './src/client/hooks/usePushNotifications';
import SplashAnimation from './src/shared/components/SplashAnimation';
import { TourBootstrap, TourOverlay, TourProvider } from './src/tour';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

function AppContent() {
	const dispatch = useDispatch<any>();
	const sessionChecked = useSelector((state: any) => state.auth.sessionChecked);
	const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
	usePushNotifications(isAuthenticated);

	const [showSplash, setShowSplash] = useState(true);

	useEffect(() => {
		dispatch(restoreSession());
		dispatch(loadTheme());
	}, [dispatch]);

	useEffect(() => {
		SplashScreen.hideAsync();
	}, []);

	return (
		<TourProvider>
			<TourBootstrap enabled={sessionChecked && !showSplash} />

			{/* بيتركب على طول تحت السبلاش، عشان لما يختفي يبقى فيه محتوى جاهز يظهر فوراً */}
			<RootNavigator />

			<TourOverlay />

			{showSplash && (
				<SplashAnimation
					ready={sessionChecked}
					onFinished={() => setShowSplash(false)}
				/>
			)}
		</TourProvider>
	);
}

export default function App() {
	return (
		<SafeAreaProvider>
			<Provider store={store}>
				<AppContent />
			</Provider>
		</SafeAreaProvider>
	);
}