import express from 'express';
import { selectApplicant, listMyApplications } from '../controllers/application.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/mine', roleMiddleware(['worker']), listMyApplications);
router.patch('/:id/select', roleMiddleware(['facility_admin']), selectApplicant);

export default router;