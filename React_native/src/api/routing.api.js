import client from './client';

export const getRouteRequest = async points => {
  return await client.post('/routing/route', { points });
};
