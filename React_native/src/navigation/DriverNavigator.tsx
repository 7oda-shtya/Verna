import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DriverTabs from './DriverTabs'
import TripDetails from '../driver/screens/TripDetails'
import ActiveTrip from '../driver/screens/ActiveTrip'
import KycUpload from '../driver/screens/KycUpload'
import WalletRequests from '../client/screens/WalletRequests'
import TripChatScreen from '../shared/screens/TripChatScreen'
import DriverPushNotificationListener from '../driver/components/DriverPushNotificationListener'

const Stack = createNativeStackNavigator()

const DriverNavigator = () => (
	<>
		<DriverPushNotificationListener />
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name='DriverTabs' component={DriverTabs} />
			<Stack.Screen name='TripDetails' component={TripDetails} options={{ animation: 'slide_from_right' }} />
			<Stack.Screen name='ActiveTrip' component={ActiveTrip} options={{ animation: 'slide_from_right' }} />
			<Stack.Screen name='KycUpload' component={KycUpload} options={{ animation: 'slide_from_right' }} />
			<Stack.Screen name='WalletRequests' component={WalletRequests} options={{ animation: 'slide_from_right' }} />
			<Stack.Screen name='TripChat' component={TripChatScreen} options={{ headerShown: true, title: 'محادثة الرحلة' }} />
		</Stack.Navigator>
	</>
)

export default DriverNavigator
