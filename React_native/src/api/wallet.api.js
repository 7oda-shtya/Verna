import client from './client';

export const getWalletRequests = () => client.get('/wallet/requests');
export const submitRechargeRequest = (amount, proof) => client.post('/wallet/recharge-requests', { amount, proof });
