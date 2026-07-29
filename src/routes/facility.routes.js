import express from 'express';
import { getFacilityProfile, updateFacilityProfile } from '../controllers/facility.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/:id', authMiddleware, getFacilityProfile);
router.patch('/:id', authMiddleware, updateFacilityProfile);

export default router;