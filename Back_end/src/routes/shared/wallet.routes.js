import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { getMyWalletRequests, submitRecharge, submitWithdrawal } from '../../controllers/shared/wallet.controller.js';

const router = Router();
router.post('/wallet/recharge-requests', authenticate, submitRecharge);
router.post('/wallet/withdrawal-requests', authenticate, submitWithdrawal);
router.get('/wallet/requests', authenticate, getMyWalletRequests);
export default router;
