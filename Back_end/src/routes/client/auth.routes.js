import { Router } from 'express';
import { register, login, me, updateProfile, changePassword, deleteAccount } from '../../controllers/client/auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { uploadAvatar } from '../../middlewares/upload.middleware.js';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, me);
router.put('/auth/profile', authenticate, uploadAvatar.single('avatar'), updateProfile);
router.patch('/auth/password', authenticate, changePassword);
router.delete('/auth/account', authenticate, deleteAccount);

export default router;
 
