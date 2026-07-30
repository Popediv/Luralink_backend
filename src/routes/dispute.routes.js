import express from 'express';
import {
    createDispute,
    listDisputes,
    getDispute,
    ruleDispute,
} from '../controllers/dispute.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authMiddleware);

// POST /api/disputes  – worker or facility_admin raises a dispute
router.post('/', roleMiddleware(['worker', 'facility_admin']), createDispute);

// GET /api/disputes  – platform_admin sees all disputes (with optional ?ruled= filter)
router.get('/', roleMiddleware(['platform_admin']), listDisputes);

// GET /api/disputes/:id  – platform_admin views one dispute
router.get('/:id', roleMiddleware(['platform_admin']), getDispute);

// PATCH /api/disputes/:id/rule  – platform_admin rules on a dispute
router.patch('/:id/rule', roleMiddleware(['platform_admin']), ruleDispute);

export default router;
