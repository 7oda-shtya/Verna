import { Router } from 'express';
import { getRoute } from '../../controllers/shared/routing.controller.js';

const router = Router();
router.post('/route', getRoute);

export default router;