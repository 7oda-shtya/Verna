import { Router } from 'express'
import {
	createSavedPlace,
	deleteSavedPlace,
	getSavedPlaces,
	updateSavedPlace,
} from '../../controllers/client/savedPlaces.controller.js'
import { authenticate } from '../../middlewares/auth.middleware.js'

const router = Router()

router.get('/saved-places', authenticate, getSavedPlaces)
router.post('/saved-places', authenticate, createSavedPlace)
router.put('/saved-places/:id', authenticate, updateSavedPlace)
router.delete('/saved-places/:id', authenticate, deleteSavedPlace)

export default router
