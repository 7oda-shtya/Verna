import { NavigationContainer } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import AuthNavigator from './AuthNavigator'
import { StatusBar } from 'expo-status-bar'
import { useTheme } from '../theme/useTheme'
import OtpVerificationScreen from '../shared/screens/OtpVerificationScreen'
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
	const auth = useSelector((state: any) => state.auth)
	const isAuthenticated = auth.isAuthenticated
	const phone = auth.phone
	const isPhoneVerified = auth.isPhoneVerified
	// Removed the isAwaitingAdminReview gate that used to force drivers with
	// completed KYC into a full-screen "under review" blocker instead of Home.
	// Drivers now always land on Home once authenticated + phone verified,
	// regardless of admin review status — DriverHome shows a dismissible-free
	// banner instead when the account is still PENDING, linking to KycUpload
	// for edits.
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
					? (isPhoneVerified
						? <AppNavigator key={process.env.APP_VARIANT === 'driver' ? 'driver' : 'client'} />
						: <OtpVerificationScreen key='phone-verification' phone={phone} purpose='PHONE_VERIFICATION' onVerified={() => dispatch(updateClientInfo({ isPhoneVerified: true }))} />)
					: <AuthNavigator key='auth' />}
			</NavigationContainer>
		</>
	)
}

export default RootNavigator