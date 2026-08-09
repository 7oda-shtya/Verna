import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ClientTabs from './ClientTabs'
import RequestTrip from '../client/screens/RequestTrip'
import Offers from '../client/screens/Offers'
import EditProfile from '../client/screens/EditProfile'
import TripTrackingScreen from '../shared/screens/TripTrackingScreen'
import TripChatScreen from '../shared/screens/TripChatScreen'
import WalletRequests from '../client/screens/WalletRequests'
import ChangePassword from '../client/screens/ChangePassword'
import Support from '../client/screens/Support'
import ForgotPasswordScreen from '../shared/screens/ForgotPasswordScreen'
import OtpVerificationScreen from '../shared/screens/OtpVerificationScreen'
import NewPasswordScreen from '../shared/screens/NewPasswordScreen'

const Stack = createNativeStackNavigator()

const ClientNavigator = () => {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName='ClientTabs'>
			{/* الشاشة دي هي اللي فيها التابز الأربعة والناف بار العائم */}
			<Stack.Screen name='ClientTabs' component={ClientTabs} />

			{/* شاشات لوحدها من غير ناف بار - زي شاشة كاملة لطلب رحلة أو تعديل بروفايل */}
			<Stack.Screen name='RequestTrip' component={RequestTrip} options={{ animation: 'slide_from_right' }} />
			<Stack.Screen name='Offers' component={Offers} options={{ animation: 'slide_from_right' }} />
			<Stack.Screen name='EditProfile' component={EditProfile} options={{ animation: 'slide_from_right' }} />
			<Stack.Screen name='TripTracking' component={TripTrackingScreen} options={{ animation: 'slide_from_right' }} />
			<Stack.Screen name='TripChat' component={TripChatScreen} options={{ headerShown: true, title: 'محادثة الرحلة' }} />
			<Stack.Screen name='WalletRequests' component={WalletRequests} options={{ animation: 'slide_from_right' }} />
			<Stack.Screen name='ChangePassword' component={ChangePassword} options={{ animation: 'slide_from_right' }} />
			<Stack.Screen name='Support' component={Support} options={{ animation: 'slide_from_right' }} />
			<Stack.Screen name='AccountPasswordReset' component={ForgotPasswordScreen} initialParams={{ accountMode: true }} options={{ animation: 'slide_from_right' }} />
			<Stack.Screen name='OtpVerification' component={OtpVerificationScreen} options={{ animation: 'slide_from_right' }} />
			<Stack.Screen name='NewPassword' component={NewPasswordScreen} options={{ animation: 'slide_from_right' }} />
		</Stack.Navigator>
	)
}

export default ClientNavigator
