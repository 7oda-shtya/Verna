import { Router } from 'express';
import { register, login, me, updateKyc, toggleDriverStatus } from '../../controllers/driver/auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRole } from '../../middlewares/role.middleware.js';
import { uploadDriverKyc } from '../../middlewares/upload.middleware.js';

const router = Router();

const kycFields = uploadDriverKyc.fields([
	{ name: 'carPicture', maxCount: 1 },
	{ name: 'license', maxCount: 1 },
	{ name: 'carLicense', maxCount: 1 },
	{ name: 'nationalIdFront', maxCount: 1 },
	{ name: 'nationalIdBack', maxCount: 1 },
]);

router.post('/auth/register', kycFields, register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, requireRole('DRIVER'), me);
router.patch('/auth/status', authenticate, requireRole('DRIVER'), toggleDriverStatus);
router.put('/auth/kyc', authenticate, requireRole('DRIVER'), kycFields, updateKyc);

export default router;
