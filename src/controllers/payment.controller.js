import { prisma } from '../config/db.js';
import EscrowService from '../services/escrow.service.js';
import PaystackService from '../services/paystack.service.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { logger } from '../utils/logger.js';

class PaymentController {
  static async list(req, res) {
    try {
      const payments = await prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return successResponse(res, 200, payments);
    } catch (error) {
      logger.error('PaymentController.list error', { error: error.message });
      return errorResponse(res, 500, 'Failed to fetch payments');
    }
  }

  static async initializeEscrow(req, res) {
    try {
      const { shiftId, payerEmail, amount } = req.body;

      if (!shiftId || !payerEmail || !amount) {
        return errorResponse(res, 400, 'shiftId, payerEmail and amount are required');
      }

      const shift = await prisma.shift.findUnique({ where: { id: Number(shiftId) } });
      if (!shift) return errorResponse(res, 404, 'Shift not found');

      const payment = await EscrowService.createEscrow({
        shiftId: Number(shiftId),
        amount: Number(amount),
      });

      const paystackPayload = await PaystackService.initializeTransaction({
        email: payerEmail,
        amount: Number(amount),
        reference: payment.reference,
      });

      return successResponse(res, 201, {
        payment,
        paystack: paystackPayload,
      });
    } catch (error) {
      log('PaymentController.initializeEscrow error', { error: error.message });
      return errorResponse(res, 500, 'Failed to initialize escrow payment');
    }
  }

  static async verifyEscrow(req, res) {
    try {
      const { reference } = req.body;

      if (!reference) return errorResponse(res, 400, 'Payment reference is required');

      const payment = await prisma.payment.findUnique({ where: { reference } });
      if (!payment) return errorResponse(res, 404, 'Payment not found');

      const verification = await PaystackService.verifyTransaction(reference);
      if (verification.status !== 'success') {
        return errorResponse(res, 400, 'Payment not successful');
      }

      const updated = await EscrowService.fundEscrow(payment.id, verification);
      return successResponse(res, 200, { payment: updated, verification });
    } catch (error) {
      logger.error('PaymentController.verifyEscrow error', { error: error.message });
      return errorResponse(res, 500, 'Failed to verify escrow payment');
    }
  }

  static async releaseEscrow(req, res) {
    try {
      const { id } = req.params;

      const payment = await prisma.payment.findUnique({ where: { id: Number(id) } });
      if (!payment) return errorResponse(res, 404, 'Payment not found');

      if (payment.escrowStatus !== 'funded') {
        return errorResponse(res, 400, 'Escrow must be funded before release');
      }

      const released = await EscrowService.releaseEscrow(payment.id);
      return successResponse(res, 200, released);
    } catch (error) {
      logger.error('PaymentController.releaseEscrow error', { error: error.message });
      return errorResponse(res, 500, 'Failed to release escrow');
    }
  }

  static async getOne(req, res) {
    try {
      const { id } = req.params;
      const payment = await prisma.payment.findUnique({ where: { id: Number(id) } });

      if (!payment) return errorResponse(res, 404, 'Payment not found');
      return successResponse(res, 200, payment);
    } catch (error) {
      logger.error('PaymentController.getOne error', { error: error.message });
      return errorResponse(res, 500, 'Failed to fetch payment');
    }
  }
}

export default PaymentController;

