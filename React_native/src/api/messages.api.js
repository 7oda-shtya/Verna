import client from './client';

export const getTripMessagesRequest = tripId => client.get(`/trips/${tripId}/messages`);
