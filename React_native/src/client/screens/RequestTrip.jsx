import {useDispatch} from 'react-redux'
import {useState , useEffect} from 'react'
import {getRouteRequest} from '../../api/routing.api'
import { SafeAreaView, Pressable, Text } from 'react-native'
import TripRouteMap from '../components/map/TripRouteMap'

const RequestTrip = () => {
	const dispatch = useDispatch()
	const [tripDraft, setTripDraft] = useState({ startPin: null, endPin: null, waypoints: [], route: null })
	const [pickTarget, setPickTarget] = useState('start')

	const handleMapPress = (coord) => {
		const pin = { lat: coord.latitude, lng: coord.longitude, name: '...' }
		setTripDraft(prev => {
			if (pickTarget === 'start') return { ...prev, startPin: pin }
			if (pickTarget === 'end') return { ...prev, endPin: pin }
			return { ...prev, waypoints: [...prev.waypoints, pin] }
		})
	}

	useEffect(() => {
		if (!tripDraft.startPin || !tripDraft.endPin) return
		const points = [tripDraft.startPin, ...tripDraft.waypoints, tripDraft.endPin]
		getRouteRequest(points).then(res => setTripDraft(prev => ({ ...prev, route: res.data })))
	}, [tripDraft.startPin, tripDraft.endPin, tripDraft.waypoints])

	const handleConfirm = () => {
		dispatch(requestTrip({ ...tripDraft, clientId, price: tripDraft.route?.price }))
	}

	return (
		<SafeAreaView className='flex-1'>
			<TripRouteMap
				startPin={tripDraft.startPin} endPin={tripDraft.endPin} waypoints={tripDraft.waypoints}
				routeCoordinates={tripDraft.route?.coordinates || []}
				onMapPress={handleMapPress} pickTarget={pickTarget}
			/>
			<Pressable onPress={handleConfirm}><Text>تأكيد الطلب</Text></Pressable>
		</SafeAreaView>
	)
}

export default RequestTrip