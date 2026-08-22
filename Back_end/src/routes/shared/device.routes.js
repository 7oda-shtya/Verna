import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { registerDeviceToken } from '../../controllers/shared/device.controller.js';

const router = Router();

router.post('/devices/push-token', authenticate, registerDeviceToken);

export default router;
