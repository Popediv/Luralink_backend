import { prisma } from '../config/db.js';
import PaystackService from './paystack.service.js';
import { logger } from '../utils/logger.js';

class EscrowService {
  static async createEscrow({ shiftId, amount }) {
    const reference = `escrow_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const payment = await prisma.payment.create({
      data: {
        shiftId,
        amount,
        escrowStatus: 'pending',
        reference,
      },
    });

    return payment;
  }

  static async fundEscrow(paymentId, verification) {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        escrowStatus: 'funded',
        releasedAt: null,
      },
    });

    logger.info('Escrow funded', { paymentId: payment.id, reference: verification.reference });
    return payment;
  }

  static async releaseEscrow(paymentId) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error('Payment not found');
    if (payment.escrowStatus !== 'funded') throw new Error('Escrow not funded');

    // Transfer from Paystack balance to recipient account
    // Replace recipientAccount with actual Paystack recipient code
    const transferResult = await PaystackService.transferToRecipient({
      amount: payment.amount,
      recipientAccount: 'RCP_gx4jbl0vn0a3w6m', // placeholder
    });

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        escrowStatus: 'released',
        releasedAt: new Date(),
      },
    });

    logger.info('Escrow released', { paymentId, transferResult });
    return updated;
  }

  static async refundEscrow(paymentId) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error('Payment not found');
    if (payment.escrowStatus !== 'funded') throw new Error('Escrow not funded');

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        escrowStatus: 'refunded',
      },
    });

    logger.info('Escrow refunded', { paymentId });
    return updated;
  }
}

export default EscrowService;