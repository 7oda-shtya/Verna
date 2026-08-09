import { Router } from 'express';
import { searchPlaces, getNearbyPlaces, getNearestPlace } from '../../controllers/shared/places.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { placesSearchLimiter } from '../../middlewares/rateLimit.middleware.js';

const router = Router();
router.get('/search', authenticate, placesSearchLimiter, searchPlaces);
router.get('/nearby', authenticate, getNearbyPlaces);
router.get('/nearest', authenticate, getNearestPlace);

export default router;