import express from 'express';
import {
  uploadDocument,
  getPendingVerifications,
  reviewVerification
} from '../controllers/verification.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import roleMiddleware  from '../middleware/role.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

router.post('/upload', authMiddleware, upload.single('document'), uploadDocument);
router.get('/admin/pending', authMiddleware, roleMiddleware(['platform_admin']), getPendingVerifications);
router.patch('/admin/:id', authMiddleware, roleMiddleware(['platform_admin']), reviewVerification);

export default router;