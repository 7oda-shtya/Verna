import { Router } from 'express';
import { requestOtp, resetPassword, verifyOtp } from '../../controllers/shared/otp.controller.js';
import { otpRequestLimiter } from '../../middlewares/rateLimit.middleware.js';

const router = Router();
router.post('/auth/otp/request', otpRequestLimiter, requestOtp);
router.post('/auth/otp/verify', verifyOtp);
router.post('/auth/password/reset', resetPassword);
export default router;
