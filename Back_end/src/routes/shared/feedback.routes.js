import { makeReport, getSentReports, getReceivedReports, makeRate, getSentRates, getReceivedRates, support } from '../../controllers/shared/feedback.controller.js';
import { Router } from 'express';
import { uploadReportAttachment, uploadSupportAttachment } from '../../middlewares/upload.middleware.js';

const router = Router();

router.post('/trips/:tripId/report', uploadReportAttachment.single('attachment'), makeReport);
router.get('/reports/sent', getSentReports);
router.get('/reports/received', getReceivedReports);
router.post('/trips/:tripId/rate', makeRate);
router.get('/rates/sent', getSentRates);
router.get('/rates/received', getReceivedRates);
router.post('/support', uploadSupportAttachment.single('attachment'), support);

export default router;
