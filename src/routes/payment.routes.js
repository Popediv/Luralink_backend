import express from 'express';
import PaymentController from '../controllers/payment.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import roleMiddleware from '../middleware/role.middleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', roleMiddleware(['facility_admin', 'platform_admin']), PaymentController.list);
router.get('/:id', PaymentController.getOne);
router.post('/initialize', roleMiddleware(['facility_admin']), PaymentController.initializeEscrow);
router.post('/verify', roleMiddleware(['facility_admin']), PaymentController.verifyEscrow);
router.post('/:id/release', roleMiddleware(['facility_admin', 'platform_admin']), PaymentController.releaseEscrow);

export default router;
