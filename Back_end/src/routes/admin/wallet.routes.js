import { Router } from 'express';
import { getPendingWalletRequests, reviewWalletRequest } from '../../controllers/admin/wallet.controller.js';

const router = Router();
router.get('/requests', getPendingWalletRequests);
router.patch('/requests/:type/:id', reviewWalletRequest);
export default router;
