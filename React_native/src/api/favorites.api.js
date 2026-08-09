import client from './client'

export const getSavedPlacesRequest = () => client.get('/saved-places')
export const createSavedPlaceRequest = data => client.post('/saved-places', data)
export const updateSavedPlaceRequest = (id, data) => client.put(`/saved-places/${id}`, data)
export const deleteSavedPlaceRequest = id => client.delete(`/saved-places/${id}`)

export const getSavedTripsRequest = () => client.get('/saved-trips')
export const createSavedTripRequest = data => client.post('/saved-trips', data)
export const updateSavedTripRequest = (id, data) => client.put(`/saved-trips/${id}`, data)
export const deleteSavedTripRequest = id => client.delete(`/saved-trips/${id}`)
