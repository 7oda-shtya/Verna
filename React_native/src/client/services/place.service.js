import client from '../../api/client'

export const searchPlaceRequest = (query) => client.get('/places/search', { params: { q: query } })

export const nearbyPlacesRequest = ({ minLat, minLng, maxLat, maxLng }) =>
	client.get('/places/nearby', { params: { minLat, minLng, maxLat, maxLng } })

export const nearestPlaceRequest = (lat, lng) =>
	client.get('/places/nearest', { params: { lat, lng } })