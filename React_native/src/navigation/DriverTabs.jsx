import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import DriverTabBar from '../driver/components/DriverTabBar'
import DriverHome from '../driver/screens/DriverHome'
import MyOffers from '../driver/screens/MyOffers'
import DriverProfile from '../driver/screens/DriverProfile'

const Tab = createBottomTabNavigator()

// Mirrors src/navigation/ClientTabs.jsx: the tabbed screens live here, any other screen
// (TripDetails, ActiveTrip, KycUpload, WalletRequests, ...) stays in the Stack in DriverNavigator
// so it doesn't get the floating tab bar.
const DriverTabs = () => {
	return (
		<Tab.Navigator screenOptions={{ headerShown: false }} tabBar={props => <DriverTabBar {...props} />}>
			<Tab.Screen name='Home' component={DriverHome} />
			<Tab.Screen name='MyOffers' component={MyOffers} />
			<Tab.Screen name='Profile' component={DriverProfile} />
		</Tab.Navigator>
	)
}

export default DriverTabs
