import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { getTripMessages } from '../../controllers/shared/message.controller.js';

const router = Router();
router.get('/trips/:tripId/messages', authenticate, getTripMessages);
export default router;
