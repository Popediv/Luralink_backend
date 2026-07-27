import express from 'express';
import { getWorkerProfile, updateWorkerProfile } from '../controllers/worker.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/:id', authMiddleware, getWorkerProfile);
router.patch('/:id', authMiddleware, updateWorkerProfile);

export default router;