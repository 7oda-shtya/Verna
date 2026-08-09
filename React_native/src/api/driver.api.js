import client from './client';

export const getAvailableTripsRequest = () => client.get('/driver/trips');

export const getActiveTripRequest = () => client.get('/driver/trips/active');

export const toggleDriverStatusRequest = isOnline => client.patch('/driver/auth/status', { isOnline });

export const getDriverHistoryRequest = () => client.get('/driver/trips/history');

export const getDriverEarningsRequest = () => client.get('/driver/earnings');

export const makeOfferRequest = (tripId, offer) => client.post(`/driver/trips/${tripId}/offer`, offer);

export const cancelOfferRequest = offerId => client.patch(`/driver/offers/${offerId}/cancel`);

export const endTripRequest = (tripId, resolution) => client.patch(`/driver/trips/${tripId}/end`, resolution ? { resolution } : {});

export const startTripRequest = tripId => client.patch(`/driver/trips/${tripId}/start`);

export const cancelBookedTripRequest = tripId => client.patch(`/driver/trips/${tripId}/cancel`);

export const updateKycRequest = formData => client.put('/driver/auth/kyc', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
