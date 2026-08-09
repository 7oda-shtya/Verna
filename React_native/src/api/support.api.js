import client from './client';

export const sendSupportMessageRequest = formData => client.post('/shared/support', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
