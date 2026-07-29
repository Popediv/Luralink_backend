import express from 'express';
import PaymentController from '../controllers/payment.controller.js';

const router = express.Router();

router.get('/', PaymentController.list);
router.get('/:id', PaymentController.getOne);
router.post('/initialize', PaymentController.initializeEscrow);
router.post('/verify', PaymentController.verifyEscrow);
router.post('/:id/release', PaymentController.releaseEscrow);

export default router;
