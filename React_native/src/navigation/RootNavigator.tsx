import { NavigationContainer } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import AuthNavigator from './AuthNavigator'
import { StatusBar } from 'expo-status-bar'
import { useTheme } from '../theme/useTheme'
import OtpVerificationScreen from '../shared/screens/OtpVerificationScreen'
import DriverAccountPendingScreen from '../shared/screens/DriverAccountPendingScreen'
import { updateClientInfo } from '../redux/slices/client/authSlice'

const AppNavigator = process.env.APP_VARIANT === 'driver'
	? (
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		require('./DriverNavigator').default
	)
	: (
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		require('./ClientNavigator').default
	)

const RootNavigator = () => {
	const dispatch = useDispatch()
	const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated)
	const phone = useSelector((state: any) => state.auth.phone)
	const isPhoneVerified = useSelector((state: any) => state.auth.isPhoneVerified)
	const isDriverPendingReview = useSelector((state: any) => state.auth.isDriverPendingReview)
	const { theme } = useTheme()
	const navigationTheme = {
		dark: theme.isDark,
		colors: {
			primary: theme.colors.primary,
			background: theme.colors.background,
			card: theme.colors.surface,
			text: theme.colors.textPrimary,
			border: theme.colors.border,
			notification: theme.colors.error,
		},
		fonts: {
			regular: { fontFamily: 'System', fontWeight: '400' },
			medium: { fontFamily: 'System', fontWeight: '500' },
			bold: { fontFamily: 'System', fontWeight: '700' },
			heavy: { fontFamily: 'System', fontWeight: '900' },
		},
	} as const

	return (
		<>
			<StatusBar style={theme.statusBarStyle} />
			<NavigationContainer theme={navigationTheme}>
				{isAuthenticated
					? (isDriverPendingReview
						? <DriverAccountPendingScreen key='driver-pending-review' />
						: isPhoneVerified
						? <AppNavigator key={process.env.APP_VARIANT === 'driver' ? 'driver' : 'client'} />
						: <OtpVerificationScreen key='phone-verification' phone={phone} purpose='PHONE_VERIFICATION' onVerified={() => dispatch(updateClientInfo({ isPhoneVerified: true }))} />)
					: <AuthNavigator key='auth' />}
			</NavigationContainer>
		</>
	)
}

export default RootNavigator
