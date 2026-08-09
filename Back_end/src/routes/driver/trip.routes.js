import { Router } from 'express';
import { makeOffer, getTrips, cancelOffer, startTrip, endTrip, cancelBookedTrip, getActiveTrip, getDriverHistory, getDriverEarnings } from '../../controllers/driver/trip.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { requireAccountStatus } from '../../middlewares/accountStatus.middleware.js';

const router = Router();

router.get('/trips', authenticate, requireRole('DRIVER'), requireAccountStatus, getTrips);
router.get('/trips/active', authenticate, requireRole('DRIVER'), requireAccountStatus, getActiveTrip);
router.get('/trips/history', authenticate, requireRole('DRIVER'), requireAccountStatus, getDriverHistory);
router.get('/earnings', authenticate, requireRole('DRIVER'), requireAccountStatus, getDriverEarnings);
router.post('/trips/:tripId/offer', authenticate, requireRole('DRIVER'), requireAccountStatus, makeOffer);
router.patch('/trips/:tripId/start', authenticate, requireRole('DRIVER'), requireAccountStatus, startTrip);
router.patch('/trips/:tripId/end', authenticate, requireRole('DRIVER'), requireAccountStatus, endTrip);
router.patch('/trips/:tripId/cancel', authenticate, requireRole('DRIVER'), requireAccountStatus, cancelBookedTrip);
router.patch('/offers/:offerId/cancel', authenticate, requireRole('DRIVER'), requireAccountStatus, cancelOffer);

export default router;
