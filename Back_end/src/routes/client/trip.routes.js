import { Router } from 'express';
import { RequestTrip, updateTrip, cancelTrip, acceptOffer, getPendingTripOffers, getMyTrips } from '../../controllers/client/trip.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { checkPendingFine } from '../../middlewares/fine.middleware.js';
import { requireAccountStatus } from '../../middlewares/accountStatus.middleware.js';
import { requirePhoneVerified } from '../../middlewares/phoneVerified.middleware.js';

const router = Router();

router.post('/trips', checkPendingFine, requireAccountStatus, requirePhoneVerified, RequestTrip);
router.patch('/trips/:tripId', requireAccountStatus, requirePhoneVerified, updateTrip);
router.patch('/trips/:tripId/cancel', cancelTrip);
router.patch('/offers/:offerId/accept', acceptOffer);
router.get('/trips', getMyTrips);
router.get('/trips/:tripId/offers', getPendingTripOffers);

export default router;
