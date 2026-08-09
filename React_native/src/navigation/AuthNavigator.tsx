import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Login from '../shared/screens/Login'
import SignUp from '../client/screens/SignUp'
import DriverSignUp from '../driver/screens/DriverSignUp'
import ForgotPasswordScreen from '../shared/screens/ForgotPasswordScreen'
import OtpVerificationScreen from '../shared/screens/OtpVerificationScreen'
import NewPasswordScreen from '../shared/screens/NewPasswordScreen'
import Support from '../client/screens/Support'

const Stack = createNativeStackNavigator()
const SignUpScreen = process.env.APP_VARIANT === 'driver' ? DriverSignUp : SignUp

const AuthNavigator = () => {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom', animationDuration: 260 }}>
			<Stack.Screen name='Login' component={Login} />
			<Stack.Screen name='SignUp' component={SignUpScreen} />
			<Stack.Screen name='ForgotPassword' component={ForgotPasswordScreen} />
			<Stack.Screen name='OtpVerification' component={OtpVerificationScreen} />
			<Stack.Screen name='NewPassword' component={NewPasswordScreen} />
			<Stack.Screen name='Support' component={Support} />
		</Stack.Navigator>
	)
}

export default AuthNavigator
